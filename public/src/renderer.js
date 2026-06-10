import { BALL, MATCH, MODES, PLAYER, TEAM, TEAM_META, WORLD } from "./shared/constants.js";

const TILE = WORLD.tile;
const rng = mulberry32(0xC0FFEE);
const stars = Array.from({ length: 80 }, () => ({ x: rng() * WORLD.width, y: 12 + rng() * 160, twinkle: rng() * 9 }));
const clouds = Array.from({ length: 8 }, (_, index) => ({
  x: rng() * WORLD.width,
  y: 48 + rng() * 110,
  w: 54 + rng() * 64,
  speed: 0.08 + rng() * 0.12,
  layer: index % 3
}));
const vines = Array.from({ length: 46 }, () => ({
  x: Math.floor(rng() * (WORLD.width / TILE)) * TILE,
  y: 8 + Math.floor(rng() * 7) * TILE,
  length: 2 + Math.floor(rng() * 8),
  wiggle: rng() * Math.PI * 2
}));
const fireflies = Array.from({ length: 30 }, () => ({
  x: rng() * WORLD.width,
  y: 150 + rng() * 245,
  phase: rng() * Math.PI * 2,
  speed: 0.3 + rng() * 0.8
}));
const treeLine = Array.from({ length: 24 }, (_, index) => ({
  x: index * 45 - 30 + rng() * 20,
  h: 76 + rng() * 88,
  crown: 24 + rng() * 18,
  type: rng() > 0.73 ? "palm" : "oak"
}));
const mushrooms = Array.from({ length: 18 }, () => ({
  x: rng() * WORLD.width,
  y: WORLD.courtY - 9,
  h: 6 + rng() * 18,
  flip: rng() > 0.5
}));
const crystals = Array.from({ length: 18 }, () => ({
  x: rng() * WORLD.width,
  y: WORLD.courtY + 38 + rng() * 68,
  h: 8 + rng() * 18,
  hue: rng() > 0.5 ? "#86e9ff" : "#d98cff"
}));

const lobbyCrystals = Array.from({ length: 16 }, (_, index) => ({
  x: 246 + index * 31 + (rng() - 0.5) * 12,
  y: 282 + (index % 4) * 10,
  h: 10 + rng() * 20,
  phase: rng() * Math.PI * 2,
  color: index % 3 === 0 ? "#86e9ff" : index % 3 === 1 ? "#b875ff" : "#58d66b"
}));
const lobbySlimes = Array.from({ length: 9 }, (_, index) => ({
  x: 124 + index * 88 + rng() * 26,
  y: WORLD.courtY - 32,
  phase: rng() * Math.PI * 2,
  color: index % 2 ? "#58d66b" : "#b875ff"
}));
const courtDust = Array.from({ length: 28 }, () => ({
  x: WORLD.courtLeft + rng() * (WORLD.courtRight - WORLD.courtLeft),
  phase: rng() * Math.PI * 2,
  speed: 0.3 + rng() * 0.8
}));

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  canvas.width = WORLD.width;
  canvas.height = WORLD.height;

  return {
    draw({ game, room, clientId, connected }) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const tick = game?.tick || performance.now() / 16.67;
      drawBackdrop(ctx, tick);
      drawCanopy(ctx, tick);
      drawArena(ctx, tick);
      drawCourtTrim(ctx, tick);
      drawNet(ctx, tick);
      drawAmbient(ctx, tick);

      if (game) {
        drawBall(ctx, game.ball, tick);
        drawPlayers(ctx, game, clientId, tick);
        drawSparks(ctx, game.sparks || []);
        drawHud(ctx, game, room, clientId);
      } else {
        drawEmptyLobby(ctx, room, connected, tick);
      }
      ctx.restore();
    }
  };
}

function drawBackdrop(ctx, tick) {
  ctx.fillStyle = "#0a0e21";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const bands = [
    [0, "#111a35"],
    [42, "#17244a"],
    [88, "#20375f"],
    [138, "#2b4b6b"],
    [198, "#355d66"],
    [270, "#2f5b4c"],
    [350, "#233b38"]
  ];
  bands.forEach(([y, color], index) => {
    ctx.fillStyle = color;
    const next = bands[index + 1]?.[0] ?? WORLD.courtY;
    ctx.fillRect(0, y, WORLD.width, next - y);
  });

  ctx.fillStyle = "#d8ecff";
  for (const star of stars) {
    const pulse = Math.sin(tick / 23 + star.twinkle) > 0.28 ? 2 : 1;
    ctx.fillRect(Math.round(star.x), Math.round(star.y), pulse, pulse);
  }

  drawPixelMoon(ctx, 770, 64, tick);
  drawMountains(ctx, 0.28, 292, "#172a3f", tick);
  drawMountains(ctx, 0.46, 326, "#1d3847", tick + 90);

  for (const cloud of clouds) {
    const x = wrap(cloud.x + tick * cloud.speed * (cloud.layer + 1), -cloud.w, WORLD.width + cloud.w);
    drawCloud(ctx, x, cloud.y, cloud.w, cloud.layer);
  }

  drawTreeLine(ctx, tick);
}

function drawPixelMoon(ctx, x, y, tick) {
  ctx.fillStyle = "#bde9ff";
  ctx.fillRect(x, y, 34, 34);
  ctx.fillStyle = "#0a0e21";
  ctx.fillRect(x + 23, y - 2, 16, 38);
  ctx.fillStyle = "rgba(136, 233, 255, 0.13)";
  ctx.fillRect(x - 12, y - 12, 58, 58);
  ctx.fillStyle = Math.sin(tick / 30) > 0 ? "#e8fbff" : "#8fd3ff";
  ctx.fillRect(x + 5, y + 7, 4, 4);
  ctx.fillRect(x + 13, y + 22, 3, 3);
}

function drawMountains(ctx, speed, baseY, color, tick) {
  ctx.fillStyle = color;
  const offset = -((tick * speed) % 160);
  for (let x = offset - 160; x < WORLD.width + 160; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + 50, baseY - 90);
    ctx.lineTo(x + 86, baseY - 48);
    ctx.lineTo(x + 126, baseY - 116);
    ctx.lineTo(x + 190, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(color, 14);
    ctx.fillRect(Math.round(x + 49), Math.round(baseY - 88), 8, 12);
    ctx.fillRect(Math.round(x + 124), Math.round(baseY - 112), 9, 16);
    ctx.fillStyle = color;
  }
}

function drawCloud(ctx, x, y, w, layer) {
  const color = layer === 0 ? "#43647a" : layer === 1 ? "#527991" : "#6995a9";
  ctx.fillStyle = color;
  const h = Math.max(16, w / 4);
  ctx.fillRect(Math.round(x), Math.round(y + h / 2), Math.round(w), Math.round(h / 2));
  ctx.fillRect(Math.round(x + w * 0.12), Math.round(y + h * 0.25), Math.round(w * 0.28), Math.round(h * 0.5));
  ctx.fillRect(Math.round(x + w * 0.36), Math.round(y), Math.round(w * 0.32), Math.round(h * 0.75));
  ctx.fillRect(Math.round(x + w * 0.65), Math.round(y + h * 0.27), Math.round(w * 0.22), Math.round(h * 0.5));
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(Math.round(x + 5), Math.round(y + h / 2), Math.round(w - 10), 2);
}

function drawTreeLine(ctx, tick) {
  for (const tree of treeLine) {
    const sway = Math.round(Math.sin(tick / 80 + tree.x) * 2);
    const trunkX = Math.round(tree.x + sway);
    const trunkY = WORLD.courtY - tree.h;
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(trunkX, trunkY, 10, tree.h);
    ctx.fillStyle = "#60402a";
    ctx.fillRect(trunkX + 6, trunkY + 8, 3, tree.h - 8);
    ctx.fillStyle = "#173b2a";
    if (tree.type === "palm") {
      for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(trunkX - 24 + i * 12, trunkY - 18 + Math.abs(i - 2) * 4, 24, 10);
      }
    } else {
      const c = tree.crown;
      ctx.fillRect(trunkX - c, trunkY - 18, c * 2, 24);
      ctx.fillRect(trunkX - c + 10, trunkY - 38, c * 2 - 16, 28);
      ctx.fillRect(trunkX - c / 2, trunkY - 54, c, 22);
      ctx.fillStyle = "#215236";
      ctx.fillRect(trunkX - c + 8, trunkY - 34, 12, 8);
      ctx.fillRect(trunkX + c - 21, trunkY - 13, 10, 8);
    }
  }
}

function drawCanopy(ctx, tick) {
  ctx.fillStyle = "#07131d";
  ctx.fillRect(0, 0, WORLD.width, 14);
  for (let x = 0; x < WORLD.width; x += TILE) {
    const h = 8 + ((x * 13) % 18);
    ctx.fillStyle = x % 48 === 0 ? "#10251e" : "#0c1b19";
    ctx.fillRect(x, 0, TILE, h);
    ctx.fillStyle = "#1a3926";
    ctx.fillRect(x, h - 3, TILE, 3);
  }

  for (const vine of vines) {
    const wiggle = Math.round(Math.sin(tick / 28 + vine.wiggle) * 2);
    for (let i = 0; i < vine.length; i += 1) {
      const x = vine.x + wiggle + (i % 2);
      const y = vine.y + i * 10;
      ctx.fillStyle = i % 2 ? "#1d6b3b" : "#2a8f4c";
      ctx.fillRect(x, y, 4, 10);
      if (i % 3 === 1) {
        ctx.fillStyle = "#55bd66";
        ctx.fillRect(x + 3, y + 3, 5, 3);
      }
    }
  }
}

function drawArena(ctx, tick) {
  drawGroundTiles(ctx, tick);
  drawCourtSurface(ctx, tick);
  drawDecor(ctx, tick);
}

function drawGroundTiles(ctx) {
  for (let y = WORLD.courtY; y < WORLD.height; y += TILE) {
    for (let x = 0; x < WORLD.width; x += TILE) {
      const n = hash2(x / TILE, y / TILE);
      const deep = y > WORLD.courtY + 48;
      ctx.fillStyle = deep ? (n > 0.72 ? "#2d2532" : "#241d27") : (n > 0.55 ? "#4a3622" : "#3b2b1e");
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = n > 0.81 ? "#6a5030" : "#2a2119";
      ctx.fillRect(x + 2, y + 2, 3 + (n * 6) | 0, 2);
      if (deep && n > 0.86) {
        ctx.fillStyle = "#7ee7ef";
        ctx.fillRect(x + 9, y + 6, 3, 5);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.strokeRect(x + 0.5, y + 0.5, TILE, TILE);
    }
  }

  for (let x = 0; x < WORLD.width; x += TILE) {
    ctx.fillStyle = x % 32 === 0 ? "#55ad54" : "#3d943f";
    ctx.fillRect(x, WORLD.courtY - 8, TILE, 8);
    ctx.fillStyle = "#75d35e";
    ctx.fillRect(x + 2, WORLD.courtY - 11 - (x % 3), 3, 4);
    ctx.fillRect(x + 10, WORLD.courtY - 10, 2, 4);
  }
}

function drawCourtSurface(ctx, tick = 0) {
  const courtX = WORLD.courtLeft;
  const width = WORLD.courtRight - WORLD.courtLeft;
  ctx.fillStyle = "#8e5b38";
  ctx.fillRect(courtX, WORLD.courtY - 24, width, 32);
  ctx.fillStyle = "#a86e43";
  ctx.fillRect(courtX + 6, WORLD.courtY - 22, width - 12, 20);
  ctx.fillStyle = "#75462d";
  for (let x = courtX; x <= WORLD.courtRight; x += 24) {
    const y = WORLD.courtY - 22 + (hash2(x, 3) * 10) | 0;
    ctx.fillRect(x + 4, y, 8, 2);
  }

  ctx.fillStyle = "#f2e8c9";
  ctx.fillRect(courtX, WORLD.courtY - 25, width, 3);
  ctx.fillRect(courtX, WORLD.courtY - 2, width, 3);
  ctx.fillRect(courtX, WORLD.courtY - 25, 3, 26);
  ctx.fillRect(WORLD.courtRight - 3, WORLD.courtY - 25, 3, 26);
  ctx.fillRect(WORLD.centerX - 2, WORLD.courtY - 24, 4, 22);
  ctx.fillRect(courtX + 160, WORLD.courtY - 23, 3, 22);
  ctx.fillRect(WORLD.courtRight - 163, WORLD.courtY - 23, 3, 22);

  ctx.fillStyle = "rgba(255,238,190,0.18)";
  ctx.fillRect(courtX + 5, WORLD.courtY - 20, width - 10, 4);

  for (const mote of courtDust) {
    const drift = wrap(mote.x + Math.sin(tick / 37 + mote.phase) * 18 + tick * mote.speed * 0.15, courtX + 8, WORLD.courtRight - 8);
    const y = WORLD.courtY - 18 + Math.sin(tick / 19 + mote.phase) * 8;
    ctx.globalAlpha = 0.16 + 0.16 * Math.abs(Math.sin(tick / 24 + mote.phase));
    ctx.fillStyle = "#ffe6ac";
    ctx.fillRect(Math.round(drift), Math.round(y), 2, 2);
  }
  ctx.globalAlpha = 1;

  const shimmerX = courtX + 18 + wrap(tick * 1.4, 0, width - 36);
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  ctx.fillRect(Math.round(shimmerX), WORLD.courtY - 23, 20, 2);
}

function drawCourtTrim(ctx, tick) {
  drawTorch(ctx, WORLD.courtLeft - 28, WORLD.courtY - 54, tick + 1);
  drawTorch(ctx, WORLD.courtRight + 18, WORLD.courtY - 54, tick + 5);
  drawBanner(ctx, WORLD.courtLeft - 75, WORLD.courtY - 116, TEAM_META[TEAM.LEFT]);
  drawBanner(ctx, WORLD.courtRight + 45, WORLD.courtY - 116, TEAM_META[TEAM.RIGHT]);
}

function drawDecor(ctx, tick) {
  for (const mushroom of mushrooms) {
    if (mushroom.x > WORLD.courtLeft - 8 && mushroom.x < WORLD.courtRight + 8) continue;
    const x = Math.round(mushroom.x);
    const y = Math.round(mushroom.y);
    ctx.fillStyle = "#d7d0b2";
    ctx.fillRect(x, y - mushroom.h, 4, mushroom.h);
    ctx.fillStyle = mushroom.flip ? "#d65a7c" : "#66d39a";
    ctx.fillRect(x - 4, y - mushroom.h - 5, 12, 5);
    ctx.fillRect(x - 2, y - mushroom.h - 8, 8, 3);
  }

  for (const crystal of crystals) {
    ctx.fillStyle = crystal.hue;
    ctx.fillRect(Math.round(crystal.x), Math.round(crystal.y - crystal.h), 5, crystal.h);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(Math.round(crystal.x + 1), Math.round(crystal.y - crystal.h + 2), 2, 4);
  }

  ctx.fillStyle = "rgba(255,245,165,0.8)";
  for (const bug of fireflies) {
    const x = Math.round(wrap(bug.x + Math.sin(tick / 55 + bug.phase) * 26, 0, WORLD.width));
    const y = Math.round(bug.y + Math.cos(tick / 38 + bug.phase) * 12);
    const alpha = 0.25 + 0.65 * Math.abs(Math.sin(tick / 19 + bug.phase));
    ctx.globalAlpha = alpha;
    ctx.fillRect(x, y, 2, 2);
    ctx.globalAlpha = alpha * 0.28;
    ctx.fillRect(x - 2, y - 2, 6, 6);
    ctx.globalAlpha = 1;
  }
}

function drawTorch(ctx, x, y, tick) {
  ctx.fillStyle = "#5c3a21";
  ctx.fillRect(x + 5, y + 16, 6, 42);
  ctx.fillStyle = "#2a170f";
  ctx.fillRect(x + 3, y + 16, 10, 5);
  ctx.fillStyle = "rgba(255,168,56,0.20)";
  ctx.fillRect(x - 18, y - 10, 50, 50);
  ctx.fillStyle = Math.sin(tick / 5) > 0 ? "#ffe06e" : "#ff9f32";
  ctx.fillRect(x + 3, y + 2, 10, 14);
  ctx.fillStyle = "#ff5b2d";
  ctx.fillRect(x + 5, y + 9, 6, 10);
}

function drawBanner(ctx, x, y, team) {
  ctx.fillStyle = "#30241c";
  ctx.fillRect(x, y, 5, 86);
  ctx.fillStyle = team.trim;
  ctx.fillRect(x + 5, y + 8, 28, 48);
  ctx.fillStyle = team.main;
  ctx.fillRect(x + 8, y + 11, 22, 40);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x + 12, y + 16, 4, 29);
}

function drawNet(ctx, tick) {
  const x = WORLD.centerX;
  ctx.fillStyle = "#4a3426";
  ctx.fillRect(x - 6, WORLD.netTop - 8, 12, WORLD.courtY - WORLD.netTop + 16);
  ctx.fillStyle = "#c0a97d";
  ctx.fillRect(x - 3, WORLD.netTop - 4, 6, WORLD.courtY - WORLD.netTop + 8);

  ctx.fillStyle = "#d9f1c7";
  ctx.fillRect(x - 64, WORLD.netTop, 128, 4);
  ctx.fillStyle = "rgba(226,255,218,0.56)";
  for (let yy = WORLD.netTop + 9; yy < WORLD.courtY - 4; yy += 12) {
    ctx.fillRect(x - 61, yy, 122, 2);
  }
  for (let xx = x - 58; xx <= x + 58; xx += 14) {
    ctx.fillRect(xx, WORLD.netTop + 5, 2, WORLD.courtY - WORLD.netTop - 9);
  }
  ctx.fillStyle = "#2c8b47";
  for (let i = 0; i < 7; i += 1) {
    const yy = WORLD.netTop + i * 13;
    const sway = Math.round(Math.sin(tick / 14 + i) * 2);
    ctx.fillRect(x - 67 + sway, yy, 5, 9);
    ctx.fillRect(x + 62 + sway, yy + 4, 5, 9);
  }
}

function drawAmbient(ctx, tick) {
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#b9f2ff";
  for (let i = 0; i < 15; i += 1) {
    const x = Math.round(wrap(i * 83 + tick * 0.22, -20, WORLD.width + 20));
    const y = 70 + ((i * 57) % 220);
    ctx.fillRect(x, y, 1, 20);
  }
  ctx.globalAlpha = 1;
}

function drawPlayers(ctx, game, clientId, tick) {
  const players = Object.values(game.players || {}).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const player of players) drawPlayer(ctx, player, player.id === clientId, tick);
}

function drawPlayer(ctx, player, isLocal, tick) {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const team = TEAM_META[player.team];
  const bob = player.onGround ? Math.round(Math.sin(tick / 7 + player.hueSeed) * 1) : 0;
  const run = Math.min(1, Math.abs(player.vx) / PLAYER.maxSpeed);
  const legSwing = Math.round(Math.sin(tick / 3 + player.hueSeed) * 3 * run);

  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#000000";
  ctx.fillRect(x - 16, WORLD.courtY - 3, 32, 5);
  ctx.globalAlpha = 1;

  if (isLocal) {
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x - 18, y - PLAYER.height - 9 + bob, 36, 3);
    ctx.fillRect(x - 20, y - PLAYER.height - 6 + bob, 40, 2);
  }

  const boot = "#221a1d";
  ctx.fillStyle = boot;
  ctx.fillRect(x - 10, y - 4, 9, 5);
  ctx.fillRect(x + 1, y - 4, 9, 5);
  ctx.fillStyle = "#534037";
  ctx.fillRect(x - 7, y - 16 + legSwing, 6, 14 - legSwing);
  ctx.fillRect(x + 2, y - 16 - legSwing, 6, 14 + legSwing);

  ctx.fillStyle = team.trim;
  ctx.fillRect(x - 11, y - 34 + bob, 22, 20);
  ctx.fillStyle = team.main;
  ctx.fillRect(x - 8, y - 31 + bob, 16, 14);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x - 5, y - 29 + bob, 3, 10);
  ctx.fillStyle = player.slot === 1 ? "#f7e28c" : "#e7f6ff";
  ctx.fillRect(x - 2, y - 26 + bob, 4, 3);

  const skin = "#d8a36d";
  ctx.fillStyle = skin;
  ctx.fillRect(x - 14, y - 31 + bob, 5, 14);
  ctx.fillRect(x + 9, y - 31 + bob, 5, 14);

  const headY = y - 49 + bob;
  ctx.fillStyle = skin;
  ctx.fillRect(x - 8, headY, 16, 15);
  ctx.fillStyle = "#1d1515";
  ctx.fillRect(x - 7, headY - 4, 14, 6);
  ctx.fillRect(x - 9, headY, 4, 6);
  ctx.fillStyle = "#202633";
  ctx.fillRect(x + player.facing * 3, headY + 6, 2, 2);
  if (player.bot) {
    ctx.fillStyle = "#86e9ff";
    ctx.fillRect(x - 6, headY + 5, 12, 3);
    ctx.fillStyle = team.glow;
    ctx.fillRect(x - 1, headY - 8, 2, 4);
    ctx.fillRect(x - 4, headY - 10, 8, 2);
  }
  ctx.fillStyle = "#a96b4b";
  ctx.fillRect(x - 2, headY + 11, 5, 2);

  drawRacket(ctx, player, x, y + bob, tick);

  ctx.font = "8px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - 34, headY - 20, 68, 12);
  ctx.fillStyle = isLocal ? "#fffbd3" : player.bot ? "#e3b8ff" : "#d9f7ff";
  ctx.fillText(player.name.slice(0, 12), x, headY - 11);
}

function drawRacket(ctx, player, x, y, tick) {
  const dir = player.facing;
  const team = TEAM_META[player.team];
  const swingProgress = player.swing > 0 ? 1 - player.swing / PLAYER.swingFrames : 0;
  const idleLift = Math.sin(tick / 9 + player.hueSeed) * 2;
  const baseX = x + dir * 11;
  const baseY = y - 28 + idleLift;
  const arc = player.swing > 0 ? Math.sin(swingProgress * Math.PI) * 22 : 0;
  const headX = baseX + dir * (24 + arc);
  const headY = baseY - 5 + (player.swing > 0 ? Math.cos(swingProgress * Math.PI) * 10 : 0);

  pixelLine(ctx, baseX, baseY, headX, headY, 3, "#8c6339");
  ctx.fillStyle = team.glow;
  ctx.fillRect(Math.round(headX - 7), Math.round(headY - 10), 14, 4);
  ctx.fillRect(Math.round(headX - 10), Math.round(headY - 6), 20, 13);
  ctx.fillRect(Math.round(headX - 7), Math.round(headY + 7), 14, 4);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(Math.round(headX - 6), Math.round(headY - 4), 12, 2);
  ctx.fillRect(Math.round(headX - 6), Math.round(headY + 2), 12, 2);
  ctx.fillRect(Math.round(headX - 1), Math.round(headY - 7), 2, 16);

  if (player.swing > 0) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = team.glow;
    ctx.fillRect(Math.round(headX - dir * 26), Math.round(headY - 14), Math.abs(dir * 30), 30);
    ctx.globalAlpha = 1;
  }
}

function drawBall(ctx, ball, tick) {
  if (!ball) return;
  const trail = ball.trail || [];
  for (let i = trail.length - 1; i >= 0; i -= 1) {
    const p = trail[i];
    const alpha = (trail.length - i) / trail.length * 0.18;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#cbf9ff";
    ctx.fillRect(Math.round(p.x - 4), Math.round(p.y - 4), 8, 8);
  }
  ctx.globalAlpha = 1;

  const x = Math.round(ball.x);
  const y = Math.round(ball.y);
  ctx.fillStyle = "rgba(161,255,240,0.22)";
  ctx.fillRect(x - 12, y - 12, 24, 24);
  ctx.fillStyle = "#ddfff1";
  ctx.fillRect(x - BALL.radius, y - BALL.radius, BALL.radius * 2, BALL.radius * 2);
  ctx.fillStyle = "#74f2a7";
  ctx.fillRect(x - 5, y - 5, 10, 10);
  ctx.fillStyle = Math.sin(tick / 5) > 0 ? "#ffffff" : "#dfffe8";
  ctx.fillRect(x - 3, y - 4, 3, 3);
  ctx.fillStyle = "#287445";
  ctx.fillRect(x + 3, y + 2, 2, 2);
}

function drawSparks(ctx, sparks) {
  for (const spark of sparks) {
    ctx.globalAlpha = Math.max(0, Math.min(1, spark.life / 24));
    ctx.fillStyle = spark.color || "#fff";
    ctx.fillRect(Math.round(spark.x), Math.round(spark.y), 3, 3);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game, room, clientId) {
  const games = game.games || game.score || [0, 0];
  const pointLabels = game.pointLabels || [String(game.score?.[TEAM.LEFT] ?? 0), String(game.score?.[TEAM.RIGHT] ?? 0)];
  const tennisLabel = game.tennisLabel || `${pointLabels[TEAM.LEFT]}-${pointLabels[TEAM.RIGHT]}`;
  const modeLabel = MODES[game.mode]?.label || room?.modeLabel || "Match";

  pixelPanel(ctx, WORLD.centerX - 210, 12, 420, 70, "rgba(16, 20, 29, 0.88)", "#6c5440");
  ctx.textAlign = "center";
  ctx.font = "16px monospace";
  ctx.fillStyle = TEAM_META[TEAM.LEFT].main;
  ctx.fillText(String(games[TEAM.LEFT] ?? 0), WORLD.centerX - 126, 38);
  ctx.fillStyle = TEAM_META[TEAM.RIGHT].main;
  ctx.fillText(String(games[TEAM.RIGHT] ?? 0), WORLD.centerX + 126, 38);
  ctx.fillStyle = "#f1e6c8";
  ctx.fillText("PIXEL COURT", WORLD.centerX, 30);

  ctx.font = "9px monospace";
  ctx.fillStyle = TEAM_META[TEAM.LEFT].glow;
  ctx.fillText(pointLabels[TEAM.LEFT], WORLD.centerX - 126, 56);
  ctx.fillStyle = TEAM_META[TEAM.RIGHT].glow;
  ctx.fillText(pointLabels[TEAM.RIGHT], WORLD.centerX + 126, 56);
  ctx.fillStyle = "#fff4c2";
  ctx.fillText(tennisLabel, WORLD.centerX, 48);
  ctx.fillStyle = "#c8d8da";
  ctx.fillText(`${game.gameScoreLabel || "Games 0-0"}  •  first to ${game.matchTargetGames || MATCH.winningGames}`, WORLD.centerX, 66);

  const msg = game.phase === "countdown"
    ? `Match starts in ${Math.ceil((game.countdown || 0) / MATCH.tickRate)}`
    : game.message;
  pixelPanel(ctx, WORLD.centerX - 230, 92, 460, 24, "rgba(33, 28, 31, 0.72)", "#3f6b45");
  ctx.fillStyle = "#fff4c2";
  ctx.fillText(msg || "Rally!", WORLD.centerX, 108);

  if (room?.code) {
    pixelPanel(ctx, 12, 12, 156, 48, "rgba(10, 16, 25, 0.75)", "#365e47");
    ctx.textAlign = "left";
    ctx.fillStyle = "#b9ffd1";
    ctx.fillText(`ROOM ${room.code}`, 24, 30);
    ctx.fillStyle = "#c8d8da";
    const roomLine = room.mode === "ai" ? `${room.aiDifficultyLabel || "AI"} CPU` : `${room.readyCount}/${room.maxPlayers} ready`;
    ctx.fillText(roomLine, 24, 45);
  }

  pixelPanel(ctx, WORLD.centerX - 148, WORLD.height - 44, 296, 30, "rgba(10, 16, 25, 0.62)", "#4b3a2b");
  ctx.textAlign = "center";
  ctx.fillStyle = "#d7edf0";
  ctx.fillText(`${modeLabel}  •  rally ${game.rally || 0}  •  best ${game.longestRally || 0}`, WORLD.centerX, WORLD.height - 25);

  const localPlayer = Object.values(game.players || {}).find((player) => player.id === clientId);
  if (localPlayer) {
    pixelPanel(ctx, WORLD.width - 190, 12, 178, 48, "rgba(10, 16, 25, 0.75)", TEAM_META[localPlayer.team].trim);
    ctx.textAlign = "left";
    ctx.fillStyle = TEAM_META[localPlayer.team].main;
    ctx.fillText(`${TEAM_META[localPlayer.team].short} ${localPlayer.slot === 1 ? "NET" : "BASE"}`, WORLD.width - 176, 30);
    ctx.fillStyle = "#d7edf0";
    ctx.fillText("A/D move  W jump  K hit", WORLD.width - 176, 45);
  }

  if (game.phase === "matchOver") {
    pixelPanel(ctx, WORLD.centerX - 205, 156, 410, 122, "rgba(13, 11, 18, 0.92)", TEAM_META[game.winner ?? TEAM.LEFT].main);
    ctx.textAlign = "center";
    ctx.font = "16px monospace";
    ctx.fillStyle = TEAM_META[game.winner ?? TEAM.LEFT].glow;
    ctx.fillText("MATCH COMPLETE", WORLD.centerX, 190);
    ctx.font = "12px monospace";
    ctx.fillStyle = "#fff9d8";
    ctx.fillText(game.message, WORLD.centerX, 216);
    ctx.fillText(game.gameScoreLabel || "", WORLD.centerX, 238);
    ctx.fillText("Host can start another match from the lobby panel.", WORLD.centerX, 260);
  }
}

function drawEmptyLobby(ctx, room, connected, tick) {
  drawLobbyCrystals(ctx, tick);
  drawLobbySlimes(ctx, tick);
  drawDemoRally(ctx, tick);

  const titleY = 104 + Math.round(Math.sin(tick / 38) * 3);
  drawLogoPlaque(ctx, WORLD.centerX, titleY, tick);

  const panelY = 196;
  pixelPanel(ctx, WORLD.centerX - 280, panelY, 560, 126, "rgba(13, 18, 25, 0.88)", connected ? "#6a5636" : "#355b69");
  ctx.textAlign = "center";
  ctx.font = "12px monospace";
  ctx.fillStyle = connected ? "#b9ffd1" : "#86e9ff";
  const line1 = connected ? "MAIN SCREEN READY" : "LOADING LAN SERVER";
  ctx.fillText(line1, WORLD.centerX, panelY + 27);

  ctx.font = "10px monospace";
  ctx.fillStyle = "#c9e8e0";
  const prompt = connected
    ? "Create Singles, Create Doubles, enter a room code, or challenge the CPU."
    : "Carving clay tiles, lighting torches, and opening the WebSocket gate...";
  ctx.fillText(prompt, WORLD.centerX, panelY + 52);

  if (room) {
    const aiSuffix = room.mode === "ai" ? ` • ${room.aiDifficultyLabel || "AI"}` : "";
    ctx.fillStyle = "#fff4c2";
    ctx.fillText(`${room.modeLabel}${aiSuffix} room ${room.code}`, WORLD.centerX, panelY + 76);
    ctx.fillStyle = "#b9ffd1";
    const seated = room.mode === "ai" ? "CPU seated" : `${room.seatedCount}/${room.maxPlayers} seated`;
    ctx.fillText(`${seated} • ${room.readyCount}/${room.maxPlayers} ready`, WORLD.centerX, panelY + 96);
  } else {
    ctx.fillStyle = "#e3b8ff";
    ctx.fillText("Singles: 2 players  •  Doubles: 4 players  •  AI: Easy / Medium / Hard", WORLD.centerX, panelY + 78);
    ctx.fillStyle = Math.sin(tick / 18) > 0 ? "#86e9ff" : "#fff4c2";
    ctx.fillText("Every tile, vine, sparkle, torch, and lobby critter is animated.", WORLD.centerX, panelY + 100);
  }

  drawLoadingRuneBar(ctx, WORLD.centerX - 180, panelY + 110, 360, 8, tick, connected);
  drawMenuHintCards(ctx, tick, connected);
}

function drawLogoPlaque(ctx, centerX, y, tick) {
  const pulse = Math.sin(tick / 18);
  const glow = pulse > 0 ? "#86e9ff" : "#b875ff";
  pixelPanel(ctx, centerX - 250, y - 48, 500, 82, "rgba(16, 22, 31, 0.9)", glow);

  ctx.textAlign = "center";
  ctx.font = "31px monospace";
  ctx.fillStyle = "#05070c";
  ctx.fillText("PIXEL COURT", centerX + 4, y - 8 + 4);
  ctx.fillStyle = "#583f28";
  ctx.fillText("PIXEL COURT", centerX + 2, y - 8 + 2);
  ctx.fillStyle = "#fff4c2";
  ctx.fillText("PIXEL COURT", centerX, y - 8);

  ctx.font = "9px monospace";
  ctx.fillStyle = "#c9e8e0";
  ctx.fillText("animated LAN tennis under moss, torches, crystals, and suspiciously athletic slimes", centerX, y + 16);

  const sparkleX = centerX - 217 + wrap(tick * 2.2, 0, 434);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillRect(Math.round(sparkleX), y - 38, 18, 3);
  ctx.fillRect(Math.round(sparkleX + 7), y - 45, 3, 17);

  drawTinyRacket(ctx, centerX - 222, y - 19, -1, TEAM_META[TEAM.LEFT], tick);
  drawTinyRacket(ctx, centerX + 222, y - 19, 1, TEAM_META[TEAM.RIGHT], tick + 18);
}

function drawLoadingRuneBar(ctx, x, y, w, h, tick, connected) {
  ctx.fillStyle = "#060a10";
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = "#314154";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#08101a";
  ctx.fillRect(x, y, w, h);

  const progress = connected ? 1 : 0.2 + 0.72 * Math.abs(Math.sin(tick / 36));
  const fillW = Math.max(8, Math.floor(w * progress));
  for (let i = 0; i < fillW; i += 12) {
    ctx.fillStyle = i % 36 === 0 ? "#58d66b" : i % 36 === 12 ? "#86e9ff" : "#b875ff";
    ctx.fillRect(x + i, y, Math.min(10, fillW - i), h);
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(x + Math.max(0, fillW - 18), y, 12, 2);
}

function drawMenuHintCards(ctx, tick, connected) {
  const cards = [
    ["SINGLES", "2 PLAYER LAN", TEAM_META[TEAM.LEFT].main],
    ["DOUBLES", "4 PLAYER LAN", TEAM_META[TEAM.RIGHT].main],
    ["CPU", "3 DIFFICULTIES", "#86e9ff"]
  ];
  const startX = WORLD.centerX - 255;
  for (let i = 0; i < cards.length; i += 1) {
    const [title, sub, color] = cards[i];
    const y = 348 + Math.round(Math.sin(tick / 34 + i) * 3);
    const x = startX + i * 170;
    pixelPanel(ctx, x, y, 150, 58, "rgba(10, 16, 25, 0.72)", color);
    ctx.textAlign = "center";
    ctx.font = "12px monospace";
    ctx.fillStyle = connected ? color : "#7f8f96";
    ctx.fillText(title, x + 75, y + 24);
    ctx.font = "8px monospace";
    ctx.fillStyle = "#d7edf0";
    ctx.fillText(sub, x + 75, y + 42);
  }
}

function drawLobbyCrystals(ctx, tick) {
  for (const crystal of lobbyCrystals) {
    const x = Math.round(crystal.x + Math.sin(tick / 40 + crystal.phase) * 4);
    const y = Math.round(crystal.y);
    const h = Math.round(crystal.h + Math.sin(tick / 25 + crystal.phase) * 3);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = crystal.color;
    ctx.fillRect(x - 6, y - h - 4, 17, h + 14);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a1322";
    ctx.fillRect(x - 2, y - 3, 9, 4);
    ctx.fillStyle = crystal.color;
    ctx.fillRect(x, y - h, 5, h);
    ctx.fillRect(x - 3, y - Math.floor(h * 0.7), 4, Math.floor(h * 0.65));
    ctx.fillRect(x + 5, y - Math.floor(h * 0.55), 4, Math.floor(h * 0.5));
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.fillRect(x + 1, y - h + 3, 2, 5);
  }
  ctx.globalAlpha = 1;
}

function drawLobbySlimes(ctx, tick) {
  for (const slime of lobbySlimes) {
    const hop = Math.max(0, Math.sin(tick / 18 + slime.phase)) * 9;
    const squash = hop > 1 ? 0 : Math.round(Math.abs(Math.sin(tick / 9 + slime.phase)) * 2);
    drawSlime(ctx, Math.round(slime.x), Math.round(slime.y - hop), slime.color, squash, tick + slime.phase * 10);
  }
}

function drawSlime(ctx, x, y, color, squash, tick) {
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 15, WORLD.courtY - 4, 30, 4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillRect(x - 13, y - 14 + squash, 26, 12 - squash);
  ctx.fillRect(x - 9, y - 21 + squash, 18, 8);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(x - 7, y - 18 + squash, 6, 3);
  ctx.fillStyle = "#101620";
  ctx.fillRect(x - 5, y - 11, 2, 2);
  ctx.fillRect(x + 5, y - 11, 2, 2);
  ctx.fillStyle = Math.sin(tick / 6) > 0 ? "#fff4c2" : "#d7edf0";
  ctx.fillRect(x - 1, y - 7, 3, 2);
}

function drawDemoRally(ctx, tick) {
  const t = tick / 32;
  const leftX = WORLD.centerX - 230 + Math.sin(tick / 46) * 10;
  const rightX = WORLD.centerX + 230 + Math.cos(tick / 42) * 10;
  drawTinyPlayer(ctx, leftX, WORLD.courtY - 4, TEAM_META[TEAM.LEFT], -1, tick);
  drawTinyPlayer(ctx, rightX, WORLD.courtY - 4, TEAM_META[TEAM.RIGHT], 1, tick + 16);

  const ballX = WORLD.centerX + Math.sin(t) * 182;
  const ballY = WORLD.courtY - 120 - Math.abs(Math.cos(t)) * 62;
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#cbf9ff";
  for (let i = 1; i <= 5; i += 1) {
    const past = t - i * 0.16;
    ctx.fillRect(Math.round(WORLD.centerX + Math.sin(past) * 182 - 3), Math.round(WORLD.courtY - 120 - Math.abs(Math.cos(past)) * 62 - 3), 6, 6);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(161,255,240,0.24)";
  ctx.fillRect(Math.round(ballX - 10), Math.round(ballY - 10), 20, 20);
  ctx.fillStyle = "#ddfff1";
  ctx.fillRect(Math.round(ballX - 5), Math.round(ballY - 5), 10, 10);
  ctx.fillStyle = "#74f2a7";
  ctx.fillRect(Math.round(ballX - 3), Math.round(ballY - 3), 6, 6);
}

function drawTinyPlayer(ctx, x, y, team, dir, tick) {
  const bob = Math.round(Math.sin(tick / 9) * 2);
  x = Math.round(x);
  y = Math.round(y + bob);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(x - 15, WORLD.courtY - 3, 30, 4);
  ctx.fillStyle = "#21191a";
  ctx.fillRect(x - 8, y - 3, 7, 4);
  ctx.fillRect(x + 1, y - 3, 7, 4);
  ctx.fillStyle = team.trim;
  ctx.fillRect(x - 9, y - 26, 18, 19);
  ctx.fillStyle = team.main;
  ctx.fillRect(x - 6, y - 23, 12, 12);
  ctx.fillStyle = "#d8a36d";
  ctx.fillRect(x - 7, y - 41, 14, 14);
  ctx.fillStyle = "#1d1515";
  ctx.fillRect(x - 8, y - 44, 16, 5);
  drawTinyRacket(ctx, x + dir * 16, y - 25, dir, team, tick);
}

function drawTinyRacket(ctx, x, y, dir, team, tick) {
  const lift = Math.round(Math.sin(tick / 10) * 4);
  pixelLine(ctx, x, y, x + dir * 20, y - 10 + lift, 2, "#8c6339");
  ctx.fillStyle = team.glow;
  ctx.fillRect(Math.round(x + dir * 18 - 6), Math.round(y - 19 + lift), 12, 4);
  ctx.fillRect(Math.round(x + dir * 15 - 8), Math.round(y - 15 + lift), 16, 12);
  ctx.fillRect(Math.round(x + dir * 18 - 6), Math.round(y - 3 + lift), 12, 4);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(Math.round(x + dir * 18 - 4), Math.round(y - 11 + lift), 8, 2);
}

function pixelPanel(ctx, x, y, w, h, fill, border) {
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(x + 6, y + 6, w - 12, 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + 6, y + h - 8, w - 12, 2);
}

function pixelLine(ctx, x1, y1, x2, y2, size, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i += 3) {
    const x = Math.round(x1 + (dx * i) / steps);
    const y = Math.round(y1 + (dy * i) / steps);
    ctx.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
  }
}

function hash2(x, y) {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function wrap(value, min, max) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

function shade(hex, amount) {
  const num = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

function mulberry32(seed) {
  return function next() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
