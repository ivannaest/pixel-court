import { AI_DIFFICULTIES, VERSION, normalizeName } from "./shared/constants.js";
import { createInputController } from "./input.js";
import { createRenderer } from "./renderer.js";

const $ = (id) => document.getElementById(id);

const dom = {
  canvas: $("game"),
  statusDot: $("statusDot"),
  statusText: $("statusText"),
  version: $("version"),
  playerName: $("playerName"),
  createSingles: $("createSingles"),
  createDoubles: $("createDoubles"),
  createAiEasy: $("createAiEasy"),
  createAiMedium: $("createAiMedium"),
  createAiHard: $("createAiHard"),
  joinCode: $("joinCode"),
  joinRoom: $("joinRoom"),
  roomPanel: $("roomPanel"),
  roomTitle: $("roomTitle"),
  roomMeta: $("roomMeta"),
  players: $("players"),
  ready: $("ready"),
  start: $("start"),
  leave: $("leave"),
  copy: $("copy"),
  hint: $("hint"),
  toast: $("toast"),
  loadingOverlay: $("loadingOverlay"),
  loadingText: $("loadingText")
};

const renderer = createRenderer(dom.canvas);
const params = new URLSearchParams(window.location.search);
const autoJoinCode = (params.get("room") || "").trim().toUpperCase();

const state = {
  socket: null,
  connected: false,
  bootComplete: false,
  clientId: null,
  room: null,
  game: null,
  lastNotice: "",
  autoJoined: false,
  reconnectTimer: null
};

dom.version.textContent = `v${VERSION}`;
dom.playerName.value = normalizeName(localStorage.getItem("pixelCourtName") || randomPlayerName());
if (autoJoinCode) dom.joinCode.value = autoJoinCode;

connect();
createInputController((input) => send("input", { input }));
requestAnimationFrame(frame);

window.addEventListener("beforeunload", () => send("leaveRoom"));

dom.createSingles.addEventListener("click", () => send("createRoom", { mode: "singles", name: currentName() }));
dom.createDoubles.addEventListener("click", () => send("createRoom", { mode: "doubles", name: currentName() }));
dom.createAiEasy.addEventListener("click", () => createAiMatch("easy"));
dom.createAiMedium.addEventListener("click", () => createAiMatch("medium"));
dom.createAiHard.addEventListener("click", () => createAiMatch("hard"));
dom.joinRoom.addEventListener("click", () => send("joinRoom", { code: dom.joinCode.value, name: currentName() }));
dom.ready.addEventListener("click", () => {
  const me = currentRoomPlayer();
  send("ready", { ready: !(me?.ready) });
});
dom.start.addEventListener("click", () => send("startMatch"));
dom.leave.addEventListener("click", () => send("leaveRoom"));
dom.copy.addEventListener("click", copyInviteLink);

dom.joinCode.addEventListener("input", () => {
  dom.joinCode.value = dom.joinCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
});

dom.playerName.addEventListener("input", () => {
  const value = currentName();
  localStorage.setItem("pixelCourtName", value);
  send("setName", { name: value });
});

dom.playerName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") dom.playerName.blur();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) send("ping");
});

function connect() {
  window.clearTimeout(state.reconnectTimer);
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}`);
  state.socket = socket;
  updateConnection(false, "Connecting...");

  socket.addEventListener("open", () => {
    updateConnection(true, "Connected to LAN server");
    send("setName", { name: currentName() });
  });

  socket.addEventListener("message", (event) => {
    let packet;
    try {
      packet = JSON.parse(event.data);
    } catch {
      showToast("Received an unreadable server packet.", true);
      return;
    }
    handlePacket(packet);
  });

  socket.addEventListener("close", () => {
    updateConnection(false, "Disconnected — retrying");
    state.room = null;
    state.game = null;
    renderUi();
    state.reconnectTimer = window.setTimeout(connect, 1400);
  });

  socket.addEventListener("error", () => {
    updateConnection(false, "Connection error");
  });
}

function handlePacket(packet) {
  switch (packet.type) {
    case "welcome":
      state.clientId = packet.playerId;
      if (autoJoinCode && !state.autoJoined) {
        state.autoJoined = true;
        send("joinRoom", { code: autoJoinCode, name: currentName() });
      }
      renderUi();
      break;
    case "roomState":
      state.room = packet.room;
      if (!packet.room || packet.room.phase === "lobby") state.game = null;
      renderUi();
      break;
    case "gameState":
      state.game = packet.state;
      renderUi(false);
      break;
    case "notice":
      showToast(packet.text);
      break;
    case "error":
      showToast(packet.text, true);
      break;
    case "pong":
      break;
    default:
      console.warn("Unknown packet", packet);
  }
}

function send(type, payload = {}) {
  const socket = state.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type, ...payload }));
}

function updateConnection(connected, text) {
  state.connected = connected;
  dom.statusDot.classList.toggle("online", connected);
  dom.statusText.textContent = text;
  updateLoadingOverlay(connected, text);
  renderUi(false);
}

function updateLoadingOverlay(connected, text) {
  if (dom.loadingText) {
    dom.loadingText.textContent = connected
      ? "Crystal court ready. Choose a match mode."
      : text.includes("retrying")
        ? "Reconnecting to the LAN server..."
        : "Loading crystal court...";
  }

  document.body.classList.toggle("loaded", connected);
  document.body.classList.toggle("booting", !connected);
  if (connected && !state.bootComplete) {
    state.bootComplete = true;
    window.setTimeout(() => document.body.classList.add("intro-complete"), 600);
  }
}

function renderUi(rebuildPlayers = true) {
  const room = state.room;
  const me = currentRoomPlayer();
  const isHost = room?.hostId === state.clientId;

  dom.roomPanel.hidden = !room;
  dom.ready.disabled = !room || !!me?.spectator;
  dom.start.disabled = !room || !isHost || !room.canStart;
  dom.copy.disabled = !room;
  dom.leave.disabled = !room;

  if (room) {
    const aiSuffix = room.mode === "ai" ? ` • ${room.aiDifficultyLabel || AI_DIFFICULTIES.medium.label} AI` : "";
    dom.roomTitle.textContent = `${room.modeLabel}${aiSuffix} • Room ${room.code}`;
    dom.roomMeta.textContent = room.mode === "ai"
      ? `${room.readyCount}/${room.maxPlayers} ready • CPU seated${isHost ? " • you host" : ""}`
      : `${room.seatedCount}/${room.maxPlayers} seated • ${room.readyCount}/${room.maxPlayers} ready${isHost ? " • you host" : ""}`;
    dom.ready.textContent = me?.ready ? "Unready" : "Ready";
    dom.start.textContent = state.game?.phase === "matchOver" ? "Start Rematch" : "Start Match";
    dom.hint.textContent = room.canStart
      ? "All players are in. Host can start the match."
      : room.mode === "ai"
        ? "Ready up, then start. The CPU holds the Amethyst side."
        : `${room.modeLabel} requires ${room.maxPlayers} ready player${room.maxPlayers > 1 ? "s" : ""}.`;

    if (rebuildPlayers) {
      dom.players.innerHTML = "";
      for (const player of room.players) {
        const item = document.createElement("li");
        item.className = "player-card";
        if (player.id === state.clientId) item.classList.add("self");
        if (player.spectator) item.classList.add("spectator");
        if (player.bot) item.classList.add("bot");

        const badge = document.createElement("span");
        badge.className = `team-badge team-${player.seat?.team ?? "spectator"}`;
        badge.textContent = player.spectator ? "SPEC" : player.bot ? "CPU" : (player.seat.team === 0 ? "MOSS" : "AMY");

        const info = document.createElement("span");
        info.className = "player-info";
        const seatLabel = player.spectator ? "Spectator" : player.seat.label;
        const botLabel = player.bot ? ` • ${AI_DIFFICULTIES[player.difficulty]?.label || "Computer"}` : "";
        info.innerHTML = `<strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(seatLabel)}${escapeHtml(botLabel)}${player.isHost ? " • Host" : ""}</small>`;

        const ready = document.createElement("span");
        ready.className = player.ready ? "ready-pill ready" : "ready-pill";
        ready.textContent = player.ready ? "READY" : "WAIT";

        item.append(badge, info, ready);
        dom.players.append(item);
      }
    }
  }
}

function createAiMatch(difficulty) {
  send("createAiRoom", { difficulty, name: currentName() });
}

function currentRoomPlayer() {
  return state.room?.players?.find((player) => player.id === state.clientId) || null;
}

function currentName() {
  return normalizeName(dom.playerName.value);
}

async function copyInviteLink() {
  if (!state.room) return;
  const url = `${window.location.origin}${window.location.pathname}?room=${state.room.code}`;
  try {
    await navigator.clipboard.writeText(`${url}\nRoom code: ${state.room.code}`);
    showToast("Invite link copied.");
  } catch {
    showToast(`Invite: ${url}`);
  }
}

function showToast(text, isError = false) {
  state.lastNotice = text;
  dom.toast.textContent = text;
  dom.toast.classList.toggle("error", isError);
  dom.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => dom.toast.classList.remove("show"), 2800);
}

function frame() {
  renderer.draw({ game: state.game, room: state.room, clientId: state.clientId, connected: state.connected });
  requestAnimationFrame(frame);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}

function randomPlayerName() {
  const nouns = ["Moss", "Crystal", "Vine", "Torch", "Slime", "Cavern", "Root", "Lantern"];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${nouns[Math.floor(Math.random() * nouns.length)]}${suffix}`;
}
