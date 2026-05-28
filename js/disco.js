/**
 * disco.js
 * ─────────────────────────────────────────────────────
 * Adds scrolling disco balls + sparkle bling to the
 * left and right margins of the page.
 *
 * HOW TO USE:
 * 1. Save this file as  js/disco.js  in your repo
 * 2. Add this ONE line before </body> in index.html:
 *       <script src="js/disco.js"></script>
 * ─────────────────────────────────────────────────────
 */

(function () {

  /* ── Config ──────────────────────────────────────── */
  const BALLS = [
    /* { side, top-offset from top of page, size } */
    { side: 'left',  top: '12vh',  size: 90  },
    { side: 'right', top: '28vh',  size: 70  },
    { side: 'left',  top: '55vh',  size: 55  },
    { side: 'right', top: '72vh',  size: 100 },
    { side: 'left',  top: '110vh', size: 65  },
    { side: 'right', top: '145vh', size: 80  },
    { side: 'left',  top: '195vh', size: 50  },
    { side: 'right', top: '230vh', size: 90  },
    { side: 'left',  top: '290vh', size: 75  },
    { side: 'right', top: '340vh', size: 60  },
  ];
  const SPARKLE_COUNT = 28;
  const GREEN = '#1DB954';

  /* ── Inject base styles ──────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Disco ball ──────────────────────────────── */
    .disco-ball {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      animation: discoBallSpin var(--spin-dur, 6s) linear infinite,
                 discoBallFloat var(--float-dur, 4s) ease-in-out infinite alternate;
      will-change: transform;
    }

    .disco-ball canvas {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
    }

    /* glow ring around ball */
    .disco-ball::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      background: radial-gradient(
        circle at 38% 35%,
        rgba(255,255,255,0.12) 0%,
        transparent 60%
      );
      box-shadow: 0 0 30px rgba(29,185,84,0.12),
                  0 0 60px rgba(29,185,84,0.06);
      animation: glowPulse 3s ease-in-out infinite alternate;
    }

    @keyframes discoBallSpin {
      from { transform: rotate(0deg) translateY(0px); }
      to   { transform: rotate(360deg) translateY(0px); }
    }
    @keyframes discoBallFloat {
      from { margin-top: 0px; }
      to   { margin-top: 18px; }
    }
    @keyframes glowPulse {
      from { opacity: 0.4; }
      to   { opacity: 1; }
    }

    /* ── Disco light rays ─────────────────────────── */
    .disco-ray {
      position: fixed;
      pointer-events: none;
      z-index: 0;
      border-radius: 0 0 100% 100%;
      opacity: 0;
      transform-origin: top center;
      animation: raySwing var(--ray-dur, 5s) ease-in-out infinite alternate,
                 rayFade  var(--ray-dur, 5s) ease-in-out infinite alternate;
      will-change: transform, opacity;
    }
    @keyframes raySwing {
      from { transform: rotate(var(--ray-from, -20deg)); }
      to   { transform: rotate(var(--ray-to,    20deg)); }
    }
    @keyframes rayFade {
      0%,100% { opacity: 0; }
      40%,60% { opacity: var(--ray-opacity, 0.06); }
    }

    /* ── Sparkle dots ─────────────────────────────── */
    .sparkle {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      animation: sparklePop var(--sp-dur, 2s) ease-in-out infinite;
      animation-delay: var(--sp-delay, 0s);
      will-change: transform, opacity;
    }
    @keyframes sparklePop {
      0%   { opacity: 0;   transform: scale(0.2) rotate(0deg); }
      30%  { opacity: 1;   transform: scale(1.2) rotate(90deg); }
      60%  { opacity: 0.7; transform: scale(0.8) rotate(180deg); }
      100% { opacity: 0;   transform: scale(0.1) rotate(360deg); }
    }

    /* ── String hanging the ball ──────────────────── */
    .disco-string {
      position: absolute;
      width: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.15), transparent);
      pointer-events: none;
      transform-origin: top center;
      left: 50%;
    }

    /* ── Reflected light tiles on walls ──────────── */
    .disco-reflect {
      position: fixed;
      pointer-events: none;
      z-index: 0;
      opacity: 0;
      border-radius: 1px;
      animation: reflectMove var(--ref-dur, 3s) ease-in-out infinite alternate,
                 reflectBlink var(--ref-dur, 3s) ease-in-out infinite;
      animation-delay: var(--ref-delay, 0s);
      will-change: transform, opacity;
    }
    @keyframes reflectMove {
      from { transform: translate(0,0) rotate(0deg); }
      to   { transform: translate(var(--ref-mx, 10px), var(--ref-my, 8px)) rotate(45deg); }
    }
    @keyframes reflectBlink {
      0%,100% { opacity: 0; }
      50%     { opacity: var(--ref-op, 0.5); }
    }
  `;
  document.head.appendChild(style);

  /* ── Wrapper — positioned absolutely over the page ── */
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  `;
  document.body.style.position = 'relative';
  document.body.insertBefore(wrapper, document.body.firstChild);

  /* ── Helper: draw disco ball on canvas ───────────── */
  function drawDiscoBall(canvas, size) {
    const ctx = canvas.getContext('2d');
    canvas.width  = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r  = size / 2 - 2;

    /* base sphere gradient */
    const sph = ctx.createRadialGradient(cx * 0.6, cy * 0.5, 0, cx, cy, r);
    sph.addColorStop(0,   'rgba(255,255,255,0.25)');
    sph.addColorStop(0.4, 'rgba(180,180,190,0.15)');
    sph.addColorStop(1,   'rgba(10,10,12,0.9)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = sph;
    ctx.fill();

    /* mirror tiles */
    const tileRows = Math.floor(size / 10);
    const tileCols = Math.floor(size / 10);
    for (let row = 0; row < tileRows; row++) {
      for (let col = 0; col < tileCols; col++) {
        const tx = (col / tileCols) * size;
        const ty = (row / tileRows) * size;
        const tdx = tx - cx;
        const tdy = ty - cy;
        if (Math.sqrt(tdx * tdx + tdy * tdy) > r - 2) continue;

        /* random tile color: white, green, or silver */
        const pick = Math.random();
        let tileColor;
        if (pick < 0.06)       tileColor = `rgba(29,185,84,${0.5 + Math.random() * 0.5})`;
        else if (pick < 0.25)  tileColor = `rgba(255,255,255,${0.4 + Math.random() * 0.5})`;
        else                   tileColor = `rgba(${160 + Math.floor(Math.random()*80)},${160 + Math.floor(Math.random()*80)},${160 + Math.floor(Math.random()*80)},${0.15 + Math.random()*0.25})`;

        const tw = size / tileCols - 1;
        const th = size / tileRows - 1;
        ctx.fillStyle = tileColor;
        ctx.fillRect(tx + 0.5, ty + 0.5, tw, th);
      }
    }

    /* specular highlight */
    const spec = ctx.createRadialGradient(cx * 0.5, cy * 0.45, 0, cx * 0.5, cy * 0.45, r * 0.4);
    spec.addColorStop(0,   'rgba(255,255,255,0.55)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    spec.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    /* clip everything to circle */
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ── Create disco balls ───────────────────────────── */
  const CONTENT_W  = 900; /* matches --max-w in CSS */
  const MARGIN_PAD = 24;

  BALLS.forEach((cfg, i) => {
    const ball = document.createElement('div');
    ball.className = 'disco-ball';
    ball.style.cssText = `
      width:  ${cfg.size}px;
      height: ${cfg.size}px;
      top:    ${cfg.top};
      --spin-dur:  ${5 + Math.random() * 6}s;
      --float-dur: ${3 + Math.random() * 3}s;
    `;

    /* position relative to content column */
    if (cfg.side === 'left') {
      ball.style.right = `calc(50% + ${CONTENT_W / 2 + MARGIN_PAD}px - ${cfg.size / 2}px)`;
    } else {
      ball.style.left = `calc(50% + ${CONTENT_W / 2 + MARGIN_PAD}px - ${cfg.size / 2}px)`;
    }

    /* hanging string */
    const stringH = 40 + Math.random() * 30;
    const str = document.createElement('div');
    str.className = 'disco-string';
    str.style.cssText = `height: ${stringH}px; top: -${stringH}px;`;
    ball.appendChild(str);

    /* canvas */
    const canvas = document.createElement('canvas');
    drawDiscoBall(canvas, cfg.size * 2); /* 2x for sharpness */
    ball.appendChild(canvas);

    wrapper.appendChild(ball);

    /* ── Light rays from this ball ─────────────────── */
    const rayCount = 3 + Math.floor(Math.random() * 3);
    for (let r = 0; r < rayCount; r++) {
      const ray = document.createElement('div');
      ray.className = 'disco-ray';
      const angle   = -40 + r * (80 / rayCount);
      const length  = 200 + Math.random() * 300;
      const rayColor = Math.random() < 0.3
        ? `rgba(29,185,84,0.08)`
        : `rgba(255,255,255,0.05)`;

      ray.style.cssText = `
        width: 2px;
        height: ${length}px;
        background: linear-gradient(to bottom, ${rayColor}, transparent);
        top: ${cfg.top};
        --ray-from: ${angle - 15}deg;
        --ray-to:   ${angle + 15}deg;
        --ray-dur:  ${4 + Math.random() * 4}s;
        --ray-opacity: ${0.04 + Math.random() * 0.06};
        ${cfg.side === 'left'
          ? `right: calc(50% + ${CONTENT_W/2 + MARGIN_PAD + cfg.size/2}px);`
          : `left:  calc(50% + ${CONTENT_W/2 + MARGIN_PAD + cfg.size/2}px);`
        }
      `;
      document.body.appendChild(ray);
    }
  });

  /* ── Reflected light squares ─────────────────────── */
  const reflectColors = [
    'rgba(29,185,84,VAL)',
    'rgba(255,255,255,VAL)',
    'rgba(180,220,255,VAL)',
    'rgba(255,220,180,VAL)',
  ];

  for (let i = 0; i < 40; i++) {
    const ref   = document.createElement('div');
    ref.className = 'disco-reflect';
    const col   = reflectColors[Math.floor(Math.random() * reflectColors.length)];
    const op    = 0.3 + Math.random() * 0.5;
    const w     = 3 + Math.random() * 8;
    const side  = Math.random() < 0.5 ? 'left' : 'right';
    const xPos  = side === 'left'
      ? Math.random() * 200
      : window.innerWidth - Math.random() * 200;

    ref.style.cssText = `
      width:  ${w}px;
      height: ${w}px;
      left:   ${xPos}px;
      top:    ${5 + Math.random() * 90}vh;
      background: ${col.replace('VAL', op.toFixed(2))};
      --ref-dur:   ${1.5 + Math.random() * 3}s;
      --ref-delay: ${Math.random() * 4}s;
      --ref-mx:    ${-15 + Math.random() * 30}px;
      --ref-my:    ${-15 + Math.random() * 30}px;
      --ref-op:    ${op.toFixed(2)};
    `;
    document.body.appendChild(ref);
  }

  /* ── Sparkle dots scattered on margins ───────────── */
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const sp   = document.createElement('div');
    sp.className = 'sparkle';
    const size = 2 + Math.random() * 5;
    const isGreen = Math.random() < 0.3;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const xPos = side === 'left'
      ? 10 + Math.random() * 180
      : window.innerWidth - 10 - Math.random() * 180;

    sp.style.cssText = `
      width:  ${size}px;
      height: ${size}px;
      left:   ${xPos}px;
      top:    ${Math.random() * 100}vh;
      background: ${isGreen ? GREEN : 'rgba(255,255,255,0.9)'};
      box-shadow: 0 0 ${size * 2}px ${isGreen ? 'rgba(29,185,84,0.8)' : 'rgba(255,255,255,0.6)'};
      --sp-dur:   ${1 + Math.random() * 3}s;
      --sp-delay: ${Math.random() * 5}s;
    `;
    document.body.appendChild(sp);
  }

  /* ── Parallax: balls move slightly on scroll ──────── */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      document.querySelectorAll('.disco-ball').forEach((ball, i) => {
        const speed  = 0.04 + (i % 3) * 0.02;
        const offset = scrollY * speed;
        ball.style.marginTop = `${offset}px`;
      });
      ticking = false;
    });
  });

})();
