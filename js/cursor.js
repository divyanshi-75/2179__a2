(function () {

  /* hide default cursor on the whole page */
  document.documentElement.style.cursor = 'none';

  /*  Build the disco ball cursor  */
  const SIZE = 35;
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(SIZE * 2.5);
  canvas.height = Math.round(SIZE * 2.5);
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${SIZE}px;
    height: ${SIZE}px;
    pointer-events: none;
    z-index: 99999;
    display: block;
    image-rendering: crisp-edges;
    will-change: transform;
    transform-origin: 0 0;
  `;
  document.body.appendChild(canvas);

  /* draw disco ball onto canvas */
  function drawBall(angle) {
    const ctx = canvas.getContext('2d');
    const sz  = Math.round(SIZE * 2.5);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, sz, sz);
    const cx = sz / 2;
    const cy = sz / 2;
    const r  = sz / 2 - 1;

    /* outer glow ring */
    const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.2);
    outerGlow.addColorStop(0,   'rgba(0,230,118,0.6)');
    outerGlow.addColorStop(0.5, 'rgba(29,185,84,0.3)');
    outerGlow.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    /* base sphere */
    const g = ctx.createRadialGradient(cx * 0.55, cy * 0.45, 0, cx, cy, r);
    g.addColorStop(0,    'rgba(200,255,220,0.15)');
    g.addColorStop(0.2,  'rgba(100,255,160,0.25)');
    g.addColorStop(0.45, 'rgba(29,185,84,0.35)');
    g.addColorStop(0.7,  'rgba(10,80,40,0.5)');
    g.addColorStop(0.9,  'rgba(0,20,10,0.7)');
    g.addColorStop(1,    'rgba(0,0,0,0.85)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    /* mirror tiles */
    const ts = sz / 6;
    for (let row = 0; row < sz / ts + 1; row++) {
      for (let col = 0; col < sz / ts + 1; col++) {
        const tx = col * ts - sz * 0.05;
        const ty = row * ts - sz * 0.05;
        const dx = tx + ts / 2 - cx;
        const dy = ty + ts / 2 - cy;
        if (Math.sqrt(dx * dx + dy * dy) >= r) continue;
        /* rotate tile sampling with angle for spin effect */
        const rotX = dx * Math.cos(angle) - dy * Math.sin(angle);
        if (Math.random() > 0.5 || Math.abs(rotX) < ts * 0.3) {
          const bright = 0.4 + Math.random() * 0.6;
          const tileColors = ['rgba(255,255,255,', 'rgba(180,255,210,', 'rgba(0,230,118,', 'rgba(255,255,255,'];
          const pick = tileColors[Math.floor(Math.random() * tileColors.length)];
          ctx.fillStyle = pick + bright.toFixed(2) + ')';
          ctx.fillRect(tx + 0.5, ty + 0.5, ts - 1, ts - 1);
        }
      }
    }

    /* specular highlight */
    const sp = ctx.createRadialGradient(cx * 0.45, cy * 0.38, 0, cx * 0.45, cy * 0.38, r * 0.45);
    sp.addColorStop(0,    'rgba(255,255,255,1)');
    sp.addColorStop(0.25, 'rgba(255,255,255,0.8)');
    sp.addColorStop(0.5,  'rgba(200,255,230,0.3)');
    sp.addColorStop(1,    'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = sp;
    ctx.fill();

    /* clip to circle */
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    /* inner glow - bounded within the ball radius */
    const innerGlow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    innerGlow.addColorStop(0,   'transparent');
    innerGlow.addColorStop(0.7, 'rgba(29,185,84,0.1)');
    innerGlow.addColorStop(1,   'rgba(29,185,84,0.35)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    /* border ring */
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,230,118,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /*  Sparkle particle pool  */
  const POOL_SIZE = 60;
  const particles = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const p = document.createElement('canvas');
    p.width  = 12;
    p.height = 12;
    p.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      pointer-events: none;
      z-index: 99998;
      opacity: 0;
      will-change: transform, opacity;
    `;
    document.body.appendChild(p);
    particles.push({
      el: p,
      active: false,
      x: 0, y: 0,
      vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 0, color: '',
    });
  }

  function drawSparkle(p) {
    const ctx = p.el.getContext('2d');
    const s   = p.size * 2;
    p.el.width  = s + 4;
    p.el.height = s + 4;
    ctx.clearRect(0, 0, p.el.width, p.el.height);
    const cx = p.el.width / 2;
    const cy = p.el.height / 2;

    /* 4-point star shape */
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle  = (i / 8) * Math.PI * 2;
      const radius = i % 2 === 0 ? s / 2 : s / 6;
      const px     = cx + Math.cos(angle) * radius;
      const py     = cy + Math.sin(angle) * radius;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    /* glow */
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s / 2);
    glow.addColorStop(0,   p.color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
    glow.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  function spawnSparkle(x, y) {
    const p = particles.find(p => !p.active);
    if (!p) return;

    const colors = ['#1DB954', '#ffffff', '#7dffb0', '#ffd700', '#ffffff', '#1DB954'];
    p.active  = true;
    p.x       = x;
    p.y       = y;
    p.vx      = (Math.random() - 0.5) * 3;
    p.vy      = (Math.random() - 0.5) * 3 - 1;
    p.life    = 0;
    p.maxLife = 25 + Math.floor(Math.random() * 20);
    p.size    = 2 + Math.random() * 4;
    p.color   = colors[Math.floor(Math.random() * colors.length)];

    drawSparkle(p);
    p.el.style.opacity = '1';
  }

  /*  Mouse tracking  */
  let mouseX = -70;
  let mouseY = 70;
  let lastSpawnX = 0;
  let lastSpawnY = 0;
  let ballAngle  = 0;
  let frameCount = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  /* restore cursor when leaving window */
  document.addEventListener('mouseleave', () => {
    canvas.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    canvas.style.opacity = '100';
  });

  /*  Animation loop  */
  function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    /* move and redraw ball */
    canvas.style.transform = `translate(${mouseX - SIZE / 2}px, ${mouseY - SIZE / 2}px)`;

    /* redraw ball every 3 frames for tile animation */
    if (frameCount % 3 === 0) {
      ballAngle += 0.08;
      drawBall(ballAngle);
    }

    /* spawn sparkles when cursor moves */
    const dx   = mouseX - lastSpawnX;
    const dy   = mouseY - lastSpawnY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 8) {
      spawnSparkle(mouseX + (Math.random() - 0.5) * 8, mouseY + (Math.random() - 0.5) * 8);
      if (dist > 16) spawnSparkle(mouseX + (Math.random() - 0.5) * 8, mouseY + (Math.random() - 0.5) * 8);
      lastSpawnX = mouseX;
      lastSpawnY = mouseY;
    }

    /* update particles */
    particles.forEach(p => {
      if (!p.active) return;
      p.life++;
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.08;
      p.vx *= 0.96;

      const progress = p.life / p.maxLife;
      const opacity  = Math.max(0, 1 - progress * progress);
      const scale    = 1 - progress * 0.5;

      p.el.style.opacity   = opacity.toFixed(3);
      p.el.style.transform = `translate(${p.x - p.el.width / 2}px, ${p.y - p.el.height / 2}px) scale(${scale.toFixed(3)})`;

      if (p.life >= p.maxLife) {
        p.active = false;
        p.el.style.opacity = '0';
      }
    });
  }

  animate();
  drawBall(0);
  canvas.style.transform = `translate(-200px, -200px)`;

  /* restore cursor on interactive elements so they still work */
  const style = document.createElement('style');
  style.textContent = `
    * { cursor: none !important; }
    a, button, [role="button"], input, select, textarea, label {
      cursor: none !important;
    }
  `;
  document.head.appendChild(style);

})();
