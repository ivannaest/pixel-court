# Architecture

Pixel Court is intentionally small and dependency-free. It uses a Node.js server to host the browser files, coordinate LAN multiplayer over WebSockets, and run the computer opponent.

## Runtime model

```text
Browser clients  <--WebSocket JSON-->  Node server
      |                                  |
      | Canvas renderer                  | Authoritative game loop
      | Input capture                    | Room + lobby state
      | Lobby UI                         | Physics + tennis scoring
      |                                  | Computer-opponent input
```

The browser never decides the match result. Clients send input only. The server owns player positions, ball velocity, CPU decisions, scoring, point pauses, match winner, and broadcasts the latest state.

## Why a server is required for LAN

Browsers cannot accept inbound socket connections on their own. A nearby computer must run the Node server so other devices can connect to it through the local network. This also gives the game one authoritative simulation source, which avoids every client disagreeing about ball bounces.

## Important files

- `server.js`
  - Serves files from `public/`.
  - Implements a minimal WebSocket server using Node's built-in `http`, `net`, and `crypto` capabilities.
  - Manages rooms, room codes, seats, readiness, host permissions, bots, and disconnects.
  - Runs the 60 FPS authoritative simulation loop.
  - Injects AI input packets for CPU players before each simulation tick.

- `public/src/shared/constants.js`
  - Shared world size, team data, mode definitions, AI difficulty definitions, player physics constants, ball constants, match rules, and controls.

- `public/src/shared/ai.js`
  - Creates basic computer-opponent input.
  - Predicts a rough landing position, applies difficulty-based error/reaction settings, and chooses movement, jump, slice, and swing actions.

- `public/src/shared/physics.js`
  - Shared simulation logic imported by the server and safe for browser use.
  - Handles movement, jumps, swings, racket collisions, net hits, ball bounces, tennis scoring, serving, sparks, and match completion.

- `public/src/client.js`
  - Connects to the WebSocket server.
  - Sends input packets.
  - Updates lobby controls, loading overlay state, and room/player state.
  - Offers Singles, Doubles, AI difficulty buttons, and the Graphics quality selector.
  - Throttles canvas painting based on the selected graphics mode instead of forcing every `requestAnimationFrame` to draw.

- `public/src/renderer.js`
  - Draws the full pixel-art game world with Canvas.
  - Uses only procedural rectangles, lines, panels, and generated decorative objects.
  - Draws the animated main screen, demo rally, loading/status visuals, tennis score HUD, and CPU visual details.
  - Uses a cached static scene for Laptop Optimized and Battery Saver modes so expensive tile/forest/court layers are drawn once and reused.

- `public/src/input.js`
  - Maps keyboard and touch controls to compact input packets.

## Network packets

Client to server:

```json
{ "type": "setName", "name": "Ivanna" }
{ "type": "createRoom", "mode": "singles", "name": "Ivanna" }
{ "type": "createRoom", "mode": "doubles", "name": "Ivanna" }
{ "type": "createAiRoom", "difficulty": "medium", "name": "Ivanna" }
{ "type": "joinRoom", "code": "ABCD", "name": "Ivanna" }
{ "type": "ready", "ready": true }
{ "type": "startMatch" }
{ "type": "input", "input": { "left": false, "right": true, "jump": false, "down": false, "swing": true } }
```

Server to client:

```json
{ "type": "welcome", "playerId": "p_...", "version": "1.3.0" }
{ "type": "roomState", "room": { "code": "ABCD", "mode": "ai", "aiDifficulty": "medium" } }
{ "type": "gameState", "state": { "phase": "playing", "games": [0, 0], "points": [1, 0], "tennisLabel": "15-Love" } }
{ "type": "notice", "text": "Joined room ABCD." }
{ "type": "error", "text": "Only the room host can start the match." }
```

## Seats and modes

`constants.js` defines the seat order.

Singles:

1. Moss Solo
2. Amethyst Solo

Doubles:

1. Moss Baseline
2. Amethyst Baseline
3. Moss Net
4. Amethyst Net

Vs Computer:

1. Moss Human
2. Amethyst AI

For Singles and Doubles, the first players to join get seats. Extra clients become spectators. For Vs Computer, the first human gets the Moss seat, the generated CPU gets the Amethyst seat, and extra human clients become spectators. If the host disconnects and another human is present, the remaining human becomes host; otherwise the room is removed.

## Game loop

The server runs at `MATCH.tickRate`, currently 60 ticks per second.

1. Gather the latest input for each seated human player.
2. Generate input for seated CPU players with `createAiInput`.
3. Simulate one physics tick.
4. Broadcast game state every `MATCH.broadcastEveryTicks`, currently every 2 ticks.
5. Continue until match over or room teardown.

## Tennis scoring model

The physics module stores both game score and point score:

- `games`: match games won by each team.
- `points`: raw point counts inside the current game.
- `pointLabels`: displayed point labels such as `Love`, `15`, `30`, and `40`.
- `tennisLabel`: combined point state, including `Deuce` and `Advantage MOSS` / `Advantage AMY`.
- `gameScoreLabel`: display text such as `Games 1-0`.

A game requires at least 4 points and a 2-point lead. A match is first to 3 games, win by 2. The serving team stays the same within a game and alternates after each game.

## Computer opponent model

The AI is intentionally lightweight:

- Easy has slower reaction, larger prediction error, and lower swing reliability.
- Medium reduces error and reacts more consistently.
- Hard updates frequently, positions tightly, and jumps/swings more aggressively.

The AI does not cheat by changing the physics outcome. It only produces the same input shape as a human client: left, right, jump, down, and swing.

## Rendering approach

The renderer is procedural. It draws:

- Sky bands and a pixel moon
- Parallax mountains and tree line
- Tile-based dirt/stone ground
- Grass caps and decorative terrain pixels
- A clay tennis court with pixel lines
- Vines, torches, banners, crystals, mushrooms, and fireflies
- Pixel players, CPU visor details, and rackets
- Glowing ball, trail, sparks, and tennis-score HUD panels
- Animated loading/main-screen details: title plaque, demo rally, slime spectators, crystal glow, menu cards, and rune bar

Because the renderer is procedural, the repo stays tiny and has no image licensing baggage.

## Laptop optimization model

The current build is designed for classroom laptops by default. The Graphics dropdown maps to renderer/CSS profiles:

- **Laptop Optimized**: default; cached static world layer, 45 FPS gameplay target, 30 FPS lobby target, fewer live particles, lighter full-page CSS motion.
- **Battery Saver**: cached static world layer, 30 FPS gameplay target, fewer trails/sparks/particles, minimal CSS animation.
- **Fancy 60 FPS**: original full-scene redraw path, 60 FPS target, all particles and decorative motion.

The game logic still simulates on the server at 60 ticks per second. Graphics mode only changes how often and how heavily each browser paints the scene. That means a slower laptop can choose Battery Saver without changing scoring, physics, or fairness.

## Extending the game

Good next changes:

- Add sound effects with generated Web Audio tones.
- Add CPU teammate/opponent support for doubles.
- Add room options for match length and serve style.
- Add a replay or highlight trail.
- Add team color customization while keeping the seat/team model intact.


## Loading and main screen

The browser shell contains a CSS-driven loading overlay in `public/index.html` and `public/styles.css`. It appears while the WebSocket connection is not ready and fades once the client connects. The overlay includes bouncing crystal blocks, a moving loading bar, and a pixel terrain strip.

The main screen is drawn in `public/src/renderer.js` whenever no match state is active. It still renders the world behind the menu, then layers on a title plaque, animated demo rally, hopping slime spectators, glowing crystals, mode cards, and a status bar. This keeps the lobby visually alive instead of showing a static menu.
