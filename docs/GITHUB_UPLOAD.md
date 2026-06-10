# Upload and update Pixel Court on GitHub

This guide covers first-time upload, later updates, conflict fixes, and how to test the game after updating.

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

Replace `YOUR_USERNAME` with your GitHub username. Replace `pixel-court` if your repository has a different name.

## Updating an existing GitHub repository with this new version

Use this when your repository already exists and you are replacing older project files with the newest ZIP.

### Step 1: Download and unzip the new project

Download the newest Pixel Court ZIP and unzip it. Rename the unzipped new folder to something clear, for example:

```text
pixel-court-new
```

Open that new folder. You should see:

```text
README.md
LICENSE
package.json
package-lock.json
server.js
public/
docs/
.gitignore
```

### Step 2: Open your existing local repo folder

Find the folder that is already connected to GitHub. It is probably named:

```text
pixel-court
```

Do **not** delete this folder. It contains the hidden `.git` folder that connects it to GitHub.

A reliable way to open the exact repo folder from Terminal is:

```bash
open .
```

Run that while Terminal is inside your repo folder. Paste the new files into that Finder window.

### Step 3: Copy the new files into the existing repo

Open `pixel-court-new`, select everything inside it, and copy it into your existing `pixel-court` repo folder.

Replace files when your computer asks.

Important: copy the **contents** of the new folder into the existing repo folder. Do not copy the folder itself inside the repo as `pixel-court/pixel-court-new`.

### Step 4: Confirm you copied into the correct folder

From Terminal inside the existing repo folder:

```bash
grep '"version"' package.json
```

Expected:

```text
"version": "1.6.0",
```

Also check the new graphics label:

```bash
grep -R "Sharp Performance" public docs README.md package.json
```

If those commands do not show v1.6.0 / Sharp Performance, the new files were copied into the wrong folder.

### Step 5: Commit and push

From inside your existing local repo folder:

```bash
git status
git add .
git commit -m "Sharpen Pixel Court graphics"
git pull --rebase origin main
git push
```

The `git pull --rebase origin main` step helps if GitHub has commits that your laptop does not have yet.

## If Git reports conflicts during pull/rebase

Because you are replacing project files with the newest build, the easiest safe approach is usually to keep your local new files.

First check what is conflicted:

```bash
git status
```

If the conflicted files are project files you just replaced, keep your local version with:

```bash
git checkout --ours .
git add .
git rebase --continue
git push
```

If Terminal opens `vim` during `git rebase --continue`:

1. Press `Esc`.
2. Type `:wq`.
3. Press Enter.
4. Then run `git push`.

If you are not sure, run `git status` and check that `package.json` still says `1.6.0` before pushing.

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
Pixel Court v1.6.0
Local:   http://localhost:7777
LAN:     http://192.168.1.24:7777
```

Use the **Local** URL on the host computer. Use the **LAN** URL for nearby players on the same Wi-Fi/network.

For a quick solo test:

1. Open `http://localhost:7777`.
2. Confirm **Graphics** is set to **Sharp Performance**.
3. Click **AI Easy**.
4. Click **Ready**.
5. Click **Start Match**.
6. Press `Esc` to pause, then press `Esc` again to resume.

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

> Classroom-optimized LAN browser tennis game with original fantasy pixel art, singles/doubles modes, AI opponents, tennis scoring, and an authoritative Node.js WebSocket server.

## Suggested topics

```text
browser-game pixel-art websocket lan multiplayer tennis nodejs canvas game-dev ai single-player
```

## Suggested release notes

```text
Pixel Court v1.6.0

- Crisp graphics pass while preserving classroom laptop performance.
- Default graphics mode: Sharp Performance.
- Low Power mode for older laptops, now less blurry than before.
- 60 FPS active gameplay drawing in Sharp Performance.
- Native 960×540 Canvas in Sharp Performance, cached scenery, and crisp pixel UI text.
- Server broadcasts every physics tick to remove visible ball stutter.
- Client-side smoothing for ball/player motion.
- Keeps the v1.5 net height, shot physics, and dead-ball fixes.
- Fixes blurry title/menu/HUD rendering from the old reduced-resolution canvas.
- Esc pause/resume for Vs Computer matches.
- LAN Singles, LAN Doubles, and Vs Computer mode.
- Easy, Medium, and Hard AI.
- Tennis scoring: Love, 15, 30, 40, Deuce, Advantage, Game, Match.
```

## Before class

Run:

```bash
npm run check
npm start
```

Then test:

- Terminal prints **Pixel Court v1.6.0**.
- Loading overlay appears and fades after connection.
- Main screen shows **Pixel Court**.
- Graphics dropdown defaults to **Sharp Performance**.
- AI Easy room can start and run smoothly.
- `Esc` pauses and resumes the AI match.
- Normal shots clear the net.
- The ball does not appear stuck in the net or frozen mid-air after a point.
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
