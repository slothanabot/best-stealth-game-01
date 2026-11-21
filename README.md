# Fog on Pier 9

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/slothanabot/best-stealth-game-01/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/slothanabot/best-stealth-game-01/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A night harbor heist: steal 3 cargo manifests from the harbormaster's office
and escape by rowboat, unseen. Dockworker-guards patrol with flashlight
vision cones; crates and containers are cover; drifting fog shrinks their
sight; toss a fish (F) to lure a guard away. If spotted, break line of sight
and the alarm cools — detection is a chance to recover, not an instant loss.

## Run it

Serve `game/` with any static server and open `game/index.html`, for example:

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080. No build step, no network requests.

## Play

- **WASD / arrow keys** — move (or click to walk to a point)
- **Shift** — sneak (slower, quieter, harder to spot)
- **F** — toss a fish, luring nearby guards to investigate the gull
- **Enter / click** — start · **R** — restart after a win or a capture

Steal all 3 manifests, then step onto the rowboat at the south jetty.

## Files

- `game/src/world.js` — the pier level: walls, cover, manifests, fog, patrols
- `game/src/guards.js` — guard AI: patrol, suspicion, investigate, chase, return
- `game/src/player.js` — the thief: movement, pickups, the fish lure, escape
- `game/src/render.js` — canvas drawing: pier, cones, fog, HUD, overlays
- `game/src/audio.js` — WebAudio synth: footsteps, harbor ambience, alarm
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — the loop and game states

---

<sub>Entered on [make.fun](https://make.fun/?ref=x15bjha9&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
