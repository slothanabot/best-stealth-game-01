// Fog on Pier 9 — player.js
// One job: the thief. Movement (walk / sneak), picking up manifests, tossing
// the gull-distraction fish, and reaching the rowboat to escape.

import { hitsSolid } from './world.js';

export function createPlayer(world) {
  return {
    x: world.playerStart.x,
    y: world.playerStart.y,
    radius: 11,
    speed: 132,
    sneakSpeed: 62,
    sneaking: false,
    moving: false,
    stepPhase: 0,
    manifests: 0,
    fish: 3,
    facing: -Math.PI / 2,
  };
}

// Try to move by (dx, dy), sliding along walls instead of sticking to them.
function tryMove(world, player, dx, dy) {
  const r = player.radius;
  const nx = player.x + dx;
  const ny = player.y + dy;
  const corners = [
    [nx - r, ny - r], [nx + r, ny - r], [nx - r, ny + r], [nx + r, ny + r],
    [nx, ny - r], [nx, ny + r], [nx - r, ny], [nx + r, ny],
  ];
  const blocked = (x, y) => x < 18 || x > world.width - 2 || y < 18 || y > world.height - 2 || hitsSolid(world, x, y);
  if (!corners.some(([x, y]) => blocked(x, y))) {
    player.x = nx;
    player.y = ny;
    return true;
  }
  // Slide: try x-only, then y-only.
  const xOnly = corners.every(([x, y]) => !blocked(x, player.y + (y - ny)));
  if (xOnly && !blocked(nx - r, player.y) && !blocked(nx + r, player.y)) {
    player.x = nx;
    return true;
  }
  const yOnly = corners.every(([x, y]) => !blocked(player.x + (x - nx), y));
  if (yOnly && !blocked(player.x, ny - r) && !blocked(player.x, ny + r)) {
    player.y = ny;
    return true;
  }
  return false;
}

export function updatePlayer(world, player, input, dt, events) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  // Mouse click-to-move: walk toward the clicked point.
  if (!mx && !my && input.target) {
    const dx = input.target.x - player.x;
    const dy = input.target.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      mx = dx / d;
      my = dy / d;
    } else {
      input.target = null;
    }
  }
  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  player.sneaking = !!input.sneak;
  if (player.moving) {
    const speed = player.sneaking ? player.sneakSpeed : player.speed;
    const step = speed * dt;
    tryMove(world, player, (mx / len) * step, (my / len) * step);
    player.facing = Math.atan2(my / len, mx / len);
    player.stepPhase += dt * (player.sneaking ? 5 : 9);
  }

  // Pick up any manifest within reach.
  for (const m of world.manifests) {
    if (!m.taken && Math.hypot(m.x - player.x, m.y - player.y) < 26) {
      m.taken = true;
      player.manifests += 1;
      events.push({ type: 'manifest', label: m.label, count: player.manifests });
    }
  }

  // Toss a fish: it lands a short way ahead and lures nearby guards.
  if (input.toss && player.fish > 0) {
    input.toss = false;
    player.fish -= 1;
    const fx = player.x + Math.cos(player.facing) * 110;
    const fy = player.y + Math.sin(player.facing) * 110;
    events.push({ type: 'fish', x: fx, y: fy });
  }

  // Win: all three manifests, then step onto the rowboat.
  const e = world.exit;
  const onBoat = player.x > e.x - 8 && player.x < e.x + e.w + 8
    && player.y > e.y - 8 && player.y < e.y + e.h + 8;
  if (onBoat && player.manifests >= 3) {
    events.push({ type: 'escaped' });
  }
  return player;
}
