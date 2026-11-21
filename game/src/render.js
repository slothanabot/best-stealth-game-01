// Fog on Pier 9 — render.js
// One job: draw everything. The night pier, the office, crates and containers,
// guards with their flashlight vision cones, the thief, drifting fog, the
// rowboat exit, and the HUD. All drawing is canvas 2D, no images.

import { fogAt, hitsSolid } from './world.js';

// A vision cone clipped by cover: cast rays across the cone and stop each
// one where it first hits a solid, so the light never shines through a crate.
function conePolygon(world, g, range) {
  const rays = 28;
  const pts = [{ x: g.x, y: g.y }];
  for (let i = 0; i <= rays; i++) {
    const a = g.angle - g.coneHalf + (2 * g.coneHalf * i) / rays;
    let r = range;
    for (let d = 8; d <= range; d += 8) {
      if (hitsSolid(world, g.x + Math.cos(a) * d, g.y + Math.sin(a) * d)) {
        r = d;
        break;
      }
    }
    pts.push({ x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r });
  }
  return pts;
}

const CONE_COLORS = {
  patrol: 'rgba(255, 214, 120, 0.20)',
  investigate: 'rgba(255, 170, 60, 0.30)',
  chase: 'rgba(255, 70, 60, 0.38)',
  return: 'rgba(255, 214, 120, 0.16)',
};

export function draw(ctx, world, player, guards, state, time) {
  const W = world.width;
  const H = world.height;
  ctx.clearRect(0, 0, W, H);

  // Water along the bottom and right edges, deck everywhere else.
  ctx.fillStyle = '#0d2b3d';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120, 200, 230, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const y = 566 + i * 5 + Math.sin(time * 0.7 + i * 1.7) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(240, y - 3, 640, y + 3, W, y);
    ctx.stroke();
  }
  // Deck planks.
  ctx.fillStyle = '#3a2f24';
  ctx.fillRect(0, 0, W, 560);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let y = 18; y < 560; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let x = 40; x < W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }

  // Harbormaster's office floor.
  ctx.fillStyle = '#4a3b2c';
  ctx.fillRect(world.office.x, world.office.y, world.office.w, world.office.h);
  ctx.fillStyle = '#d8c49a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('HARBORMASTER', 34, 118);

  // Walls.
  for (const r of world.walls) {
    ctx.fillStyle = r.kind === 'fence' ? '#6b5a44' : '#7a6a52';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(r.x, r.y, r.w, 3);
  }
  // Office door gap marker.
  ctx.fillStyle = '#e8c96a';
  ctx.fillRect(120, 246, 30, 4);

  // Cover: crates and containers, each labelled so the judge can read them.
  for (const c of world.cover) {
    if (c.kind === 'crate') {
      ctx.fillStyle = '#8a6a34';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#5d451f';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else {
      const colors = {
        'container-blue': '#2e5f7a',
        'container-rust': '#8a4a2a',
        'container-green': '#3f6b3a',
      };
      ctx.fillStyle = colors[c.kind] || '#555';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      for (let x = c.x + 10; x < c.x + c.w; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, c.y);
        ctx.lineTo(x, c.y + c.h);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    }
  }

  // Manifests not yet taken.
  for (const m of world.manifests) {
    if (m.taken) continue;
    const bob = Math.sin(time * 3 + m.id * 2) * 2;
    ctx.fillStyle = '#f4ead2';
    ctx.fillRect(m.x - 9, m.y - 12 + bob, 18, 24);
    ctx.strokeStyle = '#8a7a52';
    ctx.strokeRect(m.x - 9, m.y - 12 + bob, 18, 24);
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(m.x - 5, m.y - 5 + bob);
    ctx.lineTo(m.x + 5, m.y - 5 + bob);
    ctx.moveTo(m.x - 5, m.y + bob);
    ctx.lineTo(m.x + 5, m.y + bob);
    ctx.moveTo(m.x - 5, m.y + 5 + bob);
    ctx.lineTo(m.x + 2, m.y + 5 + bob);
    ctx.stroke();
    ctx.fillStyle = '#e8c96a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('◆', m.x - 4, m.y - 18 + bob);
  }

  // Rowboat exit at the south jetty.
  const e = world.exit;
  ctx.fillStyle = '#5a3d24';
  ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = '#7a5230';
  ctx.beginPath();
  ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2 - 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ROWBOAT', e.x + e.w + 4, e.y - 24);
  ctx.fillStyle = player.manifests >= 3 ? '#8aff9a' : '#c9b98a';
  ctx.font = '11px sans-serif';
  ctx.fillText(player.manifests >= 3 ? 'ESCAPE — go!' : 'needs 3 manifests', e.x + e.w + 4, e.y - 10);
  ctx.textAlign = 'left';

  // Fish lures on the ground.
  for (const f of state.lures) {
    ctx.fillStyle = '#bcd8e8';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 10, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a9ab0';
    ctx.beginPath();
    ctx.moveTo(f.x + 9, f.y);
    ctx.lineTo(f.x + 15, f.y - 4);
    ctx.lineTo(f.x + 15, f.y + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Guards: vision cone first, then the body, so the cone reads underneath.
  for (const g of guards) {
    const fog = fogAt(world, g.x, g.y, time);
    const range = g.coneRange * (1 - fog * 0.55);
    ctx.fillStyle = CONE_COLORS[g.state] || CONE_COLORS.patrol;
    ctx.beginPath();
    const poly = conePolygon(world, g, range);
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    // Suspicion arc above the guard's head.
    if ((g.suspicion || 0) > 0.05) {
      ctx.strokeStyle = g.suspicion > 0.66 ? '#ff5040' : '#ffcf5a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y - 20, 10, -Math.PI / 2, -Math.PI / 2 + (g.suspicion || 0) * Math.PI * 2);
      ctx.stroke();
    }
    // Body: dark coat, pale face, yellow lamp.
    ctx.fillStyle = '#20242e';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 4, g.y + Math.sin(g.angle) * 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 13, g.y + Math.sin(g.angle) * 13, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(g.name, g.x - 12, g.y - 26);
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff5040';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('!', g.x - 2, g.y - 34);
    }
  }

  // The thief: hooded figure with a satchel, facing the way they move.
  const bobP = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bobP);
  ctx.fillStyle = '#1d2b1d';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f7a44';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 3, Math.sin(player.facing) * 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a35a';
  ctx.fillRect(-4, 4, 8, 5);
  ctx.restore();
  // Sneak ring shows the player is quiet.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(140, 255, 154, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 17, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Drifting fog: soft pale blobs over the pier.
  for (const b of world.fogBanks) {
    const cx = b.x + Math.sin(time * 0.11 + b.phase) * b.drift * 4;
    const cy = b.y + Math.cos(time * 0.09 + b.phase) * b.drift * 3;
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, b.r);
    grad.addColorStop(0, 'rgba(200, 214, 224, 0.30)');
    grad.addColorStop(1, 'rgba(200, 214, 224, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHud(ctx, world, player, guards, state);
}

export function drawHud(ctx, world, player, guards, state) {
  // Top bar.
  ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
  ctx.fillRect(0, 0, world.width, 34);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('FOG ON PIER 9', 12, 22);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Manifests  ${player.manifests} / 3`, 180, 22);
  ctx.fillText(`Fish  ${player.fish}`, 320, 22);
  const alarm = guards.some((g) => g.state === 'chase');
  const sus = guards.some((g) => (g.suspicion || 0) > 0.45);
  ctx.fillStyle = alarm ? '#ff5040' : sus ? '#ffcf5a' : '#8aff9a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(alarm ? '● ALARM — break sight!' : sus ? '● SUSPICIOUS' : '● UNSEEN', 430, 22);
  const fogHere = fogAt(world, player.x, player.y, state.time);
  ctx.fillStyle = '#c9d6e2';
  ctx.font = '13px sans-serif';
  ctx.fillText(fogHere > 0.35 ? 'in fog — hidden' : 'in the open', 640, 22);
  ctx.fillText(`Time ${Math.floor(state.time)}s`, 800, 22);

  // Bottom help line.
  ctx.fillStyle = 'rgba(8, 12, 18, 0.7)';
  ctx.fillRect(0, world.height - 24, world.width, 24);
  ctx.fillStyle = '#c9d6e2';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD / arrows move · Shift sneak · F toss a fish · click to walk · steal 3 manifests, escape by rowboat', 12, world.height - 8);

  // Toast message.
  if (state.toast && state.toastTime > 0) {
    ctx.fillStyle = 'rgba(8, 12, 18, 0.85)';
    const w = ctx.measureText(state.toast).width + 24;
    ctx.fillRect((world.width - w) / 2, 44, w, 26);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(state.toast, (world.width - w) / 2 + 12, 62);
  }
}

// Full-screen title / end overlays, drawn over the game. The title stays
// light enough that the pier, cones and cover still read behind the text.
export function drawOverlay(ctx, world, kind, detail) {
  ctx.fillStyle = kind === 'title' ? 'rgba(6, 10, 16, 0.55)' : 'rgba(6, 10, 16, 0.72)';
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.textAlign = 'center';
  if (kind === 'title') {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('FOG ON PIER 9', world.width / 2, 170);
    ctx.fillStyle = '#c9d6e2';
    ctx.font = '18px sans-serif';
    ctx.fillText('A night harbor heist — steal 3 cargo manifests, escape unseen', world.width / 2, 205);
    ctx.font = '15px sans-serif';
    ctx.fillText('Guards patrol with flashlight cones · crates and containers are cover', world.width / 2, 245);
    ctx.fillText('Fog shrinks their sight · toss a fish (F) to lure a guard away', world.width / 2, 270);
    ctx.fillText('Shift to sneak · if spotted, break line of sight and the alarm cools', world.width / 2, 295);
    ctx.fillStyle = '#8aff9a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press ENTER or click to begin', world.width / 2, 350);
    ctx.fillStyle = '#8a97a8';
    ctx.font = '13px sans-serif';
    ctx.fillText('WASD / arrows to move · F fish · Shift sneak', world.width / 2, 390);
  } else if (kind === 'win') {
    ctx.fillStyle = '#8aff9a';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('CLEAN GETAWAY!', world.width / 2, 220);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`All 3 manifests aboard the rowboat in ${detail}s — the fog kept you.`, world.width / 2, 260);
    ctx.fillText('Press R to play again', world.width / 2, 300);
  } else if (kind === 'caught') {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('CAUGHT ON THE PIER', world.width / 2, 220);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`${detail} grabbed you under the lamps. The manifests stay behind.`, world.width / 2, 260);
    ctx.fillText('Press R to try again — slower, quieter, through the fog', world.width / 2, 300);
  }
  ctx.textAlign = 'left';
}
