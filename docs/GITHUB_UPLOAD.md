# Create a GitHub repository and upload Pixel Court

This guide covers two common ways to publish the project: plain Git commands or GitHub CLI.

## Option A: Upload with Git commands

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

## Option B: Upload with GitHub CLI

If you have the GitHub CLI installed and authenticated, run this from inside the `pixel-court` folder:

```bash
git init
git add .
git commit -m "Initial Pixel Court game"
gh repo create pixel-court --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` if you want a private repository.

## Suggested repository description

> Animated LAN multiplayer browser tennis game with original fantasy pixel art, singles/doubles modes, AI opponents, tennis scoring, and an authoritative Node.js WebSocket server.

## Suggested topics

```text
browser-game pixel-art websocket lan multiplayer tennis nodejs canvas game-dev ai single-player
```

## Suggested first release notes

```text
Pixel Court v1.2.0

- Animated loading overlay.
- Animated main screen with title plaque, demo rally, crystal glow, slime spectators, and menu cards.
- LAN singles and doubles.
- Vs Computer mode with Easy, Medium, and Hard AI.
- Tennis scoring: Love, 15, 30, 40, Deuce, Advantage, Game, Match.
- Procedural Canvas pixel art, no external art assets.
```

## Before publishing

Run:

```bash
npm run check
npm start
```

Then test:

- Confirm the loading overlay animates while connecting.
- Confirm the main screen shows **Pixel Court** and animated lobby art.
- Create an AI Easy room, ready up, and start the match.
- Repeat with AI Medium and AI Hard.
- Create a singles room.
- Join from another browser tab or another device on the LAN.
- Ready both players.
- Start match.
- Repeat with four browser tabs/devices for doubles.
- Confirm the HUD shows tennis points: Love, 15, 30, 40, Deuce, Advantage, Game, and Match.

## Updating after your first upload

After you make changes later:

```bash
git status
git add .
git commit -m "Describe what changed"
git push
```

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
