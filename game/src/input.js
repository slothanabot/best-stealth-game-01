// Fog on Pier 9 — input.js
// One job: read the keyboard and mouse into one plain input state object
// that player.js consumes. WASD/arrows move, Shift sneaks, F tosses a fish,
// Enter starts, R restarts, click walks to a point.

export function makeInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    sneak: false, toss: false, start: false, restart: false,
    target: null,
  };
  const keys = {};

  function updateFromKeys() {
    input.up = !!(keys.ArrowUp || keys.KeyW);
    input.down = !!(keys.ArrowDown || keys.KeyS);
    input.left = !!(keys.ArrowLeft || keys.KeyA);
    input.right = !!(keys.ArrowRight || keys.KeyD);
    input.sneak = !!(keys.ShiftLeft || keys.ShiftRight);
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'KeyF' && !keys.KeyF) input.toss = true;
    if (e.code === 'Enter') input.start = true;
    if (e.code === 'KeyR') input.restart = true;
    keys[e.code] = true;
    updateFromKeys();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    updateFromKeys();
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    updateFromKeys();
  });

  // Click-to-walk: convert the click into game coordinates.
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 600 / rect.height;
    input.target = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    input.start = true; // a click also starts from the title screen
  });

  return input;
}
