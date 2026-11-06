(() => {
  const $ = (s) => document.querySelector(s);
  const cvs = $("#c"), ctx = cvs.getContext("2d");
  const STORE = "idea-graveyard-v1";

  // ---------- saved state (only in this browser) ----------
  let saved = { respects: {}, buried: [] };
  try { Object.assign(saved, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) {}
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (e) {} };

  // seeded random so the scene looks the same every visit
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- world ----------
  let W, H, S, DPR, groundY;
  let graves = [], ads = [], trees = [], stars = [], fog = [], wisps = [];
  let gateX, endX, camMin, camMax;
  let camC = 0, vel = 0, target = null;
  const TYPES = ["round", "gothic", "cross", "obelisk", "slab"];

  // object at world x `a` with parallax `p` -> screen x. Everything lines up at screen center.
  const sx = (a, p) => W / 2 + (a - camC) * p;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cvs.width = W * DPR; cvs.height = H * DPR;
    cvs.style.width = W + "px"; cvs.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    S = clamp(Math.min(H / 820, W / 520), 0.62, 1.25);
    groundY = H * (H > W ? 0.56 : 0.6);
    build();
  }

  function build() {
    const all = [...window.GRAVES, ...saved.buried.map((g) => ({ ...g, fresh: true }))];
    gateX = 230 * S;
    const start = gateX + 260 * S, step = 120 * S;
    graves = all.map((g, i) => {
      const r = rng(i * 977 + 13);
      return {
        ...g, id: g.id || "g" + i, x: start + i * step + (r() - 0.5) * 30 * S, row: i % 2,
        type: g.type || TYPES[Math.floor(r() * TYPES.length)], tilt: (r() - 0.5) * 0.09, shade: 0.82 + r() * 0.22,
      };
    });
    const last = graves.length ? graves[graves.length - 1].x : start;
    endX = last + 220 * S;
    camMin = W / 2;
    camMax = Math.max(camMin, endX + 200 * S - W / 2);

    ads = window.ADS.map((a, i) => ({ ...a, x: start + (i * 5 + 2.5) * step, seed: i * 31 + 7 }))
      .filter((a) => a.x < endX + 300 * S);

    const tr = rng(42);
    trees = [];
    for (let x = -200; x < endX + 900 * S; x += (260 + tr() * 320) * S)
      trees.push({ x, segs: makeTree(Math.floor(tr() * 1e6)), scale: 0.8 + tr() * 0.6, p: 0.68 + tr() * 0.06 });

    const sr = rng(7);
    stars = Array.from({ length: 180 }, () => ({ x: sr() * 1.4, y: sr() * 0.55, r: sr() * 1.3 + 0.2, ph: sr() * 6 }));
    fog = Array.from({ length: 26 }, () => ({ x: sr() * 3000, y: sr(), r: 140 + sr() * 220, sp: 6 + sr() * 14, a: 0.05 + sr() * 0.07 }));
    wisps = Array.from({ length: 22 }, () => ({ x: sr() * (endX + 400), y: sr(), ph: sr() * 6, sp: 0.3 + sr() * 0.6 }));

    $("#count").textContent = `${graves.length} ideas resting in peace`;
    camC = clamp(camC || camMin, camMin, camMax);
  }

  function makeTree(seed) {
    const r = rng(seed), segs = [];
    const br = (x, y, a, len, w, d) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      segs.push([x, y, x2, y2, w]);
      if (!d) return;
      const n = 1 + (r() < 0.75 ? 1 : 0) + (d > 3 && r() < 0.25 ? 1 : 0);
      for (let i = 0; i < n; i++) br(x2, y2, a + (r() - 0.5) * 1.3, len * (0.62 + r() * 0.16), w * 0.66, d - 1);
    };
    br(0, 0, -Math.PI / 2 + (r() - 0.5) * 0.25, 70 + r() * 40, 11, 6);
    return segs;
  }

  // ---------- drawing ----------
  let hits = [], hover = null, t = 0;

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, "#05060c"); g.addColorStop(0.6, "#121a2b"); g.addColorStop(1, "#253049");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, groundY + 2);

    for (const s of stars) {
      const x = ((s.x * W * 1.4 - camC * 0.02) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
      ctx.globalAlpha = 0.35 + 0.45 * Math.sin(t * 1.5 + s.ph) ** 2;
      ctx.fillStyle = "#dfe6ff";
      ctx.fillRect(x, s.y * groundY, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    const mx = W * 0.78 - camC * 0.03, my = H * 0.16, mr = 46 * S;
    const glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5);
    glow.addColorStop(0, "#c8d6ff40"); glow.addColorStop(1, "#c8d6ff00");
    ctx.fillStyle = glow; ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
    ctx.fillStyle = "#eef0e2"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
    ctx.fillStyle = "#cfd2c255";
    for (const [dx, dy, r] of [[-14, -10, 9], [12, 8, 12], [-6, 18, 6], [18, -16, 5]]) {
      ctx.beginPath(); ctx.arc(mx + dx * S, my + dy * S, r * S, 0, 7); ctx.fill();
    }
  }

  function drawHills(p, amp, color, seed) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, groundY + 2);
    for (let x = 0; x <= W + 10; x += 10) {
      const u = (x - W / 2) / S + camC * p / S + seed;
      const h = amp * (0.55 + 0.25 * Math.sin(u * 0.004) + 0.15 * Math.sin(u * 0.011 + 1) + 0.05 * Math.sin(u * 0.03));
      ctx.lineTo(x, groundY - h * S);
    }
    ctx.lineTo(W, groundY + 2); ctx.fill();
  }

  function drawTree(tree) {
    const x = sx(tree.x, tree.p), s = S * tree.scale;
    if (x < -300 * s || x > W + 300 * s) return;
    ctx.save(); ctx.translate(x, groundY + 4 * S); ctx.scale(s, s);
    ctx.strokeStyle = "#0b0d13"; ctx.lineCap = "round";
    for (const [x1, y1, x2, y2, w] of tree.segs) {
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
  }

  function flicker(seed) {
    const k = Math.floor(t * 9 + seed);
    const r = rng(k)();
    return seed % 3 === 0 && r < 0.12 ? 0.15 : 0.85 + 0.15 * Math.sin(t * 20 + seed);
  }

  function drawBillboard(ad) {
    const p = 0.55, x = sx(ad.x, p), s = S * 0.85;
    const w = 240 * s, h = 118 * s, postH = 64 * s, base = groundY - 18 * S;
    if (x < -w || x > W + w) return;
    const top = base - postH - h, left = x - w / 2;
    const lit = flicker(ad.seed);
    const isHover = hover && hover.obj === ad;

    // light cones
    ctx.save(); ctx.globalAlpha = 0.18 * lit;
    for (const lx of [left + w * 0.25, left + w * 0.75]) {
      const g = ctx.createLinearGradient(0, top - 14 * s, 0, top + h);
      g.addColorStop(0, "#fff6c8"); g.addColorStop(1, "#fff6c800");
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(lx - 3 * s, top - 14 * s); ctx.lineTo(lx + 3 * s, top - 14 * s);
      ctx.lineTo(lx + 70 * s, top + h); ctx.lineTo(lx - 70 * s, top + h); ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "#14100c";
    ctx.fillRect(x - w * 0.32 - 4 * s, base - postH, 8 * s, postH);
    ctx.fillRect(x + w * 0.32 - 4 * s, base - postH, 8 * s, postH);
    ctx.fillRect(left - 6 * s, top - 6 * s, w + 12 * s, h + 12 * s);
    ctx.fillRect(left, top + h + 6 * s, w, 4 * s); // catwalk

    ctx.fillStyle = ad.color; ctx.fillRect(left, top, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(left, top, w, h); ctx.clip();
    ctx.fillStyle = "#00000055"; ctx.fillRect(left, top + h * 0.62, w, h * 0.38);
    ctx.fillStyle = "#fff";
    ctx.font = `${42 * s}px "Bebas Neue", Impact, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    let fs = 42 * s; while (ctx.measureText(ad.title).width > w * 0.9 && fs > 10) { fs -= 2; ctx.font = `${fs}px "Bebas Neue", Impact, sans-serif`; }
    ctx.fillText(ad.title, x, top + h * 0.34);
    ctx.font = `${11.5 * s}px Arial, sans-serif`;
    wrap(ad.tag, w * 0.86).slice(0, 2).forEach((ln, i, a) => ctx.fillText(ln, x, top + h * 0.81 + (i - (a.length - 1) / 2) * 13 * s));
    // peeling corner
    ctx.fillStyle = "#e9e1cc"; ctx.beginPath();
    ctx.moveTo(left + w, top); ctx.lineTo(left + w - 26 * s, top); ctx.lineTo(left + w, top + 22 * s); ctx.fill();
    ctx.fillStyle = "#00000088"; ctx.fillRect(left, top, w, h);
    ctx.fillStyle = `rgba(255,246,200,${0.55 * lit})`; ctx.globalCompositeOperation = "soft-light"; ctx.fillRect(left, top, w, h);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - lit)})`; ctx.fillRect(left, top, w, h);

    // lamps
    ctx.fillStyle = "#14100c";
    for (const lx of [left + w * 0.25, left + w * 0.75]) {
      ctx.fillRect(lx - 1.5 * s, top - 16 * s, 3 * s, 12 * s);
      ctx.fillStyle = `rgba(255,240,180,${lit})`; ctx.fillRect(lx - 6 * s, top - 18 * s, 12 * s, 4 * s); ctx.fillStyle = "#14100c";
    }
    if (isHover) { ctx.strokeStyle = "#9fe0b0"; ctx.lineWidth = 2; ctx.strokeRect(left - 6 * s, top - 6 * s, w + 12 * s, h + 12 * s); }
    hits.push({ x: left - 6 * s, y: top - 20 * s, w: w + 12 * s, h: h + postH + 26 * s, obj: ad, kind: "ad" });
  }

  function drawFenceAndGate() {
    const p = 0.86, base = groundY + 26 * S, gap = 15 * S, hh = 46 * S;
    const g0 = gateX + 80 * S, g1 = endX + 600 * S;
    ctx.strokeStyle = "#0a0b10"; ctx.fillStyle = "#0a0b10"; ctx.lineWidth = 2.2 * S;
    const xa = sx(g0, p), xb = sx(g1, p);
    ctx.beginPath();
    ctx.moveTo(Math.max(xa, -10), base - hh * 0.85); ctx.lineTo(Math.min(xb, W + 10), base - hh * 0.85);
    ctx.moveTo(Math.max(xa, -10), base - hh * 0.25); ctx.lineTo(Math.min(xb, W + 10), base - hh * 0.25);
    ctx.stroke();
    for (let i = 0, a = g0; a < g1; a += gap, i++) {
      const x = sx(a, p); if (x < -20 || x > W + 20) continue;
      const lean = ((i * 7919) % 13 === 0) ? 6 * S : 0;
      if ((i * 104729) % 29 === 0) continue; // missing bar
      ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + lean, base - hh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + lean, base - hh - 7 * S); ctx.lineTo(x + lean - 3 * S, base - hh + 1);
      ctx.lineTo(x + lean + 3 * S, base - hh + 1); ctx.fill();
    }
    // gate
    const gx = sx(gateX, p), pw = 26 * S, ph = 120 * S, half = 78 * S;
    for (const px of [gx - half, gx + half]) {
      ctx.fillStyle = "#3a3d46"; ctx.fillRect(px - pw / 2, base - ph, pw, ph);
      ctx.fillStyle = "#4a4e58"; ctx.fillRect(px - pw / 2 - 4 * S, base - ph - 8 * S, pw + 8 * S, 10 * S);
      ctx.fillStyle = "#2a2c33"; ctx.beginPath(); ctx.arc(px, base - ph - 14 * S, 8 * S, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = "#0e0f14"; ctx.lineWidth = 4 * S;
    ctx.beginPath(); ctx.moveTo(gx - half, base - ph + 10 * S);
    ctx.quadraticCurveTo(gx, base - ph - 70 * S, gx + half, base - ph + 10 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx - half, base - ph + 26 * S);
    ctx.quadraticCurveTo(gx, base - ph - 44 * S, gx + half, base - ph + 26 * S); ctx.stroke();
    ctx.fillStyle = "#c9c4b0"; ctx.font = `${15 * S}px "IM Fell English", serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("IDEA  GRAVEYARD", gx, base - ph - 16 * S);
    // open gate doors, swung inward
    ctx.lineWidth = 2 * S;
    for (const d of [-1, 1]) {
      const hx = gx + d * (half - pw / 2), ex = hx - d * 34 * S;
      for (let k = 0; k <= 5; k++) {
        const x = hx + (ex - hx) * (k / 5);
        ctx.beginPath(); ctx.moveTo(x, base - 2 * S + k * 3 * S); ctx.lineTo(x, base - ph * 0.8 + k * 3 * S); ctx.stroke();
      }
    }
  }

  function wrap(text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function stonePath(type, w, h) {
    ctx.beginPath();
    switch (type) {
      case "gothic":
        ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * 0.68);
        ctx.quadraticCurveTo(-w / 2, -h * 0.92, 0, -h * 1.02);
        ctx.quadraticCurveTo(w / 2, -h * 0.92, w / 2, -h * 0.68); ctx.lineTo(w / 2, 0); ctx.closePath();
        return { top: -h * 0.72, bottom: -10, tw: w * 0.82, rip: -h * 0.8 };
      case "slab": {
        const sw = w * 1.25, shh = h * 0.7;
        ctx.moveTo(-sw / 2, 0); ctx.lineTo(-sw / 2, -shh + 8); ctx.quadraticCurveTo(-sw / 2, -shh, -sw / 2 + 8, -shh);
        ctx.lineTo(sw / 2 - 8, -shh); ctx.quadraticCurveTo(sw / 2, -shh, sw / 2, -shh + 8); ctx.lineTo(sw / 2, 0); ctx.closePath();
        return { top: -shh + 10, bottom: -8, tw: sw * 0.86, rip: null };
      }
      case "obelisk":
        ctx.moveTo(-w * 0.36, 0); ctx.lineTo(-w * 0.28, -h * 1.1); ctx.lineTo(0, -h * 1.27);
        ctx.lineTo(w * 0.28, -h * 1.1); ctx.lineTo(w * 0.36, 0); ctx.closePath();
        return { top: -h * 0.82, bottom: -10, tw: w * 0.56, rip: -h * 1.0 };
      case "cross": {
        const bw = w * 1.15, bh = h * 0.34, cw = w * 0.24, ch = h * 0.95, aw = w * 0.82, ay = -bh - ch * 0.7;
        ctx.rect(-bw / 2, -bh, bw, bh);
        ctx.rect(-cw / 2, -bh - ch, cw, ch);
        ctx.rect(-aw / 2, ay - cw / 2, aw, cw);
        return { top: -bh + 4, bottom: -4, tw: bw * 0.9, rip: null, small: true };
      }
      default:
        ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h + w / 2); ctx.arc(0, -h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(w / 2, 0); ctx.closePath();
        return { top: -h + w * 0.45, bottom: -10, tw: w * 0.84, rip: -h + w * 0.28 };
    }
  }

  function engrave(text, x, y) {
    ctx.fillStyle = "#ffffff30"; ctx.fillText(text, x, y + 1);
    ctx.fillStyle = "#1e2026"; ctx.fillText(text, x, y);
  }

  function drawGrave(g) {
    const back = g.row === 1, p = back ? 0.9 : 1;
    const s = S * (back ? 0.8 : 1.1);
    const x = sx(g.x, p), base = groundY + (H - groundY) * (back ? 0.22 : 0.5);
    if (x < -120 * s || x > W + 120 * s) return;
    const w = 78 * s, h = 112 * s;
    const isHover = hover && hover.obj === g;

    // shadow + dirt mound
    ctx.fillStyle = "#00000066"; ctx.beginPath(); ctx.ellipse(x + 10 * s, base + 2 * s, w * 0.75, 8 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = g.fresh ? "#3b2a1c" : "#1a2418";
    ctx.beginPath(); ctx.ellipse(x, base + 12 * s, w * 0.7, 12 * s, 0, Math.PI, 0); ctx.fill();

    ctx.save(); ctx.translate(x, base); ctx.rotate(g.tilt);
    const box = stonePath(g.type, w, h);
    const sh = g.shade * (isHover ? 1.25 : 1) * (back ? 0.8 : 1);
    const grad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    const c = (v) => Math.round(clamp(v * sh, 0, 255));
    grad.addColorStop(0, `rgb(${c(150)},${c(156)},${c(168)})`);
    grad.addColorStop(1, `rgb(${c(70)},${c(74)},${c(84)})`);
    if (isHover) { ctx.shadowColor = "#9fe0b0"; ctx.shadowBlur = 24; }
    ctx.fillStyle = grad; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#00000077"; ctx.lineWidth = 1.5; ctx.stroke();
    // moonlit edge
    ctx.save(); ctx.clip(); ctx.fillStyle = "#e8ecff18"; ctx.fillRect(w * 0.28, -h * 1.4, w, h * 1.5); ctx.restore();
    // moss
    ctx.fillStyle = "#3d5a3555";
    ctx.beginPath(); ctx.ellipse(-w * 0.3, -4 * s, 14 * s, 6 * s, 0, 0, 7); ctx.fill();

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (box.rip !== null) { ctx.font = `bold ${12 * s}px "IM Fell English", serif`; engrave("R.I.P.", 0, box.rip); }
    let fs = (box.small ? 10 : 12.5) * s, lines;
    const maxLines = box.small ? 2 : 4;
    do {
      ctx.font = `${fs}px "IM Fell English", serif`;
      lines = wrap(g.name, box.tw);
      fs -= 0.5;
    } while ((lines.length > maxLines || lines.some((l) => ctx.measureText(l).width > box.tw)) && fs > 6);
    const lh = fs * 1.15, years = `${g.born ?? "?"} – ${g.died ?? "?"}`;
    const total = lines.length * lh + lh;
    const mid = (box.top + box.bottom) / 2;
    lines.forEach((ln, i) => engrave(ln, 0, mid - total / 2 + lh * (i + 0.5)));
    ctx.font = `${fs * 0.85}px "IM Fell English", serif`;
    engrave(years, 0, mid + total / 2 - lh * 0.4);
    ctx.restore();

    // candles for respects paid
    const n = Math.min(saved.respects[g.id] || 0, 3);
    for (let i = 0; i < n; i++) {
      const cx = x + (i - (n - 1) / 2) * 16 * s, cy = base + 8 * s;
      ctx.fillStyle = "#e9e1c7"; ctx.fillRect(cx - 2.5 * s, cy - 12 * s, 5 * s, 12 * s);
      const fl = 1 + 0.25 * Math.sin(t * 13 + i * 2 + g.x);
      const glow = ctx.createRadialGradient(cx, cy - 15 * s, 0, cx, cy - 15 * s, 26 * s * fl);
      glow.addColorStop(0, "#ffcf6a88"); glow.addColorStop(1, "#ffcf6a00");
      ctx.fillStyle = glow; ctx.fillRect(cx - 30 * s, cy - 45 * s, 60 * s, 60 * s);
      ctx.fillStyle = "#ffe39a"; ctx.beginPath(); ctx.ellipse(cx, cy - 16 * s, 2.2 * s, 4.5 * s * fl, 0, 0, 7); ctx.fill();
    }
    // grass tufts
    ctx.strokeStyle = back ? "#16201a" : "#1f2d22"; ctx.lineWidth = 1.4 * s;
    for (let k = -3; k <= 3; k++) {
      const gx = x + k * 11 * s + 4 * s, sway = Math.sin(t * 1.3 + g.x * 0.01 + k) * 2 * s;
      ctx.beginPath(); ctx.moveTo(gx, base + 6 * s); ctx.lineTo(gx + sway - 2 * s, base - 8 * s);
      ctx.moveTo(gx + 2 * s, base + 6 * s); ctx.lineTo(gx + sway + 4 * s, base - 5 * s); ctx.stroke();
    }
    const top = base - h * (g.type === "obelisk" ? 1.3 : 1.05);
    hits.push({ x: x - w * 0.65, y: top, w: w * 1.3, h: base - top + 14 * s, obj: g, kind: "grave" });
  }

  function drawOpenPlot() {
    const x = sx(endX, 1), base = groundY + (H - groundY) * 0.5, s = S;
    if (x < -200 || x > W + 200) return;
    const isHover = hover && hover.kind === "plot";
    ctx.fillStyle = "#2c2016";
    ctx.beginPath(); ctx.ellipse(x + 78 * s, base - 4 * s, 46 * s, 26 * s, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#050404"; ctx.beginPath(); ctx.ellipse(x, base + 4 * s, 56 * s, 13 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = isHover ? "#9fe0b0" : "#3b2a1c"; ctx.lineWidth = 3 * s; ctx.stroke();
    // shovel
    ctx.save(); ctx.translate(x + 82 * s, base - 22 * s); ctx.rotate(0.35);
    ctx.fillStyle = "#4a3523"; ctx.fillRect(-2.5 * s, -78 * s, 5 * s, 70 * s);
    ctx.fillRect(-10 * s, -84 * s, 20 * s, 5 * s);
    ctx.fillStyle = "#6c717c"; ctx.beginPath(); ctx.moveTo(-11 * s, -10 * s); ctx.lineTo(11 * s, -10 * s); ctx.lineTo(9 * s, 14 * s); ctx.lineTo(0, 20 * s); ctx.lineTo(-9 * s, 14 * s); ctx.fill();
    ctx.restore();
    // sign
    ctx.save(); ctx.translate(x - 62 * s, base); ctx.rotate(-0.06);
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(-2.5 * s, -60 * s, 5 * s, 62 * s);
    ctx.fillStyle = isHover ? "#d8c8a0" : "#b8a67e"; ctx.fillRect(-46 * s, -82 * s, 92 * s, 38 * s);
    ctx.fillStyle = "#2a1d10"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `bold ${11 * s}px "IM Fell English", serif`; ctx.fillText("PLOT AVAILABLE", 0, -70 * s);
    ctx.font = `italic ${10 * s}px "IM Fell English", serif`; ctx.fillText("bury yours here", 0, -55 * s);
    ctx.restore();
    if (isHover) { ctx.shadowBlur = 0; }
    hits.push({ x: x - 112 * s, y: base - 90 * s, w: 220 * s, h: 110 * s, obj: null, kind: "plot" });
  }

  function drawFog(front) {
    for (const f of fog) {
      if ((f.y > 0.5) !== front) continue;
      const span = W + 2 * f.r * S;
      const x = ((f.x - camC * (front ? 1.15 : 0.8) + t * f.sp) % span + span) % span - f.r * S;
      const y = groundY + (front ? 90 + f.y * 120 : -10 + f.y * 120) * S;
      const r = f.r * S;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(190,205,230,${f.a})`); g.addColorStop(1, "rgba(190,205,230,0)");
      ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.35); ctx.translate(-x, -y);
      ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
    }
  }

  function drawWisps() {
    for (const w of wisps) {
      const x = sx(w.x, 1) + Math.sin(t * w.sp + w.ph) * 30 * S;
      if (x < -20 || x > W + 20) continue;
      const y = groundY + (20 + w.y * 140) * S + Math.cos(t * w.sp * 1.3 + w.ph) * 16 * S;
      const a = 0.4 + 0.4 * Math.sin(t * 2 + w.ph);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 10 * S);
      g.addColorStop(0, `rgba(170,255,190,${a})`); g.addColorStop(1, "rgba(170,255,190,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 10 * S, y - 10 * S, 20 * S, 20 * S);
    }
  }

  function frame(now) {
    t = now / 1000;
    if (!dragging) {
      if (target !== null) { camC += (target - camC) * 0.08; if (Math.abs(target - camC) < 1) target = null; }
      else { camC += vel; vel *= 0.93; if (Math.abs(vel) < 0.05) vel = 0; }
    }
    camC = clamp(camC, camMin, camMax);
    hits = [];

    drawSky();
    drawHills(0.12, 150, "#161d2d", 900);
    drawHills(0.3, 95, "#10151f", 300);
    ads.forEach(drawBillboard);
    trees.forEach(drawTree);

    const g = ctx.createLinearGradient(0, groundY, 0, H);
    g.addColorStop(0, "#141b18"); g.addColorStop(1, "#070a08");
    ctx.fillStyle = g; ctx.fillRect(0, groundY, W, H - groundY);
    drawFog(false);

    drawFenceAndGate();
    graves.filter((g) => g.row === 1).forEach(drawGrave);
    graves.filter((g) => g.row === 0).forEach(drawGrave);
    drawOpenPlot();
    drawWisps();
    drawFog(true);

    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.8);
    v.addColorStop(0, "#00000000"); v.addColorStop(1, "#000000b0");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }

  // ---------- input ----------
  let dragging = false, lastX = 0, moved = 0, lastMoveT = 0;
  const hitAt = (x, y) => { for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h; } return null; };

  cvs.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; moved = 0; vel = 0; target = null;
    cvs.setPointerCapture(e.pointerId);
  });
  cvs.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      camC -= dx; vel = -dx; lastMoveT = performance.now();
      if (moved > 6) cvs.classList.add("dragging");
      fadeHint();
    } else {
      hover = hitAt(e.clientX, e.clientY);
      cvs.classList.toggle("pointer", !!hover);
    }
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false; cvs.classList.remove("dragging");
    if (performance.now() - lastMoveT > 80) vel = 0;
    if (moved < 8) {
      const h = hitAt(e.clientX, e.clientY);
      if (h) open(h);
    }
  };
  cvs.addEventListener("pointerup", end);
  cvs.addEventListener("pointercancel", () => { dragging = false; });
  cvs.addEventListener("wheel", (e) => { e.preventDefault(); target = null; camC += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; fadeHint(); }, { passive: false });
  addEventListener("keydown", (e) => {
    if ($("#modal").classList.contains("open")) { if (e.key === "Escape") close(); return; }
    if (e.key === "ArrowRight" || e.key === "d") { vel = 14; target = null; fadeHint(); }
    if (e.key === "ArrowLeft" || e.key === "a") { vel = -14; target = null; fadeHint(); }
  });
  let hintGone = false;
  function fadeHint() { if (!hintGone) { hintGone = true; setTimeout(() => ($("#hint").style.opacity = 0), 2500); } }

  // ---------- modal ----------
  const modal = $("#modal"), card = $("#card");
  function show(html) { card.innerHTML = `<button class="close" aria-label="Close">×</button>` + html; modal.classList.add("open"); card.querySelector(".close").onclick = close; }
  function close() { modal.classList.remove("open"); hover = null; }
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  function open(h) {
    if (h.kind === "grave") showGrave(h.obj);
    else if (h.kind === "ad") showAd(h.obj);
    else if (h.kind === "plot") showBury();
  }

  function showGrave(g) {
    const n = saved.respects[g.id] || 0;
    show(`
      <div class="label">Here lies</div>
      <h2>${esc(g.name)}</h2>
      <div class="dates">${esc(g.born ?? "?")} — ${esc(g.died ?? "?")}</div>
      <div class="label">Cause of death</div>
      <p class="cause">${esc(g.cause || "Unknown. It just stopped.")}</p>
      ${g.epitaph ? `<blockquote>${esc(g.epitaph)}</blockquote>` : ""}
      <div class="row">
        <button id="respect" class="primary">🕯 Light a candle</button>
        ${g.link ? `<a class="btn" href="${esc(g.link)}" target="_blank" rel="noopener">Visit the remains ↗</a>` : ""}
        <span class="muted" id="rc">${n ? `${n} candle${n > 1 ? "s" : ""} lit` : "No one has visited yet."}</span>
      </div>
      ${g.fresh ? `<p class="muted" style="margin-top:16px">Freshly buried by you. Only visible in this browser.</p>` : ""}`);
    $("#respect").onclick = () => {
      saved.respects[g.id] = (saved.respects[g.id] || 0) + 1; persist();
      const m = saved.respects[g.id];
      $("#rc").textContent = `${m} candle${m > 1 ? "s" : ""} lit`;
    };
  }

  function showAd(a) {
    show(`<div class="ad">
      <span class="sponsored">SPONSORED</span>
      <h2 style="color:${a.color}">${esc(a.title)}</h2>
      <p class="tag">${esc(a.tag)}</p>
      <p>${esc(a.body)}</p>
      <div class="row"><button id="cta" class="primary">${esc(a.cta)}</button></div>
      <p class="fine">${esc(a.fine)}</p></div>`);
    $("#cta").onclick = (e) => { e.target.textContent = a.nope; e.target.disabled = true; };
  }

  function showBury() {
    const y = new Date().getFullYear();
    show(`
      <div class="label">A new resident</div>
      <h2>Bury an idea</h2>
      <p class="muted" style="margin:0 0 16px">Let it go. It's time.</p>
      <form id="buryForm" autocomplete="off">
        <label>Name of the deceased idea<input name="name" maxlength="48" required placeholder="e.g. Tinder for Cats"></label>
        <div class="years">
          <label>Born<input name="born" inputmode="numeric" maxlength="4" value="${y}"></label>
          <label>Died<input name="died" inputmode="numeric" maxlength="4" value="${y}"></label>
        </div>
        <label>Cause of death<textarea name="cause" maxlength="120" placeholder="Got distracted by a newer, shinier idea."></textarea></label>
        <label>Epitaph<input name="epitaph" maxlength="70" placeholder="It was fun while it lasted."></label>
        <div class="row"><button class="primary" type="submit">⚰ Lower it into the ground</button></div>
        <p class="muted" style="margin-top:12px">Saved only in this browser for now.</p>
      </form>`);
    $("#buryForm").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target), get = (k) => String(f.get(k) || "").trim();
      if (!get("name")) return;
      saved.buried.push({ id: "b" + Date.now(), name: get("name"), born: get("born") || "?", died: get("died") || "?",
        cause: get("cause"), epitaph: get("epitaph") });
      persist(); build(); close();
      target = clamp(graves[graves.length - 1].x, camMin, camMax);
    };
  }

  $("#buryBtn").onclick = showBury;
  $("#enter").onclick = () => $("#intro").classList.add("gone");

  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
  if (document.fonts) document.fonts.ready.then(() => {});
})();
