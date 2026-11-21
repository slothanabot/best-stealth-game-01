// Fog on Pier 9 — guards.js
// One job: the dockworker-guards' brains. Patrol waypoints, vision cones,
// suspicion that rises when the player is seen, investigation of a noise or
// a glimpse, a short chase, then a return to patrol. Detection never ends
// the game instantly: the player always gets a chance to break line of sight
// and let the alarm cool down.

import { sightBlocked, fogAt, hitsSolid } from './world.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function moveToward(guard, tx, ty, dt, speed) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  guard.x = nx;
  guard.y = ny;
  return dist - step < 2;
}

// Can this guard see the player right now? Range, cone angle, cover and fog
// all shrink what counts as seen. Returns 0 (unseen) to 1 (fully seen).
export function visibility(world, guard, px, py, time, sneaking) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  const fog = Math.max(fogAt(world, px, py, time), fogAt(world, guard.x, guard.y, time));
  const range = guard.coneRange * (1 - fog * 0.55);
  if (dist > range) return 0;
  const toPlayer = Math.atan2(dy, dx);
  const off = Math.abs(angleDiff(toPlayer, guard.angle));
  if (off > guard.coneHalf * (1 + fog * 0.4)) return 0;
  if (sightBlocked(world, guard.x, guard.y, px, py)) return 0;
  // Closer and more centred reads faster; sneaking (Shift) halves the read.
  const closeness = 1 - dist / range;
  const centred = 1 - off / guard.coneHalf;
  let seen = 0.35 + closeness * 0.45 + centred * 0.2;
  if (sneaking) seen *= 0.5;
  if (fog > 0.4) seen *= 0.6;
  return Math.min(1, seen);
}

export function updateGuards(world, guards, player, dt, time, events) {
  let maxSuspicion = 0;
  for (const guard of guards) {
    guard.stateTime += dt;
    const seen = visibility(world, guard, player.x, player.y, time, player.sneaking);

    if (guard.state === 'patrol') {
      if (seen > 0.55) {
        guard.suspicion = Math.min(1, (guard.suspicion || 0) + seen * dt * 1.6);
      } else {
        guard.suspicion = Math.max(0, (guard.suspicion || 0) - dt * 0.5);
      }
      if ((guard.suspicion || 0) >= 1) {
        guard.state = 'chase';
        guard.stateTime = 0;
        events.push({ type: 'spotted', guard: guard.name });
      } else if ((guard.suspicion || 0) > 0.45) {
        guard.state = 'investigate';
        guard.stateTime = 0;
        guard.investigateX = player.x;
        guard.investigateY = player.y;
        events.push({ type: 'suspicious', guard: guard.name });
      }
      if (guard.state === 'patrol') {
        if (guard.pause > 0) {
          guard.pause -= dt;
        } else {
          const wp = guard.waypoints[guard.wp];
          const arrived = moveToward(guard, wp[0], wp[1], dt, guard.speed);
          if (arrived) {
            guard.wp = (guard.wp + 1) % guard.waypoints.length;
            guard.pause = 1.2; // look around at each corner
          }
        }
      }
    } else if (guard.state === 'investigate') {
      const arrived = moveToward(guard, guard.investigateX, guard.investigateY, dt, guard.speed * 1.25);
      if (seen > 0.7) {
        guard.state = 'chase';
        guard.stateTime = 0;
        events.push({ type: 'spotted', guard: guard.name });
      } else if (arrived || guard.stateTime > 6) {
        guard.state = 'return';
        guard.stateTime = 0;
      }
    } else if (guard.state === 'chase') {
      moveToward(guard, player.x, player.y, dt, guard.speed * 1.7);
      // Caught only on contact; breaking sight for a while lets you recover.
      const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (dist < 20) {
        events.push({ type: 'caught', guard: guard.name });
      }
      if (seen < 0.15) {
        guard.lostTime = (guard.lostTime || 0) + dt;
        if (guard.lostTime > 2.5 || guard.stateTime > 7) {
          guard.state = 'return';
          guard.stateTime = 0;
          guard.lostTime = 0;
          guard.suspicion = 0.4;
          events.push({ type: 'lost', guard: guard.name });
        }
      } else {
        guard.lostTime = 0;
      }
    } else if (guard.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let best = 0;
      let bestD = Infinity;
      guard.waypoints.forEach((wp, i) => {
        const d = Math.hypot(wp[0] - guard.x, wp[1] - guard.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const wp = guard.waypoints[best];
      const arrived = moveToward(guard, wp[0], wp[1], dt, guard.speed * 1.2);
      if (arrived) {
        guard.wp = best;
        guard.state = 'patrol';
        guard.stateTime = 0;
        guard.suspicion = 0;
      }
    }

    // Never let a guard end up inside a crate or wall.
    if (hitsSolid(world, guard.x, guard.y)) {
      guard.x -= Math.cos(guard.angle) * 4;
      guard.y -= Math.sin(guard.angle) * 4;
    }
    maxSuspicion = Math.max(maxSuspicion, guard.suspicion || 0);
  }
  return maxSuspicion;
}

// A tossed fish lands here: every guard in earshot walks over to look.
export function lureGuards(guards, x, y) {
  for (const guard of guards) {
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < 260 && guard.state !== 'chase') {
      guard.state = 'investigate';
      guard.stateTime = 0;
      guard.investigateX = x;
      guard.investigateY = y;
      guard.suspicion = Math.max(guard.suspicion || 0, 0.5);
    }
  }
}
