import { AI_DIFFICULTIES, BALL, MATCH, PLAYER, TEAM, WORLD, normalizeDifficulty } from "./constants.js";

const EMPTY_INPUT = Object.freeze({ left: false, right: false, jump: false, down: false, swing: false });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const signForTeam = (team) => (team === TEAM.LEFT ? 1 : -1);

export function createAiInput(state, playerId, difficultyKey = "medium") {
  const player = state?.players?.[playerId];
  const ball = state?.ball;
  if (!state || !player || !ball || state.phase === "matchOver") return { ...EMPTY_INPUT };

  const config = AI_DIFFICULTIES[normalizeDifficulty(difficultyKey)] || AI_DIFFICULTIES.medium;
  const side = courtLimitsForTeam(player.team);

  if (state.phase === "countdown" || state.phase === "point") {
    return moveToward(player, homeBaseFor(player, state.mode), side, config.deadZone);
  }

  if (state.phase === "serve") {
    const base = moveToward(player, homeBaseFor(player, state.mode), side, config.deadZone);
    const isServing = state.servingTeam === player.team;
    const serveElapsed = MATCH.serveTicks - (state.pointPause || 0);
    return {
      ...base,
      swing: isServing && serveElapsed >= config.serveAfterTicks && !player.lastSwingHeld,
      jump: false,
      down: false
    };
  }

  const targetX = getTargetX(state, player, config, side);
  const input = moveToward(player, targetX, side, config.deadZone);
  const racketX = player.x + player.facing * PLAYER.racketReach;
  const racketY = player.y - 25;
  const dx = ball.x - racketX;
  const dy = ball.y - racketY;
  const distance = Math.hypot(dx, dy);
  const ballOnPlayableSide = player.team === TEAM.LEFT ? ball.x < WORLD.centerX + 34 : ball.x > WORLD.centerX - 34;
  const ballApproaching = player.team === TEAM.LEFT ? ball.vx < 1.5 : ball.vx > -1.5;
  const swingGate = deterministicNoise(state.tick, player.hueSeed, 4) < config.swingChance;
  const canSwing = distance <= config.swingDistance && ballOnPlayableSide && ballApproaching;
  const shouldJump = player.onGround
    && ballOnPlayableSide
    && Math.abs(ball.x - player.x) < 56
    && ball.y < player.y - 53
    && deterministicNoise(state.tick, player.hueSeed, 9) < config.jumpChance;

  input.swing = canSwing && swingGate && player.swingCooldown <= 0 && !player.lastSwingHeld;
  input.jump = shouldJump;
  input.down = canSwing && ball.y > player.y - 32 && deterministicNoise(state.tick, player.hueSeed, 13) > 0.38;
  return input;
}

function getTargetX(state, player, config, side) {
  const ball = state.ball;
  const ballOnMySide = player.team === TEAM.LEFT ? ball.x < WORLD.centerX : ball.x > WORLD.centerX;
  const ballComingTowardMe = player.team === TEAM.LEFT ? ball.vx < 0 : ball.vx > 0;
  const shouldChase = ballOnMySide || ballComingTowardMe;

  if (!shouldChase) {
    const home = homeBaseFor(player, state.mode);
    const shadeTowardBall = (ball.x - WORLD.centerX) * 0.09;
    return clamp(home + shadeTowardBall, side.min, side.max);
  }

  const predicted = predictLandingX(ball, config.reactionTicks);
  const updateStep = Math.max(1, config.updateEveryTicks);
  const steppedTick = Math.floor(state.tick / updateStep) * updateStep;
  const error = (deterministicNoise(steppedTick, player.hueSeed, 17) - 0.5) * config.positionError * 2;
  const safetyLead = ball.vx * (0.8 + (AI_DIFFICULTIES.hard.positionError - config.positionError) / 90);
  return clamp(predicted + error + safetyLead, side.min, side.max);
}

function predictLandingX(ball, reactionTicks) {
  let x = ball.x;
  let y = ball.y;
  let vx = ball.vx;
  let vy = ball.vy;
  const maxTicks = 110 + reactionTicks;

  for (let i = 0; i < maxTicks; i += 1) {
    vy += BALL.gravity;
    vx *= BALL.airDrag;
    x += vx;
    y += vy;

    if (x < WORLD.courtLeft || x > WORLD.courtRight) break;
    if (y + BALL.radius >= WORLD.courtY) break;
  }
  return x;
}

function moveToward(player, targetX, side, deadZone) {
  const safeTarget = clamp(targetX, side.min, side.max);
  return {
    left: player.x > safeTarget + deadZone,
    right: player.x < safeTarget - deadZone,
    jump: false,
    down: false,
    swing: false
  };
}

function courtLimitsForTeam(team) {
  const halfPad = PLAYER.width / 2 + 8;
  if (team === TEAM.LEFT) {
    return {
      min: WORLD.courtLeft + halfPad,
      max: WORLD.centerX - WORLD.netWidth - halfPad
    };
  }
  return {
    min: WORLD.centerX + WORLD.netWidth + halfPad,
    max: WORLD.courtRight - halfPad
  };
}

function homeBaseFor(player, mode) {
  if (mode === "doubles") {
    if (player.team === TEAM.LEFT) return player.slot === 0 ? 176 : 338;
    return player.slot === 0 ? 784 : 622;
  }
  return player.team === TEAM.LEFT ? 198 : 762;
}

function deterministicNoise(tick, seed, salt) {
  const n = Math.sin((tick + 1) * 12.9898 + (seed + 3) * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}
