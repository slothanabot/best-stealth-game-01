// Fog on Pier 9 — main.js
// One job: run the game. Owns the loop, the title / playing / win / caught
// states, the event bus between player, guards and audio, and the
// deterministic ?shot= scenes the screenshot tool drives.

import { buildWorld } from './world.js';
import { updateGuards, lureGuards } from './guards.js';
import { createPlayer, updatePlayer } from './player.js';
import { draw, drawOverlay } from './render.js';
import { makeAudio } from './audio.js';
import { makeInput } from './input.js';
import { applyShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 960 * dpr;
  canvas.height = 600 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const world = buildWorld(seed);
const player = createPlayer(world);
const audio = makeAudio();
const input = makeInput(canvas);

const state = {
  mode: 'title', // title | playing | win | caught
  time: 0,
  lures: [],
  toast: '',
  toastTime: 0,
  caughtBy: '',
  lastStep: 0,
};

function setToast(text) {
  state.toast = text;
  state.toastTime = 3;
  statusEl.textContent = text;
}

function resetGame() {
  const fresh = buildWorld(seed);
  world.walls = fresh.walls;
  world.cover = fresh.cover;
  world.manifests = fresh.manifests;
  world.exit = fresh.exit;
  world.fogBanks = fresh.fogBanks;
  world.guards = fresh.guards;
  const p = createPlayer(world);
  Object.assign(player, p);
  state.lures = [];
  state.time = 0;
  state.mode = 'playing';
  state.toast = '';
  state.toastTime = 0;
  audio.startAmbience();
}

function handleEvents(events) {
  for (const ev of events) {
    if (ev.type === 'manifest') {
      audio.pickup();
      setToast(`${ev.label} stolen — ${ev.count} of 3`);
    } else if (ev.type === 'fish') {
      audio.gull();
      state.lures.push({ x: ev.x, y: ev.y, ttl: 8 });
      lureGuards(world.guards, ev.x, ev.y);
      setToast('Fish tossed — a gull screams, a guard turns away');
    } else if (ev.type === 'suspicious') {
      setToast(`${ev.guard} heard something…`);
    } else if (ev.type === 'spotted') {
      audio.alarm();
      setToast(`${ev.guard} spotted you — break line of sight!`);
    } else if (ev.type === 'lost') {
      setToast(`${ev.guard} lost you in the fog`);
    } else if (ev.type === 'caught') {
      if (state.mode === 'playing') {
        state.mode = 'caught';
        state.caughtBy = ev.guard;
        audio.caught();
      }
    } else if (ev.type === 'escaped') {
      if (state.mode === 'playing') {
        state.mode = 'win';
        audio.win();
      }
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.mode === 'title') {
    if (input.start) {
      input.start = false;
      audio.unlock();
      resetGame();
    }
    // Guards keep patrolling behind the title so the cover shot is alive.
    updateGuards(world, world.guards, player, dt, state.time, []);
    state.time += dt;
    draw(ctx, world, player, world.guards, state, state.time);
    drawOverlay(ctx, world, 'title');
  } else if (state.mode === 'playing') {
    state.time += dt;
    if (state.toastTime > 0) state.toastTime -= dt;
    const events = [];
    updatePlayer(world, player, input, dt, events);
    updateGuards(world, world.guards, player, dt, state.time, events);
    // Footstep sounds on the beat of the walk cycle.
    if (player.moving && state.time - state.lastStep > (player.sneaking ? 0.55 : 0.38)) {
      state.lastStep = state.time;
      audio.step(player.sneaking);
    }
    for (const lure of state.lures) lure.ttl -= dt;
    state.lures = state.lures.filter((l) => l.ttl > 0);
    handleEvents(events);
    draw(ctx, world, player, world.guards, state, state.time);
  } else {
    // win / caught: frozen scene under the overlay, R restarts.
    if (input.restart) {
      input.restart = false;
      resetGame();
    }
    draw(ctx, world, player, world.guards, state, state.time);
    if (state.mode === 'win') drawOverlay(ctx, world, 'win', Math.floor(state.time));
    else drawOverlay(ctx, world, 'caught', state.caughtBy);
  }
  requestAnimationFrame(frame);
}

// Debug handle for play-testing: the live world, player and state.
// Harmless in the shipped game; the screenshot and play-test tools read it.
window.__game = { world, player, state, input };
// game in a readable state and set window.__shotReady when painted.
const shot = params.get('shot');
if (shot) {
  applyShotScene(shot, { world, player, state, input, audio, resetGame });
  requestAnimationFrame(() => {
    draw(ctx, world, player, world.guards, state, state.time);
    if (state.mode === 'title') drawOverlay(ctx, world, 'title');
    if (state.mode === 'win') drawOverlay(ctx, world, 'win', Math.floor(state.time));
    if (state.mode === 'caught') drawOverlay(ctx, world, 'caught', state.caughtBy);
    window.__shotReady = true;
  });
} else {
  requestAnimationFrame(frame);
}
