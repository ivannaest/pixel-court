# Architecture

Pixel Court is intentionally small and dependency-free. It uses a Node.js server to host the browser files, coordinate LAN multiplayer over WebSockets, run the authoritative match simulation, and drive the computer opponent.

## Runtime model

```text
Browser clients  <--WebSocket JSON-->  Node server
      |                                  |
      | Canvas renderer                  | Authoritative game loop
      | Input capture                    | Room + lobby state
      | Lobby UI                         | Physics + tennis scoring
      | Graphics profile                 | Computer-opponent input
```

The browser never decides the match result. Clients send input only. The server owns player positions, ball velocity, CPU decisions, net/out/bounce calls, scoring, point pauses, match winner, and pause state for AI matches.

## Why a server is required for LAN

Browsers cannot accept inbound socket connections on their own. A nearby computer must run the Node server so other devices can connect to it through the local network. This also gives the game one authoritative simulation source, which avoids clients disagreeing about ball bounces or scoring.

## Important files

- `server.js`
  - Serves files from `public/`.
  - Implements a minimal WebSocket server using Node's built-in `http`, `net`, and `crypto` capabilities.
  - Manages rooms, room codes, seats, readiness, host permissions, bots, disconnects, and AI pause.
  - Runs the 60-tick authoritative simulation loop.
  - Injects AI input packets for CPU players before each simulation tick.
  - Broadcasts compact render-state packets to reduce browser JSON work.

- `public/src/shared/constants.js`
  - Shared world size, team data, mode definitions, AI difficulty definitions, player physics constants, ball constants, match rules, and controls.

- `public/src/shared/ai.js`
  - Creates basic computer-opponent input.
  - Predicts a rough landing position, applies difficulty-based error/reaction settings, and chooses movement, jump, slice, and swing actions.
  - Uses trimmed prediction work so hosting AI mode stays light on laptops.

- `public/src/shared/physics.js`
  - Shared simulation logic imported by the server and safe for browser use.
  - Handles movement, jumps, swings, racket collisions, swept net checks, ball bounces, tennis scoring, serving, sparks, point pauses, and match completion.
  - Moves the dead ball away from the net after net points so it does not look stuck.

- `public/src/client.js`
  - Connects to the WebSocket server.
  - Sends input packets only while a match is active and useful.
  - Updates lobby controls, loading overlay state, room/player state, and body performance classes.
  - Offers Singles, Doubles, AI difficulty buttons, and the Graphics quality selector.
  - Handles `Esc` pause/resume for Vs Computer matches.
  - Throttles Canvas painting to the selected graphics FPS while keeping the active-match render path smooth.

- `public/src/renderer.js`
  - Draws the full pixel-art game world with Canvas.
  - Uses only procedural rectangles, lines, panels, and generated decorative objects.
  - Draws the animated main screen, demo rally, loading/status visuals, tennis score HUD, pause overlay, and CPU visual details.
  - Uses a cached static scene for Sharp Performance and Low Power modes so expensive tile/forest/court layers are drawn once and reused.
  - Sharp Performance uses the native 960×540 Canvas backing size for crisp menus, HUD, and pause screens; Low Power uses a moderate 0.8 scale for older machines.

- `public/src/input.js`
  - Maps keyboard and touch controls to compact input packets.
  - Ignores movement keys while typing in inputs/select boxes.

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
{ "type": "togglePause" }
{ "type": "input", "input": { "left": false, "right": true, "jump": false, "down": false, "swing": true } }
```

Server to client:

```json
{ "type": "welcome", "playerId": "p_...", "version": "1.6.0" }
{ "type": "roomState", "room": { "code": "ABCD", "mode": "ai", "paused": false, "aiDifficulty": "medium" } }
{ "type": "gameState", "state": { "phase": "playing", "paused": false, "games": [0, 0], "points": [1, 0], "tennisLabel": "15-Love" } }
{ "type": "notice", "text": "Joined room ABCD." }
{ "type": "error", "text": "Only the room host can start the match." }
```

The server broadcasts a compact game state rather than the full simulation object. Clients receive only render-needed fields for players, ball, sparks, score, phase, and messages.

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

For Singles and Doubles, the first players to join get seats. Extra clients become spectators. For Vs Computer, the first human gets the Moss seat, the generated CPU gets the Amethyst seat, and extra human clients become spectators.

## Game loop

The server runs at `MATCH.tickRate`, currently 60 simulation ticks per second.

1. Skip simulation if the room is paused.
2. Gather the latest input for each seated human player.
3. Generate input for seated CPU players with `createAiInput`.
4. Simulate one physics tick.
5. Broadcast compact game state every `MATCH.broadcastEveryTicks`, currently every tick for smooth ball motion.
6. Continue until match over or room teardown.

The server continues to simulate at 60 ticks per second for consistent physics, while browsers paint according to their selected Graphics setting.

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
- Hard updates more often, positions tightly, and jumps/swings more aggressively.

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
- Pause overlay for AI mode
- Animated loading/main-screen details: title plaque, demo rally, slime spectators, crystal glow, menu cards, and rune bar

Because the renderer is procedural, the repo stays tiny and has no image licensing baggage.

## Classroom optimization model

The current build is designed for class laptops by default. The Graphics dropdown maps to renderer/CSS profiles:

- **Sharp Performance**: default; native 960×540 Canvas, cached static world layer, crisp pixel title/menu text, 60 FPS gameplay draw target, 24 FPS lobby target, reduced live particles, active-match CSS animation disabled.
- **Low Power**: moderate 0.8 Canvas scale, 45 FPS gameplay draw target, 12 FPS lobby target, minimal decorative motion.
- **Fancy 60 FPS**: high-detail redraw path for strong computers.

Graphics mode only changes how often and how heavily each browser paints the scene. Scoring and physics still come from the server, so slower laptops can choose Low Power without changing match rules.

## Loading and main screen

The browser shell contains a CSS-driven loading overlay in `public/index.html` and `public/styles.css`. It appears while the WebSocket connection is not ready and fades once the client connects. The overlay includes crystal blocks, a moving loading bar, and a pixel terrain strip.

The main screen is drawn in `public/src/renderer.js` whenever no match state is active. It still renders the world behind the menu, then layers on a title plaque, demo rally, slime spectators, glowing crystals, mode cards, and a status bar. Lower graphics modes reduce how often this scene repaints, not the overall art direction.

## Extending the game

Good next changes:

- Add sound effects with generated Web Audio tones.
- Add CPU teammate/opponent support for doubles.
- Add room options for match length and serve style.
- Add a replay or highlight trail.
- Add team color customization while keeping the seat/team model intact.
