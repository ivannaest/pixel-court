import { BALL, MATCH, MODES, PLAYER, TEAM, TEAM_META, WORLD, normalizeDifficulty, normalizeName } from "./constants.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const signForTeam = (team) => (team === TEAM.LEFT ? 1 : -1);
const oppositeTeam = (team) => (team === TEAM.LEFT ? TEAM.RIGHT : TEAM.LEFT);
const sideForX = (x) => (x < WORLD.centerX ? TEAM.LEFT : TEAM.RIGHT);

function createPlayerFromSeat(player, seat, index) {
  const teamSign = signForTeam(seat.team);
  const singlesOffset = seat.slot === 0 ? 0 : 72;
  const leftBase = seat.slot === 0 ? 182 : 342;
  const rightBase = seat.slot === 0 ? 778 : 618;
  const x = seat.team === TEAM.LEFT ? leftBase + singlesOffset * 0 : rightBase - singlesOffset * 0;

  return {
    id: player.id,
    name: normalizeName(player.name),
    team: seat.team,
    slot: seat.slot,
    label: seat.label,
    bot: !!player.bot,
    difficulty: player.difficulty || null,
    x,
    y: WORLD.courtY,
    vx: 0,
    vy: 0,
    facing: teamSign,
    onGround: true,
    swing: 0,
    swingCooldown: 0,
    justSwung: false,
    lastSwingHeld: false,
    rallyHits: 0,
    sweat: 0,
    hueSeed: index * 43 + seat.team * 120 + seat.slot * 25
  };
}

export function assignSeats(players, modeKey) {
  const mode = MODES[modeKey] || MODES.singles;
  return players.slice(0, mode.maxPlayers).map((player, index) => ({
    playerId: player.id,
    seat: mode.seats[index]
  }));
}

export function createGameState(roomSnapshot) {
  const mode = MODES[roomSnapshot.mode] || MODES.singles;
  const seatedPlayers = roomSnapshot.players
    .filter((player) => player.seat && !player.spectator)
    .slice(0, mode.maxPlayers);

  const players = {};
  seatedPlayers.forEach((player, index) => {
    players[player.id] = createPlayerFromSeat(player, player.seat, index);
  });

  const state = {
    version: 1,
    mode: mode.key,
    phase: "countdown",
    paused: false,
    tick: 0,
    countdown: MATCH.countdownTicks,
    pointPause: 0,
    message: `${mode.label} match forming under the canopy`,
    score: [0, 0],
    games: [0, 0],
    points: [0, 0],
    pointLabels: ["Love", "Love"],
    tennisLabel: "Love all",
    gameScoreLabel: "Games 0-0",
    matchTargetGames: MATCH.winningGames,
    nextServingTeam: TEAM.LEFT,
    aiDifficulty: normalizeDifficulty(roomSnapshot.aiDifficulty),
    rally: 0,
    longestRally: 0,
    servingTeam: TEAM.LEFT,
    lastPointTeam: null,
    winner: null,
    pointReason: "",
    players,
    ball: makeServeBall(TEAM.LEFT, players),
    sparks: [],
    recentEvents: []
  };

  resetPlayers(state);
  return state;
}

function makeServeBall(team, players) {
  const server = pickServer(players, team);
  const x = server ? server.x + signForTeam(team) * 30 : WORLD.centerX - signForTeam(team) * 42;
  const y = server ? server.y - 58 : WORLD.courtY - 86;
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    spin: 0,
    radius: BALL.radius,
    lastTouchTeam: null,
    lastTouchPlayer: null,
    lastBounceSide: null,
    bouncesOnSide: 0,
    hitCooldown: 0,
    trail: [],
    served: false
  };
}

function pickServer(players, team) {
  const candidates = Object.values(players).filter((player) => player.team === team);
  return candidates.sort((a, b) => a.slot - b.slot)[0] || null;
}

function resetPlayers(state) {
  Object.values(state.players).forEach((player) => {
    const isLeft = player.team === TEAM.LEFT;
    let base;
    if (state.mode === "doubles") {
      base = isLeft
        ? (player.slot === 0 ? 176 : 338)
        : (player.slot === 0 ? 784 : 622);
    } else {
      base = isLeft ? 198 : 762;
    }
    player.x = base;
    player.y = WORLD.courtY;
    player.vx = 0;
    player.vy = 0;
    player.facing = signForTeam(player.team);
    player.onGround = true;
    player.swing = 0;
    player.swingCooldown = 0;
    player.lastSwingHeld = false;
    player.justSwung = false;
  });
}

function resetForServe(state, servingTeam, message = "Serve") {
  state.phase = "serve";
  state.servingTeam = servingTeam;
  state.nextServingTeam = servingTeam;
  state.pointPause = MATCH.serveTicks;
  state.message = message;
  state.ball = makeServeBall(servingTeam, state.players);
  resetPlayers(state);
}

export function simulateTick(state, inputsByPlayer = {}) {
  if (!state || state.phase === "matchOver") return state;
  if (state.paused) return state;

  state.tick += 1;
  state.sparks = state.sparks
    .map((spark) => ({ ...spark, life: spark.life - 1, x: spark.x + spark.vx, y: spark.y + spark.vy, vy: spark.vy + 0.05 }))
    .filter((spark) => spark.life > 0);

  for (const player of Object.values(state.players)) {
    stepPlayer(player, inputsByPlayer[player.id] || {});
  }
  separateTeammates(state);

  if (state.phase === "countdown") {
    state.countdown -= 1;
    holdBallForServe(state);
    if (state.countdown <= 0) {
      resetForServe(state, state.servingTeam, `${TEAM_META[state.servingTeam].short} serves first`);
    }
    return state;
  }

  if (state.phase === "point") {
    state.pointPause -= 1;
    if (state.pointPause <= 0) {
      const nextServer = state.nextServingTeam ?? state.servingTeam;
      resetForServe(state, nextServer, `${TEAM_META[nextServer].short} serves`);
    }
    return state;
  }

  if (state.phase === "serve") {
    holdBallForServe(state);
    const server = pickServer(state.players, state.servingTeam);
    const input = server ? inputsByPlayer[server.id] || {} : {};
    state.pointPause -= 1;
    if ((server && server.justSwung && state.pointPause < MATCH.serveTicks - 8) || state.pointPause <= 0) {
      launchServe(state, server);
    }
    return state;
  }

  stepBall(state, inputsByPlayer);
  return state;
}

function stepPlayer(player, input) {
  player.justSwung = false;
  const left = !!input.left;
  const right = !!input.right;
  const jump = !!input.jump;
  const swingHeld = !!input.swing;

  const accel = player.onGround ? PLAYER.accel : PLAYER.airAccel;
  if (left) player.vx -= accel;
  if (right) player.vx += accel;
  if (!left && !right && player.onGround) player.vx *= PLAYER.friction;

  player.vx = clamp(player.vx, -PLAYER.maxSpeed, PLAYER.maxSpeed);
  if (jump && player.onGround) {
    player.vy = -PLAYER.jumpPower;
    player.onGround = false;
  }

  player.vy += WORLD.gravity;
  player.x += player.vx;
  player.y += player.vy;

  if (player.y >= WORLD.courtY) {
    player.y = WORLD.courtY;
    player.vy = 0;
    player.onGround = true;
  }

  const halfPad = PLAYER.width / 2 + 6;
  const leftMin = WORLD.courtLeft + halfPad;
  const leftMax = WORLD.centerX - WORLD.netWidth - halfPad;
  const rightMin = WORLD.centerX + WORLD.netWidth + halfPad;
  const rightMax = WORLD.courtRight - halfPad;
  if (player.team === TEAM.LEFT) player.x = clamp(player.x, leftMin, leftMax);
  else player.x = clamp(player.x, rightMin, rightMax);

  player.facing = signForTeam(player.team);
  if (player.swingCooldown > 0) player.swingCooldown -= 1;
  if (player.swing > 0) player.swing -= 1;

  if (swingHeld && !player.lastSwingHeld && player.swingCooldown <= 0) {
    player.swing = PLAYER.swingFrames;
    player.swingCooldown = PLAYER.swingCooldown;
    player.justSwung = true;
  }
  player.lastSwingHeld = swingHeld;
  player.sweat = Math.max(0, player.sweat - 1);
}

function separateTeammates(state) {
  const players = Object.values(state.players);
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const a = players[i];
      const b = players[j];
      if (a.team !== b.team) continue;
      const overlap = PLAYER.width + 4 - Math.abs(a.x - b.x);
      if (overlap > 0) {
        const push = overlap / 2;
        if (a.x < b.x) {
          a.x -= push;
          b.x += push;
        } else {
          a.x += push;
          b.x -= push;
        }
      }
    }
  }
}

function holdBallForServe(state) {
  const server = pickServer(state.players, state.servingTeam);
  if (!server) return;
  state.ball.x = server.x + signForTeam(server.team) * 30;
  state.ball.y = server.y - 59 + Math.sin(state.tick / 12) * 3;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.trail = rememberTrail(state.ball.trail, state.ball.x, state.ball.y);
}

function launchServe(state, server) {
  const servingTeam = state.servingTeam;
  const dir = signForTeam(servingTeam);
  state.phase = "playing";
  state.message = "Rally!";
  state.ball.served = true;
  state.ball.lastTouchTeam = servingTeam;
  state.ball.lastTouchPlayer = server ? server.id : null;
  state.ball.lastBounceSide = null;
  state.ball.bouncesOnSide = 0;
  state.ball.hitCooldown = BALL.hitCooldown;
  state.ball.vx = dir * 8.4;
  state.ball.vy = -8.1;
  burst(state, state.ball.x, state.ball.y, TEAM_META[servingTeam].glow, 10);
}

function stepBall(state, inputsByPlayer) {
  const ball = state.ball;
  ball.hitCooldown = Math.max(0, ball.hitCooldown - 1);
  ball.trail = rememberTrail(ball.trail, ball.x, ball.y);

  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.vy += BALL.gravity;
  ball.vx *= BALL.airDrag;
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx = clamp(ball.vx, -BALL.maxSpeedX, BALL.maxSpeedX);
  ball.vy = clamp(ball.vy, -BALL.maxSpeedY, BALL.maxSpeedY);

  checkRacketHits(state, inputsByPlayer);
  checkNet(state);
  checkGroundAndBounds(state);
}

function rememberTrail(trail, x, y) {
  const next = [{ x, y }, ...(trail || [])];
  return next.slice(0, 5);
}

function checkRacketHits(state, inputsByPlayer) {
  const ball = state.ball;
  if (ball.hitCooldown > 0) return;

  const players = Object.values(state.players).sort((a, b) => b.swing - a.swing);
  for (const player of players) {
    if (player.swing <= 0) continue;
    const activeFrame = player.swing >= 5 && player.swing <= PLAYER.swingFrames;
    if (!activeFrame) continue;

    const input = inputsByPlayer[player.id] || {};
    const reach = PLAYER.racketReach + (input.down ? 2 : 0);
    const racketX = player.x + player.facing * reach;
    const racketY = player.y - 25 + (input.down ? 8 : 0) + (input.jump ? -6 : 0);
    const dx = ball.x - racketX;
    const dy = ball.y - racketY;
    const distSq = dx * dx + dy * dy;
    const radius = PLAYER.racketRadius + BALL.radius;

    if (distSq <= radius * radius) {
      const dir = signForTeam(player.team);
      const upward = input.down ? -5.1 : input.jump ? -9.7 : -7.3;
      const speed = (input.down ? 7.7 : 8.6) + Math.min(2.8, Math.abs(player.vx) * 0.46) + Math.min(1.2, state.rally * 0.04);
      const slotSlice = state.mode === "doubles" && player.slot === 1 ? 0.8 : 0;
      ball.x = racketX + dir * (BALL.radius + 2);
      ball.y = racketY - 2;
      ball.vx = dir * (speed + slotSlice) + player.vx * 0.32;
      ball.vy = upward + Math.abs(player.vx) * -0.08;
      ball.spin = dir * (input.down ? -0.36 : 0.24) + player.vx * 0.015;
      ball.lastTouchTeam = player.team;
      ball.lastTouchPlayer = player.id;
      ball.lastBounceSide = null;
      ball.bouncesOnSide = 0;
      ball.hitCooldown = BALL.hitCooldown;
      state.rally += 1;
      state.longestRally = Math.max(state.longestRally, state.rally);
      player.rallyHits += 1;
      player.sweat = 18;
      burst(state, ball.x, ball.y, TEAM_META[player.team].glow, 5 + Math.min(5, state.rally));
      pushEvent(state, `${player.name} returns the comet ${state.rally}`);
      return;
    }
  }
}

function checkNet(state) {
  const ball = state.ball;
  const netLeft = WORLD.centerX - WORLD.netWidth / 2;
  const netRight = WORLD.centerX + WORLD.netWidth / 2;
  const inNetX = ball.x + BALL.radius > netLeft && ball.x - BALL.radius < netRight;
  const inNetY = ball.y + BALL.radius > WORLD.netTop && ball.y - BALL.radius < WORLD.courtY;

  const hadPrev = Number.isFinite(ball.prevX) && Number.isFinite(ball.prevY);
  const crossedNet = hadPrev && (ball.prevX - WORLD.centerX) * (ball.x - WORLD.centerX) <= 0;
  let sweptIntoNet = false;
  if (crossedNet && Math.abs(ball.x - ball.prevX) > 0.001) {
    const t = clamp((WORLD.centerX - ball.prevX) / (ball.x - ball.prevX), 0, 1);
    const yAtNet = ball.prevY + (ball.y - ball.prevY) * t;
    sweptIntoNet = yAtNet + BALL.radius > WORLD.netTop && yAtNet - BALL.radius < WORLD.courtY;
  }

  if (!((inNetX && inNetY) || sweptIntoNet)) return;

  const pointTeam = ball.lastTouchTeam == null ? oppositeTeam(sideForX(ball.x)) : oppositeTeam(ball.lastTouchTeam);
  awardPoint(state, pointTeam, "The ball clipped the vine net");
}

function checkGroundAndBounds(state) {
  const ball = state.ball;

  if (ball.x < WORLD.courtLeft - 90 || ball.x > WORLD.courtRight + 90 || ball.y > WORLD.courtY + 130) {
    const pointTeam = ball.lastTouchTeam == null ? oppositeTeam(sideForX(ball.x)) : oppositeTeam(ball.lastTouchTeam);
    awardPoint(state, pointTeam, "Out beyond the lantern line");
    return;
  }

  if (ball.x < WORLD.courtLeft - 6 || ball.x > WORLD.courtRight + 6) {
    if (ball.y + BALL.radius >= WORLD.courtY - 10) {
      const pointTeam = ball.lastTouchTeam == null ? oppositeTeam(sideForX(ball.x)) : oppositeTeam(ball.lastTouchTeam);
      awardPoint(state, pointTeam, "Out past the root boundary");
      return;
    }
  }

  if (ball.y + BALL.radius >= WORLD.courtY) {
    ball.y = WORLD.courtY - BALL.radius;
    ball.vy = -Math.abs(ball.vy) * BALL.bounce;
    ball.vx *= BALL.floorFriction;

    const side = sideForX(ball.x);
    if (ball.lastTouchTeam === side) {
      awardPoint(state, oppositeTeam(side), "Returned into the same side");
      return;
    }

    if (ball.lastBounceSide === side) {
      ball.bouncesOnSide += 1;
    } else {
      ball.lastBounceSide = side;
      ball.bouncesOnSide = 1;
    }

    burst(state, ball.x, WORLD.courtY - 4, "#eadca8", 5);

    if (ball.bouncesOnSide >= 2) {
      awardPoint(state, oppositeTeam(side), "Second bounce on the court");
    }
  }
}

function awardPoint(state, team, reason) {
  if (state.phase === "point" || state.phase === "matchOver") return;

  const result = recordTennisPoint(state, team);
  state.lastPointTeam = team;
  state.pointReason = reason;
  state.rally = 0;
  state.phase = "point";
  state.pointPause = MATCH.pointPauseTicks;
  state.nextServingTeam = result.gameWon ? oppositeTeam(state.servingTeam) : state.servingTeam;

  if (result.matchWon) {
    state.phase = "matchOver";
    state.winner = team;
    state.message = `${TEAM_META[team].name} wins ${state.games[TEAM.LEFT]}-${state.games[TEAM.RIGHT]}`;
    state.pointPause = 0;
  } else if (result.gameWon) {
    state.message = `${TEAM_META[team].short} game — ${reason}`;
  } else {
    state.message = `${TEAM_META[team].short} point — ${state.tennisLabel} — ${reason}`;
  }

  settleBallAfterPoint(state, team, reason);
  pushEvent(state, state.message);
  burst(state, state.ball.x, state.ball.y, TEAM_META[team].glow, result.gameWon ? 12 : 8);
}

function settleBallAfterPoint(state, awardedTeam, reason) {
  const ball = state.ball;
  const sideDir = awardedTeam === TEAM.LEFT ? -1 : 1;
  const wasNet = /net/i.test(reason);
  ball.x = wasNet
    ? WORLD.centerX + sideDir * 84
    : clamp(ball.x, WORLD.courtLeft + 32, WORLD.courtRight - 32);
  ball.y = wasNet
    ? WORLD.netTop - 30
    : clamp(ball.y, WORLD.courtY - 84, WORLD.courtY - BALL.radius);
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.hitCooldown = BALL.hitCooldown;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.trail = rememberTrail([], ball.x, ball.y);
}

function recordTennisPoint(state, team) {
  const other = oppositeTeam(team);
  state.points[team] += 1;

  let gameWon = false;
  let matchWon = false;
  if (state.points[team] >= 4 && state.points[team] - state.points[other] >= 2) {
    gameWon = true;
    state.games[team] += 1;
    state.score = [...state.games];
    state.points = [0, 0];

    if (state.games[team] >= MATCH.winningGames && state.games[team] - state.games[other] >= MATCH.winByGames) {
      matchWon = true;
    }
  }

  updateTennisLabels(state);
  return { gameWon, matchWon };
}

function updateTennisLabels(state) {
  state.pointLabels = [pointName(state.points[TEAM.LEFT]), pointName(state.points[TEAM.RIGHT])];
  state.tennisLabel = tennisScoreLabel(state.points);
  state.gameScoreLabel = `Games ${state.games[TEAM.LEFT]}-${state.games[TEAM.RIGHT]}`;
}

function tennisScoreLabel(points) {
  const left = points[TEAM.LEFT];
  const right = points[TEAM.RIGHT];
  if (left >= 3 && right >= 3) {
    if (left === right) return "Deuce";
    return `Advantage ${TEAM_META[left > right ? TEAM.LEFT : TEAM.RIGHT].short}`;
  }
  if (left === right) return `${pointName(left)} all`;
  return `${pointName(left)}-${pointName(right)}`;
}

function pointName(points) {
  return ["Love", "15", "30", "40"][Math.min(points, 3)] || "40";
}

function burst(state, x, y, color, count) {
  const limitedCount = Math.max(0, Math.min(count, 14));
  for (let i = 0; i < limitedCount; i += 1) {
    const angle = (i / Math.max(1, limitedCount)) * Math.PI * 2 + (state.tick % 11) * 0.11;
    const speed = 0.7 + ((i * 37) % 11) / 8;
    state.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      color,
      life: 16 + ((i * 13) % 18)
    });
  }
  state.sparks = state.sparks.slice(-36);
}

function pushEvent(state, text) {
  state.recentEvents.unshift({ tick: state.tick, text });
  state.recentEvents = state.recentEvents.slice(0, 5);
}

export function summarizeState(state) {
  return {
    phase: state.phase,
    score: state.score,
    games: state.games,
    points: state.points,
    pointLabels: state.pointLabels,
    tennisLabel: state.tennisLabel,
    gameScoreLabel: state.gameScoreLabel,
    message: state.message,
    winner: state.winner,
    rally: state.rally,
    longestRally: state.longestRally,
    players: Object.values(state.players).map((player) => ({
      id: player.id,
      name: player.name,
      team: player.team,
      slot: player.slot,
      bot: !!player.bot,
      difficulty: player.difficulty || null,
      x: Math.round(player.x),
      y: Math.round(player.y)
    }))
  };
}
