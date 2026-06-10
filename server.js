import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AI_DIFFICULTIES, MATCH, MODES, VERSION, normalizeDifficulty, normalizeName } from "./public/src/shared/constants.js";
import { createAiInput } from "./public/src/shared/ai.js";
import { createGameState, simulateTick } from "./public/src/shared/physics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(process.env.PORT || readPortFromArgs() || 7777);

const clients = new Map();
const rooms = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = createServer(handleHttpRequest);
server.on("upgrade", handleUpgrade);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\nPixel Court v${VERSION}`);
  console.log(`Local:   http://localhost:${PORT}`);
  for (const address of getLanAddresses()) {
    console.log(`LAN:     http://${address}:${PORT}`);
  }
  console.log("\nShare one of the LAN URLs with players on the same Wi-Fi/network.\n");
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (!room.game) continue;
    if (room.paused || room.game.paused) continue;
    const inputs = {};
    for (const player of room.players.values()) {
      if (!player.seat || player.spectator) continue;
      if (player.bot) {
        inputs[player.id] = createAiInput(room.game, player.id, player.difficulty || room.aiDifficulty);
      } else {
        const client = clients.get(player.id);
        inputs[player.id] = client?.input || EMPTY_INPUT;
      }
    }
    simulateTick(room.game, inputs);
    if (room.game.tick % MATCH.broadcastEveryTicks === 0 || room.game.phase === "matchOver") {
      broadcastGame(room);
    }
  }
}, 1000 / MATCH.tickRate);

function readPortFromArgs() {
  const arg = process.argv.find((value) => value.startsWith("--port="));
  return arg ? arg.split("=")[1] : null;
}

function handleHttpRequest(req, res) {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/health") {
    sendJson(res, { ok: true, rooms: rooms.size, players: clients.size, version: VERSION });
    return;
  }
  if (pathname === "/") pathname = "/index.html";

  const resolved = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const filePath = existsSync(resolved) && statSync(resolved).isDirectory()
    ? path.join(resolved, "index.html")
    : resolved;

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[extension] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  createReadStream(filePath).pipe(res);
}

function sendJson(res, payload) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function handleUpgrade(req, socket) {
  const key = req.headers["sec-websocket-key"];
  if (!key || req.headers.upgrade?.toLowerCase() !== "websocket") {
    socket.destroy();
    return;
  }

  const accept = createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    ""
  ].join("\r\n"));

  const connection = new TinyWebSocket(socket);
  const client = {
    id: makeId("p"),
    connection,
    roomCode: null,
    name: "Lan Player",
    input: { ...EMPTY_INPUT },
    joinedAt: Date.now()
  };
  clients.set(client.id, client);

  connection.onMessage = (text) => handleClientMessage(client, text);
  connection.onClose = () => disconnectClient(client);
  connection.send({ type: "welcome", playerId: client.id, version: VERSION });
}

class TinyWebSocket {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.closed = false;
    this.onMessage = () => {};
    this.onClose = () => {};

    socket.on("data", (chunk) => this.handleData(chunk));
    socket.on("close", () => this.closeSilently());
    socket.on("error", () => this.closeSilently());
  }

  handleData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const frame = this.readFrame();
      if (!frame) return;
      this.buffer = this.buffer.slice(frame.length);

      if (frame.opcode === 0x8) {
        this.close();
        return;
      }
      if (frame.opcode === 0x9) {
        this.sendFrame(0xA, frame.payload);
        continue;
      }
      if (frame.opcode === 0x1) {
        this.onMessage(frame.payload.toString("utf8"));
      }
    }
  }

  readFrame() {
    const first = this.buffer[0];
    const second = this.buffer[1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let offset = 2;

    if (length === 126) {
      if (this.buffer.length < offset + 2) return null;
      length = this.buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (this.buffer.length < offset + 8) return null;
      const bigLength = this.buffer.readBigUInt64BE(offset);
      if (bigLength > BigInt(1024 * 1024)) {
        this.close();
        return null;
      }
      length = Number(bigLength);
      offset += 8;
    }

    let mask;
    if (masked) {
      if (this.buffer.length < offset + 4) return null;
      mask = this.buffer.slice(offset, offset + 4);
      offset += 4;
    }

    if (this.buffer.length < offset + length) return null;
    const payload = Buffer.from(this.buffer.slice(offset, offset + length));
    if (masked && mask) {
      for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
    }
    return { opcode, payload, length: offset + length };
  }

  send(payload) {
    if (this.closed) return;
    const text = typeof payload === "string" ? payload : JSON.stringify(payload);
    this.sendFrame(0x1, Buffer.from(text, "utf8"));
  }

  sendFrame(opcode, payload) {
    if (this.closed) return;
    const length = payload.length;
    let header;
    if (length < 126) {
      header = Buffer.alloc(2);
      header[1] = length;
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }
    header[0] = 0x80 | opcode;
    this.socket.write(Buffer.concat([header, payload]));
  }

  close() {
    if (this.closed) return;
    try {
      this.sendFrame(0x8, Buffer.alloc(0));
      this.closed = true;
      this.socket.end();
    } catch {
      this.closed = true;
      this.socket.destroy();
    }
    this.onClose();
  }

  closeSilently() {
    if (this.closed) return;
    this.closed = true;
    this.onClose();
  }
}

function handleClientMessage(client, text) {
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    sendError(client, "That packet was not valid JSON.");
    return;
  }

  switch (message.type) {
    case "setName":
      setClientName(client, message.name);
      break;
    case "createRoom":
      createRoom(client, message.mode, message.name);
      break;
    case "createAiRoom":
      createAiRoom(client, message.difficulty, message.name);
      break;
    case "joinRoom":
      joinRoom(client, message.code, message.name);
      break;
    case "leaveRoom":
      leaveRoom(client, true);
      break;
    case "ready":
      toggleReady(client, message.ready);
      break;
    case "startMatch":
      startMatch(client);
      break;
    case "togglePause":
      togglePause(client);
      break;
    case "input":
      client.input = sanitizeInput(message.input);
      break;
    case "ping":
      client.connection.send({ type: "pong", time: Date.now() });
      break;
    default:
      sendError(client, `Unknown message type: ${message.type || "missing"}`);
  }
}

function setClientName(client, name) {
  client.name = normalizeName(name);
  const room = getClientRoom(client);
  if (room) {
    const player = room.players.get(client.id);
    if (player) player.name = client.name;
    broadcastRoom(room);
  }
}

function createRoom(client, modeKey = "singles", name) {
  setClientName(client, name);
  const mode = MODES[modeKey] && modeKey !== "ai" ? modeKey : "singles";
  leaveRoom(client, false);
  const code = makeRoomCode();
  const room = {
    code,
    mode,
    hostId: client.id,
    aiDifficulty: null,
    players: new Map(),
    game: null,
    paused: false,
    createdAt: Date.now()
  };
  rooms.set(code, room);
  addClientToRoom(client, room);
  sendNotice(client, `Created ${MODES[mode].label} room ${code}.`);
  broadcastRoom(room);
}

function createAiRoom(client, difficulty = "medium", name) {
  setClientName(client, name);
  const aiDifficulty = normalizeDifficulty(difficulty);
  leaveRoom(client, false);
  const code = makeRoomCode();
  const room = {
    code,
    mode: "ai",
    hostId: client.id,
    aiDifficulty,
    players: new Map(),
    game: null,
    paused: false,
    createdAt: Date.now()
  };
  rooms.set(code, room);
  addClientToRoom(client, room);
  addComputerToRoom(room, aiDifficulty);
  sendNotice(client, `Created Vs Computer room ${code} on ${AI_DIFFICULTIES[aiDifficulty].label}.`);
  broadcastRoom(room);
}

function addComputerToRoom(room, difficulty) {
  const id = makeId("cpu");
  const config = AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.medium;
  room.players.set(id, {
    id,
    name: `${config.label} Glade CPU`,
    ready: true,
    seat: null,
    spectator: false,
    bot: true,
    difficulty
  });
  reseatRoom(room);
}

function joinRoom(client, code, name) {
  setClientName(client, name);
  const normalized = String(code || "").trim().toUpperCase();
  const room = rooms.get(normalized);
  if (!room) {
    sendError(client, "No LAN room found with that code.");
    return;
  }
  leaveRoom(client, false);
  addClientToRoom(client, room);
  sendNotice(client, `Joined room ${room.code}.`);
  broadcastRoom(room);
}

function addClientToRoom(client, room) {
  client.roomCode = room.code;
  room.players.set(client.id, {
    id: client.id,
    name: client.name,
    ready: false,
    seat: null,
    spectator: false
  });
  reseatRoom(room);
}

function leaveRoom(client, notify = true) {
  const room = getClientRoom(client);
  if (!room) return;

  room.players.delete(client.id);
  client.roomCode = null;
  client.input = { ...EMPTY_INPUT };

  const humanPlayers = [...room.players.values()].filter((player) => !player.bot);
  if (humanPlayers.length === 0) {
    rooms.delete(room.code);
    if (notify) sendNotice(client, "Left the room.");
    return;
  }

  if (room.hostId === client.id) {
    room.hostId = humanPlayers[0].id;
  }

  if (room.game) {
    room.game = null;
    room.paused = false;
    for (const player of room.players.values()) player.ready = false;
    broadcastNotice(room, "Match paused because a player left. Ready up to restart.");
  }

  reseatRoom(room);
  broadcastRoom(room);
  if (notify) sendNotice(client, "Left the room.");
}

function disconnectClient(client) {
  leaveRoom(client, false);
  clients.delete(client.id);
}

function toggleReady(client, readyValue) {
  const room = getClientRoom(client);
  if (!room) {
    sendError(client, "Join or create a room first.");
    return;
  }
  const player = room.players.get(client.id);
  if (!player || player.spectator) {
    sendError(client, "Spectators cannot ready up for this match.");
    return;
  }
  player.ready = typeof readyValue === "boolean" ? readyValue : !player.ready;
  broadcastRoom(room);
}

function startMatch(client) {
  const room = getClientRoom(client);
  if (!room) {
    sendError(client, "Join or create a room first.");
    return;
  }
  if (room.hostId !== client.id) {
    sendError(client, "Only the room host can start the match.");
    return;
  }

  reseatRoom(room);
  const mode = MODES[room.mode];
  const seated = [...room.players.values()].filter((player) => player.seat && !player.spectator);
  if (seated.length < mode.maxPlayers) {
    sendError(client, `${mode.label} needs ${mode.maxPlayers} nearby player${mode.maxPlayers > 1 ? "s" : ""}.`);
    return;
  }
  const notReady = seated.filter((player) => !player.ready);
  if (notReady.length > 0) {
    sendError(client, `Waiting on: ${notReady.map((player) => player.name).join(", ")}.`);
    return;
  }

  room.paused = false;
  room.game = createGameState(roomSnapshot(room));
  room.game.paused = false;
  broadcastRoom(room);
  broadcastGame(room);
}


function togglePause(client) {
  const room = getClientRoom(client);
  if (!room || !room.game) {
    sendError(client, "Start an AI match before pausing.");
    return;
  }
  if (room.mode !== "ai") {
    sendError(client, "Pause is only enabled for Vs Computer matches.");
    return;
  }
  if (room.game.phase === "matchOver") return;

  if (!room.paused) room.resumeMessage = room.game.message;
  room.paused = !room.paused;
  room.game.paused = room.paused;
  room.game.message = room.paused ? "Paused — press Esc to resume" : (room.resumeMessage || "Rally!");
  broadcastRoom(room);
  broadcastGame(room);
}

function reseatRoom(room) {
  const mode = MODES[room.mode];
  const orderedPlayers = orderedPlayersForSeating(room, mode);
  let index = 0;
  for (const player of orderedPlayers) {
    if (index < mode.maxPlayers) {
      player.seat = mode.seats[index];
      player.spectator = false;
      if (player.bot) player.ready = true;
      index += 1;
    } else {
      player.seat = null;
      if (!player.bot) player.ready = false;
      player.spectator = true;
    }
  }
}

function orderedPlayersForSeating(room, mode) {
  const players = [...room.players.values()];
  if (mode.key !== "ai") return players;
  const humans = players.filter((player) => !player.bot);
  const bots = players.filter((player) => player.bot);
  return [humans[0], bots[0], ...humans.slice(1), ...bots.slice(1)].filter(Boolean);
}

function roomSnapshot(room) {
  const mode = MODES[room.mode];
  const players = [...room.players.values()].map((player) => ({
    id: player.id,
    name: player.name,
    ready: player.ready,
    seat: player.seat,
    spectator: player.spectator,
    bot: !!player.bot,
    difficulty: player.difficulty || null,
    isHost: player.id === room.hostId
  }));
  const seatedCount = players.filter((player) => player.seat && !player.spectator).length;
  const readyCount = players.filter((player) => player.seat && !player.spectator && player.ready).length;
  return {
    code: room.code,
    mode: room.mode,
    modeLabel: mode.label,
    maxPlayers: mode.maxPlayers,
    maxHumans: mode.maxHumans,
    aiDifficulty: room.aiDifficulty,
    aiDifficultyLabel: room.aiDifficulty ? AI_DIFFICULTIES[room.aiDifficulty]?.label : null,
    hostId: room.hostId,
    players,
    seatedCount,
    readyCount,
    canStart: seatedCount === mode.maxPlayers && readyCount === mode.maxPlayers,
    paused: !!room.paused,
    phase: room.game ? (room.paused ? "paused" : room.game.phase) : "lobby",
    createdAt: room.createdAt
  };
}

function broadcastRoom(room) {
  const payload = { type: "roomState", room: roomSnapshot(room) };
  for (const player of room.players.values()) {
    if (player.bot) continue;
    clients.get(player.id)?.connection.send(payload);
  }
}


function compactGameState(game) {
  if (!game) return null;

  const players = {};
  for (const [id, player] of Object.entries(game.players || {})) {
    players[id] = {
      id: player.id,
      name: player.name,
      team: player.team,
      slot: player.slot,
      bot: !!player.bot,
      x: Math.round(player.x * 10) / 10,
      y: Math.round(player.y * 10) / 10,
      vx: Math.round(player.vx * 10) / 10,
      vy: Math.round(player.vy * 10) / 10,
      facing: player.facing,
      onGround: !!player.onGround,
      swing: player.swing,
      hueSeed: player.hueSeed
    };
  }

  const ball = game.ball ? {
    x: Math.round(game.ball.x * 10) / 10,
    y: Math.round(game.ball.y * 10) / 10,
    vx: Math.round(game.ball.vx * 10) / 10,
    vy: Math.round(game.ball.vy * 10) / 10,
    radius: game.ball.radius,
    trail: (game.ball.trail || []).slice(0, 5).map((point) => ({
      x: Math.round(point.x * 10) / 10,
      y: Math.round(point.y * 10) / 10
    }))
  } : null;

  return {
    version: game.version,
    mode: game.mode,
    phase: game.phase,
    paused: !!game.paused,
    tick: game.tick,
    countdown: game.countdown,
    message: game.message,
    score: game.score,
    games: game.games,
    points: game.points,
    pointLabels: game.pointLabels,
    tennisLabel: game.tennisLabel,
    gameScoreLabel: game.gameScoreLabel,
    matchTargetGames: game.matchTargetGames,
    rally: game.rally,
    longestRally: game.longestRally,
    winner: game.winner,
    players,
    ball,
    sparks: (game.sparks || []).slice(-16).map((spark) => ({
      x: Math.round(spark.x),
      y: Math.round(spark.y),
      vx: Math.round(spark.vx * 10) / 10,
      vy: Math.round(spark.vy * 10) / 10,
      color: spark.color,
      life: spark.life
    }))
  };
}

function broadcastGame(room) {
  const payload = { type: "gameState", state: compactGameState(room.game) };
  for (const player of room.players.values()) {
    if (player.bot) continue;
    clients.get(player.id)?.connection.send(payload);
  }
}

function broadcastNotice(room, text) {
  for (const player of room.players.values()) sendNotice(clients.get(player.id), text);
}

function sendNotice(client, text) {
  if (!client) return;
  client.connection.send({ type: "notice", text });
}

function sendError(client, text) {
  client.connection.send({ type: "error", text });
}

function getClientRoom(client) {
  return client.roomCode ? rooms.get(client.roomCode) : null;
}

function sanitizeInput(input = {}) {
  return {
    left: !!input.left,
    right: !!input.right,
    jump: !!input.jump,
    down: !!input.down,
    swing: !!input.swing
  };
}

function makeId(prefix = "id") {
  return `${prefix}_${randomBytes(5).toString("hex")}`;
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let i = 0; i < 4; i += 1) code += alphabet[randomBytes(1)[0] % alphabet.length];
    if (!rooms.has(code)) return code;
  }
  return randomBytes(3).toString("hex").toUpperCase();
}

function getLanAddresses() {
  const addresses = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
    }
  }
  return addresses;
}

const EMPTY_INPUT = Object.freeze({ left: false, right: false, jump: false, down: false, swing: false });

process.on("SIGINT", () => {
  console.log("\nClosing Pixel Court server.");
  for (const client of clients.values()) client.connection.close();
  server.close(() => process.exit(0));
});
