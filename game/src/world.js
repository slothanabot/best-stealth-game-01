// Fog on Pier 9 — world.js
// One job: build the pier level. Walls, crates and containers (cover), the
// harbormaster's office with its three cargo manifests, the rowboat exit,
// drifting fog banks and the dockworker-guards' patrol routes.
// Everything is placed from a seed so a screenshot scene is reproducible.

export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// A rectangle the player and guards cannot walk through, and that blocks sight.
export function rect(x, y, w, h, kind) {
  return { x, y, w, h, kind };
}

export function buildWorld(seed) {
  const rng = makeRng(seed);
  const W = 960;
  const H = 600;

  // The pier deck. Water runs along the bottom edge and the right edge.
  const walls = [
    rect(0, 0, W, 18, 'fence'),          // north fence
    rect(0, 0, 18, H, 'fence'),          // west fence
    rect(0, 96, 210, 16, 'office-wall'), // office north wall
    rect(210, 96, 16, 150, 'office-wall'),
    rect(0, 246, 226, 16, 'office-wall'),// office south wall (door gap at x 120..150 is open)
    rect(560, 0, 16, 120, 'shed-wall'),
    rect(560, 120, 220, 16, 'shed-wall'),
    rect(764, 0, 16, 136, 'shed-wall'),
  ];

  // Cover: crates and containers. Standing behind one breaks a guard's sight.
  const cover = [
    rect(280, 60, 70, 46, 'crate'),
    rect(380, 52, 46, 46, 'crate'),
    rect(300, 170, 90, 60, 'container-blue'),
    rect(420, 180, 60, 90, 'container-rust'),
    rect(300, 320, 60, 60, 'crate'),
    rect(400, 330, 120, 56, 'container-green'),
    rect(560, 300, 46, 46, 'crate'),
    rect(640, 200, 90, 60, 'container-blue'),
    rect(660, 330, 60, 90, 'container-rust'),
    rect(820, 120, 46, 46, 'crate'),
    rect(820, 300, 80, 56, 'container-green'),
    rect(120, 330, 90, 56, 'container-rust'),
    rect(240, 430, 70, 46, 'crate'),
    rect(420, 450, 90, 56, 'container-blue'),
    rect(620, 460, 60, 60, 'crate'),
    rect(760, 430, 90, 56, 'container-green'),
    rect(60, 470, 60, 46, 'crate'),
  ];

  // The three cargo manifests, all inside the harbormaster's office (top-left).
  const manifests = [
    { id: 0, x: 52, y: 150, taken: false, label: 'Manifest A — tea' },
    { id: 1, x: 170, y: 180, taken: false, label: 'Manifest B — silk' },
    { id: 2, x: 88, y: 205, taken: false, label: 'Manifest C — spice' },
  ];

  // The rowboat at the south jetty. Reach it with all three manifests to win.
  const exit = { x: 880, y: 520, w: 62, h: 52, label: 'Rowboat — escape' };

  // Fog banks drift slowly across the pier. Inside fog a guard's cone shrinks
  // and the player is harder to spot.
  const fogBanks = [];
  for (let i = 0; i < 5; i++) {
    fogBanks.push({
      x: 120 + rng() * 700,
      y: 90 + rng() * 420,
      r: 70 + rng() * 55,
      drift: 6 + rng() * 10,
      phase: rng() * Math.PI * 2,
    });
  }

  // Guards: name, patrol waypoints, speed, cone range and half-angle.
  const guards = [
    {
      name: 'Bram', x: 330, y: 120, angle: 0, speed: 52,
      waypoints: [[330, 120], [520, 120], [520, 260], [330, 260]],
      wp: 0, state: 'patrol', stateTime: 0, coneRange: 170, coneHalf: 0.42,
      investigateX: 0, investigateY: 0, pause: 0,
    },
    {
      name: 'Odo', x: 700, y: 380, angle: Math.PI, speed: 46,
      waypoints: [[700, 380], [700, 520], [880, 520], [880, 380]],
      wp: 0, state: 'patrol', stateTime: 0, coneRange: 160, coneHalf: 0.45,
      investigateX: 0, investigateY: 0, pause: 0,
    },
    {
      name: 'Mira', x: 120, y: 420, angle: -Math.PI / 2, speed: 58,
      waypoints: [[120, 420], [330, 420], [330, 520], [120, 520]],
      wp: 0, state: 'patrol', stateTime: 0, coneRange: 175, coneHalf: 0.4,
      investigateX: 0, investigateY: 0, pause: 0,
    },
    {
      name: 'Sef', x: 850, y: 90, angle: Math.PI / 2, speed: 50,
      waypoints: [[850, 90], [850, 240], [620, 240], [620, 90]],
      wp: 0, state: 'patrol', stateTime: 0, coneRange: 165, coneHalf: 0.43,
      investigateX: 0, investigateY: 0, pause: 0,
    },
  ];

  return {
    width: W, height: H, walls, cover, manifests, exit, fogBanks, guards,
    playerStart: { x: 40, y: 560 },
    office: { x: 18, y: 96, w: 208, h: 150 },
  };
}

// True when point (px, py) sits inside any solid rectangle.
export function hitsSolid(world, px, py) {
  for (const r of world.walls) {
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return true;
  }
  for (const r of world.cover) {
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return true;
  }
  return false;
}

// True when the segment from (ax, ay) to (bx, by) is blocked by a solid.
// Sampled in small steps; cheap and good enough for cone checks.
export function sightBlocked(world, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (hitsSolid(world, ax + dx * t, ay + dy * t)) return true;
  }
  return false;
}

// Fog density (0..1) at a point, from the drifting banks.
export function fogAt(world, px, py, time) {
  let f = 0;
  for (const b of world.fogBanks) {
    const cx = b.x + Math.sin(time * 0.11 + b.phase) * b.drift * 4;
    const cy = b.y + Math.cos(time * 0.09 + b.phase) * b.drift * 3;
    const d = Math.hypot(px - cx, py - cy);
    if (d < b.r) f = Math.max(f, 1 - d / b.r);
  }
  return f;
}
