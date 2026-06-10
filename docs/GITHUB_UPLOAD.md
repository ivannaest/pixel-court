# Upload and update Pixel Court on GitHub

This guide covers both first-time upload and later updates.

## First-time upload to an empty GitHub repository

### 1. Create the repository on GitHub

1. Sign in to GitHub.
2. Create a new repository.
3. Name it something like `pixel-court`.
4. Choose **Public** or **Private**.
5. Leave **Add a README file**, **Add .gitignore**, and **Choose a license** unchecked, because this project already includes those files.
6. Create the repository.

### 2. Initialize Git locally

From the `pixel-court` project folder:

```bash
git init
git add .
git commit -m "Initial Pixel Court game"
```

### 3. Connect your local project to GitHub

For HTTPS:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pixel-court.git
git push -u origin main
```

For SSH:

```bash
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/pixel-court.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Replace `pixel-court` if you chose a different repository name.

## Updating the repository after changes

After editing or replacing files with a newer Pixel Court version, run this from inside the project folder:

```bash
git status
git add .
git commit -m "Optimize Pixel Court for laptops"
git push
```

Use a different commit message if you changed something else, for example:

```bash
git commit -m "Add class demo polish"
```

## Pulling the update on another computer

If another laptop already cloned the repository, update that copy with:

```bash
cd pixel-court
git pull
npm start
```

Then open:

```text
http://localhost:7777
```

If the browser seems to show an older build, hard-refresh the page:

- Windows/Linux: `Ctrl` + `F5`
- Mac: `Cmd` + `Shift` + `R`

## Running after upload or update

From inside the project folder:

```bash
npm start
```

The terminal prints something like:

```text
Pixel Court v1.3.0
Local:   http://localhost:7777
LAN:     http://192.168.1.24:7777
```

Use the **Local** URL on the host computer. Use the **LAN** URL for nearby players on the same Wi-Fi/network.

For a quick solo test:

1. Open `http://localhost:7777`.
2. Confirm **Graphics** is set to **Laptop Optimized**.
3. Click **AI Easy**.
4. Click **Ready**.
5. Click **Start Match**.

## Option: Upload with GitHub CLI

If you have the GitHub CLI installed and authenticated, run this from inside the `pixel-court` folder:

```bash
git init
git add .
git commit -m "Initial Pixel Court game"
gh repo create pixel-court --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` if you want a private repository.

## Suggested repository description

> Animated LAN multiplayer browser tennis game with original fantasy pixel art, singles/doubles modes, AI opponents, tennis scoring, laptop-optimized graphics modes, and an authoritative Node.js WebSocket server.

## Suggested topics

```text
browser-game pixel-art websocket lan multiplayer tennis nodejs canvas game-dev ai single-player
```

## Suggested release notes

```text
Pixel Court v1.3.0

- Laptop-first performance optimization.
- Graphics selector: Laptop Optimized, Battery Saver, Fancy 60 FPS.
- Cached Canvas world layers for smoother laptop play.
- Reduced unnecessary live-match DOM updates.
- LAN singles and doubles.
- Vs Computer mode with Easy, Medium, and Hard AI.
- Tennis scoring: Love, 15, 30, 40, Deuce, Advantage, Game, Match.
- Animated loading screen and animated main screen.
- Procedural Canvas pixel art, no external art assets.
```

## Before class

Run:

```bash
npm run check
npm start
```

Then test:

- Loading overlay appears and fades after connection.
- Main screen shows **Pixel Court**.
- Graphics dropdown defaults to **Laptop Optimized**.
- AI Easy room can start and run smoothly.
- Singles room can be joined from another tab or another device.
- Doubles room can seat four players/tabs.
- HUD shows tennis points during play.

## Common issues

### `remote origin already exists`

Your folder already has a remote named `origin`. Check it:

```bash
git remote -v
```

Change it:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/pixel-court.git
```

### Git asks for a password

For HTTPS, GitHub uses modern credential/token authentication rather than account-password pushes. The easiest fix is to sign in through Git Credential Manager, GitHub Desktop, or GitHub CLI.

### `npm start` says Node is not found

Install Node.js 18 or newer, then close and reopen your terminal.

### Other laptops cannot open the LAN URL

Make sure all devices are on the same Wi-Fi/network, and allow Node.js through the firewall if your operating system asks.
