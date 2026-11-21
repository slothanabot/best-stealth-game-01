// Fog on Pier 9 — shots.js
// One job: the deterministic screenshot scenes. Each ?shot= value places the
// thief, the guards and the fog in a readable, frozen moment so the cover and
// the other screenshots show the game at its best. No gameplay runs here —
// main.js paints one frame and sets window.__shotReady.

export function applyShotScene(shot, deps) {
  const { world, player, state } = deps;

  if (shot === 'title') {
    state.mode = 'title';
    state.time = 6;
    // Thief at the jetty, guards mid-patrol, one cone crossing the pier.
    player.x = 60;
    player.y = 520;
    player.facing = -Math.PI / 2;
    world.guards[0].x = 420;
    world.guards[0].y = 130;
    world.guards[0].angle = Math.PI / 2;
    world.guards[1].x = 780;
    world.guards[1].y = 460;
    world.guards[1].angle = Math.PI;
    world.guards[2].x = 200;
    world.guards[2].y = 470;
    world.guards[2].angle = 0;
    world.guards[3].x = 700;
    world.guards[3].y = 160;
    world.guards[3].angle = Math.PI / 2;
    return;
  }

  if (shot === 'play') {
    state.mode = 'playing';
    state.time = 24;
    // Mid-heist: thief crouched behind a blue container with one manifest,
    // Bram's cone sweeping just past the cover.
    world.manifests[0].taken = true;
    player.manifests = 1;
    player.x = 386;
    player.y = 262;
    player.facing = Math.PI;
    player.sneaking = true;
    world.guards[0].x = 480;
    world.guards[0].y = 200;
    world.guards[0].angle = Math.PI;
    world.guards[0].suspicion = 0.3;
    world.guards[1].x = 720;
    world.guards[1].y = 400;
    world.guards[1].angle = -Math.PI / 2;
    world.guards[2].x = 240;
    world.guards[2].y = 470;
    world.guards[2].angle = -Math.PI / 2;
    world.guards[3].x = 700;
    world.guards[3].y = 120;
    world.guards[3].angle = Math.PI;
    state.lures = [{ x: 560, y: 300, ttl: 8 }];
    state.toast = 'Manifest A stolen — 1 of 3';
    state.toastTime = 3;
    return;
  }

  if (shot === 'alarm') {
    state.mode = 'playing';
    state.time = 41;
    // Near-detection: Mira is chasing, suspicion high, thief sprinting for
    // the fog bank by the green container with two manifests in the bag.
    world.manifests[0].taken = true;
    world.manifests[1].taken = true;
    player.manifests = 2;
    player.x = 560;
    player.y = 360;
    player.facing = Math.PI / 2;
    world.guards[2].x = 480;
    world.guards[2].y = 360;
    world.guards[2].angle = 0;
    world.guards[2].state = 'chase';
    world.guards[2].suspicion = 1;
    world.guards[0].x = 420;
    world.guards[0].y = 240;
    world.guards[0].angle = Math.PI / 2;
    world.guards[0].state = 'investigate';
    world.guards[0].suspicion = 0.7;
    world.guards[1].x = 760;
    world.guards[1].y = 460;
    world.guards[1].angle = Math.PI;
    world.guards[3].x = 680;
    world.guards[3].y = 200;
    world.guards[3].angle = Math.PI / 2;
    state.toast = 'Mira spotted you — break line of sight!';
    state.toastTime = 3;
    return;
  }

  if (shot === 'win') {
    state.mode = 'win';
    state.time = 96;
    // All three manifests stolen, thief stepping onto the rowboat.
    for (const m of world.manifests) m.taken = true;
    player.manifests = 3;
    player.x = 905;
    player.y = 540;
    player.facing = Math.PI / 2;
    world.guards[0].x = 380;
    world.guards[0].y = 150;
    world.guards[0].angle = 0;
    world.guards[1].x = 700;
    world.guards[1].y = 420;
    world.guards[1].angle = Math.PI;
    world.guards[2].x = 220;
    world.guards[2].y = 480;
    world.guards[2].angle = -Math.PI / 2;
    world.guards[3].x = 760;
    world.guards[3].y = 140;
    world.guards[3].angle = Math.PI / 2;
    return;
  }

  // Unknown scene: fall back to the title.
  state.mode = 'title';
  state.time = 6;
}
