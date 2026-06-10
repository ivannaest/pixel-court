# Pixel Court Performance Guide

Pixel Court v1.6.0 is tuned for classroom laptops. The default graphics mode is **Sharp Performance**.

## Why v1.6 exists

The v1.5 performance pass fixed lag, but it made the Canvas too low-resolution. That helped speed, but it made the main menu, pause menu, title, and HUD look blurry. v1.6 keeps the low-lag architecture while restoring crisp pixel-art rendering.

## What changed in v1.6.0

- **Sharp Performance is now the default.** It uses the native 960×540 Canvas backing size for crisp graphics.
- **Static scenery is cached.** The forest, terrain, court, banners, and net are still drawn once into an offscreen layer and reused.
- **Gameplay still targets 60 FPS** in Sharp Performance so the ball feels smooth.
- **Canvas UI titles use a real blocky pixel renderer.** The main title, HUD title, pause menu, and match-complete text are drawn from rectangle glyphs instead of scaled browser font text.
- **The game stage is capped at 960 px wide** on larger screens to avoid soft fractional stretching.
- **The GPU canvas transform was removed** because it could make the Canvas look softened in some browsers.
- **Low Power is less blurry than before.** It now uses 0.8 scale and 45 FPS instead of the harsher low-res path.
- **CSS animation still stops during matches** in Sharp Performance and Low Power.

## Graphics modes

| Mode | Use it for | Details |
| --- | --- | --- |
| Sharp Performance | Default classroom play | Native 960×540 Canvas, cached scenery, crisp pixel UI text, 60 FPS gameplay, tiny effects, no live-match CSS animation. |
| Low Power | Older/low-battery laptops | 0.8 render scale, 45 FPS gameplay, almost no trails/sparks/effects. |
| Fancy 60 FPS | Stronger machines | Full animated scene, more particles, higher effect counts. |

## Recommended class setup

1. Start the server with `npm start`.
2. Open `http://localhost:7777` on the host laptop.
3. Confirm the terminal says `Pixel Court v1.6.0`.
4. Confirm **Graphics** says **Sharp Performance**.
5. Test **AI Easy** before class.
6. For very weak laptops, switch only that laptop to **Low Power**.

## Common causes of lag or blur

### Old files are still running

If the browser or terminal still says `v1.5.0`, `v1.4.0`, `v1.3.0`, or the graphics menu still says **Performance Lock** / **Classroom Smooth**, the new files were not copied into the repo folder that Node is running.

Check from the project folder:

```bash
grep '"version"' package.json
```

Expected:

```text
"version": "1.6.0",
```

### Browser cache

Hard refresh after updating:

```text
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + F5
```

### Fancy mode is selected

Use **Sharp Performance** for class. Fancy mode is intentionally more animated.

### The page is zoomed oddly

Set browser zoom to 100% when presenting. The stage is capped at 960 px wide so the Canvas should look crisp at normal zoom.

### Laptop is in low-power mode

Some laptops reduce browser performance on battery. Plugging in helps, but **Low Power** mode should still be usable.

## Smoothness expectations

- The ball should move continuously, not snap every few frames.
- Normal returns should clear the net.
- Net points should end cleanly; the ball should settle on the court.
- Pressing **Esc** during an AI match should pause/resume immediately.
- The main title, pause menu, and HUD should look crisp, not soft/blurry.

## Before presenting

Run:

```bash
npm run check
npm start
```

Then test:

1. Open `http://localhost:7777`.
2. Select **Sharp Performance**.
3. Click **AI Easy**.
4. Click **Ready**.
5. Click **Start Match**.
6. Move with `A`/`D`, swing with Space or `K`, and press `Esc` to pause.
