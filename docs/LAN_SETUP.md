# LAN Setup Guide

## Basic setup

Run the server on one computer:

```bash
npm start
```

The terminal prints something like:

```text
Pixel Court v1.5.0
Local:   http://localhost:7777
LAN:     http://192.168.1.24:7777
```

Use `localhost` only on the host computer. Other players must use the LAN address.

## Playing against the computer

Computer mode still runs through the local server, but it only needs one browser:

1. Open the local URL.
2. Confirm **Graphics** is set to **Performance Lock**.
3. Click **AI Easy**, **AI Medium**, or **AI Hard**.
4. Click **Ready**.
5. Click **Start Match**.
6. Press `Esc` to pause/resume if you need to stop during play.

No other LAN device is required for this mode.

## Joining from another device

1. Make sure every device is connected to the same Wi-Fi or wired LAN.
2. Open the LAN URL in a browser.
3. Enter the room code shown in the host's lobby, or use **Copy Invite** from the host.
4. Ready up.

## Classroom performance settings

- Keep **Graphics** on **Performance Lock** for regular laptops.
- Use **Low Power** on older laptops or laptops in low-power mode.
- Avoid **Fancy 60 FPS** unless the laptop is clearly strong enough.
- Close extra tabs, video calls, screen recorders, and large downloads.
- If hosting multiplayer, use the strongest available laptop for the server.

## Firewall troubleshooting

If other devices cannot load the LAN URL:

- Confirm the host and joining device are on the same network.
- Allow Node.js through the host computer firewall.
- Try a different port:

```bash
node server.js --port=8080
```

- Check that the address is the host's local IPv4 address, usually starting with `192.168.`, `10.`, or `172.16.` through `172.31.`.

## Public internet warning

This game is intended for trusted local networks. Do not expose the server directly to the public internet without adding production-grade security, rate limiting, HTTPS, and authentication.
