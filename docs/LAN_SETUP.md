# LAN Setup Guide

## Basic setup

Run the server on one computer:

```bash
npm start
```

The terminal prints something like:

```text
Local:   http://localhost:7777
LAN:     http://192.168.1.24:7777
```

Use `localhost` only on the host computer. Other players must use the LAN address.

## Playing against the computer

Computer mode still runs through the local server, but it only needs one browser:

1. Open the local URL.
2. Click **AI Easy**, **AI Medium**, or **AI Hard**.
3. Click **Ready**.
4. Click **Start Match**.

No other LAN device is required for this mode.

## Joining from another device

1. Make sure every device is connected to the same Wi-Fi or wired LAN.
2. Open the LAN URL in a browser.
3. Enter the room code shown in the host's lobby, or use **Copy Invite** from the host.
4. Ready up.

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

## Recommended play conditions

- Use a stable Wi-Fi network or wired Ethernet.
- Keep all players geographically nearby on the same LAN.
- Close heavy downloads or video streams if ball movement feels delayed.
- Host on the fastest computer available.
