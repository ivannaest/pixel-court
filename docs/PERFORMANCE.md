# Performance guide

Pixel Court is meant to run in a classroom where most players are on laptops. The default graphics mode is now **Laptop Optimized**.

## Recommended class setup

1. Start the game with `npm start`.
2. Open `http://localhost:7777` on the host laptop.
3. Leave **Graphics** set to **Laptop Optimized**.
4. Ask other players to use the same setting when they join from the LAN URL.
5. If a device still feels laggy, change only that device to **Battery Saver**.

Graphics mode is per-browser and saved in `localStorage`, so each laptop can choose its own setting.

## Graphics modes

| Mode | Target | Details |
| --- | --- | --- |
| Laptop Optimized | Most laptops | Cached world layer, 45 FPS gameplay target, 30 FPS lobby target, reduced live particles, lighter page animations. |
| Battery Saver | Older laptops or low battery | Cached world layer, 30 FPS gameplay target, fewer sparks/trails/particles, minimal heavy CSS motion. |
| Fancy 60 FPS | Strong computers | Full per-frame scene redraw with all decorative animation. |

## What was optimized

- The expensive background, terrain, court, tile, vine, banner, and base decoration layer is cached in Laptop Optimized and Battery Saver modes.
- The browser no longer redraws the entire procedural world from scratch every animation frame unless **Fancy 60 FPS** is selected.
- The lobby renders at a lower target FPS than active gameplay in the laptop profiles.
- Canvas paint timing is throttled by profile instead of blindly drawing on every `requestAnimationFrame`.
- Live decorative effects now have per-profile limits for clouds, fireflies, court dust, ball trails, and sparks.
- The client avoids unnecessary DOM updates for every incoming game-state packet.
- Expensive full-page CSS effects are calmer in Laptop Optimized and mostly disabled in Battery Saver.
- The local server sends `Cache-Control: no-cache` so browsers pick up project updates quickly during class testing.

## Troubleshooting lag

Start with these steps:

```bash
npm start
```

Open:

```text
http://localhost:7777
```

Then in the lobby:

1. Set **Graphics** to **Laptop Optimized**.
2. Close extra browser tabs.
3. Keep the browser zoom at 100% or lower.
4. If it still lags, switch to **Battery Saver**.
5. Restart the browser before class if the laptop has been running for a long time.

For LAN multiplayer, only one computer runs the server. The other laptops only open the LAN URL in a browser.

## Things that can still slow laptops down

- Running the server, browser, screen recording, and video calls all on the same laptop.
- Very old integrated graphics chips.
- Browser extensions that inject scripts into every page.
- Huge display scaling or very high browser zoom.
- Low-power battery mode at the operating-system level.

## Keeping the aesthetic

The optimized modes still keep the same court, terrain, torches, crystals, slimes, fireflies, glow colors, HUD panels, and pixel-art layout. The trade-off is mostly that some background details update less often or in smaller counts. Gameplay readability and style should remain intact.
