export const VERSION = "1.3.0";

export const WORLD = Object.freeze({
  width: 960,
  height: 540,
  courtLeft: 96,
  courtRight: 864,
  courtY: 436,
  centerX: 480,
  netTop: 346,
  netWidth: 10,
  tile: 16,
  gravity: 0.42
});

export const TEAM = Object.freeze({
  LEFT: 0,
  RIGHT: 1
});

export const TEAM_META = Object.freeze([
  {
    id: TEAM.LEFT,
    key: "moss",
    name: "Moss Court",
    short: "MOSS",
    side: "left",
    main: "#58d66b",
    trim: "#1d7a3a",
    glow: "#9dff9a"
  },
  {
    id: TEAM.RIGHT,
    key: "amethyst",
    name: "Amethyst Court",
    short: "AMY",
    side: "right",
    main: "#b875ff",
    trim: "#5a2d9a",
    glow: "#e3b8ff"
  }
]);

export const AI_DIFFICULTIES = Object.freeze({
  easy: {
    key: "easy",
    label: "Easy",
    short: "EASY",
    reactionTicks: 28,
    updateEveryTicks: 12,
    positionError: 86,
    deadZone: 24,
    swingDistance: 39,
    swingChance: 0.58,
    jumpChance: 0.12,
    serveAfterTicks: 58
  },
  medium: {
    key: "medium",
    label: "Medium",
    short: "MED",
    reactionTicks: 16,
    updateEveryTicks: 7,
    positionError: 42,
    deadZone: 16,
    swingDistance: 45,
    swingChance: 0.79,
    jumpChance: 0.28,
    serveAfterTicks: 44
  },
  hard: {
    key: "hard",
    label: "Hard",
    short: "HARD",
    reactionTicks: 7,
    updateEveryTicks: 3,
    positionError: 14,
    deadZone: 9,
    swingDistance: 52,
    swingChance: 0.96,
    jumpChance: 0.46,
    serveAfterTicks: 30
  }
});

export const MODES = Object.freeze({
  singles: {
    key: "singles",
    label: "Singles",
    maxPlayers: 2,
    maxHumans: 2,
    seats: [
      { team: TEAM.LEFT, slot: 0, label: "Moss Solo" },
      { team: TEAM.RIGHT, slot: 0, label: "Amethyst Solo" }
    ]
  },
  doubles: {
    key: "doubles",
    label: "Doubles",
    maxPlayers: 4,
    maxHumans: 4,
    seats: [
      { team: TEAM.LEFT, slot: 0, label: "Moss Baseline" },
      { team: TEAM.RIGHT, slot: 0, label: "Amethyst Baseline" },
      { team: TEAM.LEFT, slot: 1, label: "Moss Net" },
      { team: TEAM.RIGHT, slot: 1, label: "Amethyst Net" }
    ]
  },
  ai: {
    key: "ai",
    label: "Vs Computer",
    maxPlayers: 2,
    maxHumans: 1,
    seats: [
      { team: TEAM.LEFT, slot: 0, label: "Moss Human" },
      { team: TEAM.RIGHT, slot: 0, label: "Amethyst AI" }
    ]
  }
});

export const PLAYER = Object.freeze({
  width: 20,
  height: 42,
  accel: 0.64,
  airAccel: 0.34,
  friction: 0.76,
  maxSpeed: 5.1,
  jumpPower: 10.2,
  swingFrames: 18,
  swingCooldown: 28,
  racketReach: 34,
  racketRadius: 26
});

export const BALL = Object.freeze({
  radius: 7,
  gravity: WORLD.gravity,
  bounce: 0.74,
  floorFriction: 0.985,
  airDrag: 0.997,
  maxSpeedX: 13.2,
  maxSpeedY: 15.6,
  hitCooldown: 8
});

export const MATCH = Object.freeze({
  winningGames: 3,
  winByGames: 2,
  countdownTicks: 150,
  pointPauseTicks: 110,
  serveTicks: 95,
  tickRate: 60,
  broadcastEveryTicks: 2
});

export const CONTROLS = Object.freeze({
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  swing: ["Space", "KeyK", "KeyJ", "Enter"]
});

export function normalizeName(name) {
  const cleaned = String(name || "").replace(/[^a-zA-Z0-9 _.-]/g, "").trim();
  return cleaned.slice(0, 18) || "Lan Player";
}

export function normalizeDifficulty(difficulty) {
  const key = String(difficulty || "medium").toLowerCase();
  return AI_DIFFICULTIES[key] ? key : "medium";
}
