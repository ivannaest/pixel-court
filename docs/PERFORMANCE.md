# Pixel Court Performance Guide

Pixel Court v1.5.0 is tuned for classroom laptops. The default graphics mode is **Performance Lock**.

## Why the game should run on a normal laptop

Pixel Court is a 2D Canvas game with a small Node.js LAN server. A machine such as an Apple M2 MacBook Pro with 8 GB RAM should run it comfortably. If it feels laggy, the issue is almost certainly the project version, browser rendering path, or game-loop/physics behavior, not the laptop being too weak.

## What changed in v1.5.0

- **Performance Lock is now the default.** It keeps the pixel-art style but removes expensive live effects during matches.
- **Gameplay drawing targets 60 FPS** in Performance Lock so the ball feels smooth.
- **Internal Canvas resolution is lower** than the displayed size. This preserves the pixel-art look and reduces GPU/CPU cost.
- **Static scenery is cached.** The forest, terrain, court, banners, and net are drawn once into an offscreen layer and reused.
- **Server broadcasts every physics tick.** The old low-frequency packets made the ball look like it was snapping or freezing.
- **Client-side visual smoothing** reduces packet-to-packet jumps.
- **The net is lower and more playable.** Normal returns now clear it instead of clipping constantly.
- **Dead balls settle on the court.** The ball should not freeze mid-air or look stuck in the net after a point.
- **CSS animation stops during matches** in Performance Lock and Low Power.

## Graphics modes

| Mode | Use it for | Details |
| --- | --- | --- |
| Performance Lock | Default classroom play | Cached scenery, low internal resolution, 60 FPS gameplay draw target, tiny effects, no live-match CSS animation. |
| Low Power | Older/low-battery laptops | Lower internal resolution, 30 FPS gameplay draw target, almost no trails/sparks/effects. |
| Fancy 60 FPS | Stronger machines | Full animated scene, more particles, higher effect counts. |

## Recommended class setup

1. Start the server with `npm start`.
2. Open `http://localhost:7777` on the host laptop.
3. Confirm the terminal says `Pixel Court v1.5.0`.
4. Confirm **Graphics** says **Performance Lock**.
5. Test **AI Easy** before class.
6. For very weak laptops, switch only that laptop to **Low Power**.

## Common causes of lag

### Old files are still running

If the browser or terminal still says `v1.4.0`, `v1.3.0`, or the graphics menu still says **Classroom Smooth**, the new optimized files were not copied into the repo folder that Node is running.

Check from the project folder:

```bash
grep '"version"' package.json
```

Expected:

```text
"version": "1.5.0",
```

### Browser cache

Hard refresh after updating:

```text
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + F5
```

### Fancy mode is selected

Use **Performance Lock** for class. Fancy mode is intentionally more animated.

### Laptop is in low-power mode

Some laptops reduce browser performance on battery. Plugging in helps, but **Low Power** mode should still be usable.

### Too many tabs/apps are open

For class demos, close video calls, heavy browser tabs, and screen recorders if possible.

## Smoothness expectations

- The ball should move continuously, not snap every few frames.
- Normal returns should clear the net.
- Net points should end cleanly; the ball should settle on the court.
- Pressing **Esc** during an AI match should pause/resume immediately.

## Before presenting

Run:

```bash
npm run check
npm start
```

Then test:

1. Open `http://localhost:7777`.
2. Select **Performance Lock**.
3. Click **AI Easy**.
4. Click **Ready**.
5. Click **Start Match**.
6. Move with `A`/`D`, swing with Space or `K`, and press `Esc` to pause.
