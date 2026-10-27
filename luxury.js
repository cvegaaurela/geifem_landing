/* GEIFEM · partículas (canvas 2D, sin dependencias).
   1) Hero: el logo real se muestrea y se convierte en arena que huye del cursor.
   2) Escenas: una nube de partículas cambia de forma con el scroll
      (hexágonos → red → barras → esfera), una por línea de solución.
   Si el visitante pidió reducir movimiento, no corre y se queda el logo estático. */
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  var small = innerWidth < 700;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var PAL = ["rgba(176,128,36,.95)", "rgba(0,48,91,.95)", "rgba(5,67,135,.9)"];  // dorado, azul marino, azul medio (fondo claro)
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seed = 11;
  function sr() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  /* ---------- Sistema de partículas con resorte ---------- */
  function System(canvas, n) {
    this.c = canvas; this.ctx = canvas.getContext("2d"); this.n = n;
    this.x = new Float32Array(n); this.y = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    this.tx = new Float32Array(n); this.ty = new Float32Array(n);
    this.bounds = [n, n, n];      // fin de cada clase de color (índices contiguos)
    this.w = 0; this.h = 0; this.k = 0.05; this.R = 110; this.F = 5.2; this.size = 1.7;
  }
  System.prototype.resize = function (w, h) {
    this.w = w; this.h = h;
    this.c.width = Math.round(w * DPR); this.c.height = Math.round(h * DPR);
    this.c.style.width = w + "px"; this.c.style.height = h + "px";
  };
  System.prototype.scatter = function (amp) {
    for (var i = 0; i < this.n; i++) {
      var a = Math.random() * 6.2832, s = amp * (0.3 + Math.random());
      this.vx[i] += Math.cos(a) * s; this.vy[i] += Math.sin(a) * s;
    }
  };
  System.prototype.step = function (mx, my) {
    var n = this.n, x = this.x, y = this.y, vx = this.vx, vy = this.vy, tx = this.tx, ty = this.ty;
    var k = this.k, R = this.R, R2 = R * R, F = this.F;
    for (var i = 0; i < n; i++) {
      vx[i] += (tx[i] - x[i]) * k; vy[i] += (ty[i] - y[i]) * k;
      var dx = x[i] - mx, dy = y[i] - my, d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 0.01) {
        var d = Math.sqrt(d2), f = (1 - d / R); f *= f * F;
        vx[i] += dx / d * f; vy[i] += dy / d * f;
      }
      vx[i] *= 0.84; vy[i] *= 0.84;
      x[i] += vx[i]; y[i] += vy[i];
    }
  };
  System.prototype.draw = function () {
    var ctx = this.ctx, s = this.size * DPR, h = s / 2, start = 0;
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    ctx.globalCompositeOperation = "source-over";
    for (var c = 0; c < 3; c++) {
      ctx.fillStyle = PAL[c];
      for (var i = start; i < this.bounds[c]; i++) ctx.fillRect(this.x[i] * DPR - h, this.y[i] * DPR - h, s, s);
      start = this.bounds[c];
    }
  };

  /* ---------- Visibilidad ---------- */
  var live = new Set();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.isIntersecting ? live.add(e.target) : live.delete(e.target); });
  }, { rootMargin: "120px 0px" });

  /* =====================================================================
     1) HERO — logo de partículas
     ===================================================================== */
  var hero = document.getElementById("inicio");
  var logoImg = hero && hero.querySelector(".hlogo");
  var heroCv = hero && hero.querySelector(".hero-cv");
  var H = null, mx = -9999, my = -9999;

  function buildHero() {
    var W = 150, Hh = Math.round(W * logoImg.naturalHeight / logoImg.naturalWidth);
    var oc = document.createElement("canvas"); oc.width = W; oc.height = Hh;
    var o = oc.getContext("2d", { willReadFrequently: true });
    o.drawImage(logoImg, 0, 0, W, Hh);
    var d = o.getImageData(0, 0, W, Hh).data, px = [];
    for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4;
      if (d[i + 3] > 150 && (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) < 205) px.push(x, y, d[i], d[i + 1], d[i + 2]);
    }
    var total = px.length / 5;
    if (total < 200) return;                      // imagen sin datos útiles: se queda el logo estático
    var n = small ? 2600 : 7000, buckets = [[], [], []];
    for (var p = 0; p < n; p++) {
      var j = ((Math.random() * total) | 0) * 5, r = px[j + 2], g = px[j + 3], b = px[j + 4];
      var lum = 0.3 * r + 0.59 * g + 0.11 * b;
      var cls = (r > b + 25 && r > 120) ? 0 : (lum < 75 ? 1 : 2);
      buckets[cls].push([px[j] + Math.random() - 0.5, px[j + 1] + Math.random() - 0.5]);
    }
    var sys = new System(heroCv, n), idx = 0, ends = 0;
    sys.size = small ? 1.7 : 2.2; sys.R = small ? 70 : 120; sys.F = 5.6; sys.k = 0.045;
    var u = []; // coordenadas normalizadas del logo [-.5,.5]
    buckets.forEach(function (bk, c) {
      bk.forEach(function (q) { u.push([q[0] / W - 0.5, q[1] / Hh - 0.5]); });
      ends += bk.length; sys.bounds[c] = ends;
    });
    H = { sys: sys, u: u, ratio: logoImg.naturalHeight / logoImg.naturalWidth };
    layoutHero(true);
    root.classList.add("lux-hero");
    io.observe(hero);
  }

  function layoutHero(first) {
    if (!H) return;
    var wrap = hero.querySelector(".hlogo-wrap").getBoundingClientRect();
    var side = Math.max(220, Math.min(wrap.width * 1.55, 640, innerWidth));
    H.sys.resize(side, side);
    H.logoH = wrap.width * 0.9; H.logoW = H.logoH / H.ratio;
    var sys = H.sys;
    for (var i = 0; i < sys.n; i++) {
      sys.tx[i] = side / 2 + H.u[i][0] * H.logoW;
      sys.ty[i] = side / 2 + H.u[i][1] * H.logoH;
      if (first) {                                  // nacen dispersas y se ensamblan
        var a = Math.random() * 6.2832, r = side * (0.25 + Math.random() * 0.5);
        sys.x[i] = side / 2 + Math.cos(a) * r; sys.y[i] = side / 2 + Math.sin(a) * r;
      }
    }
  }

  if (hero && logoImg && heroCv) {
    var start = function () { try { buildHero(); } catch (e) { /* respaldo: logo estático */ } };
    if (logoImg.complete && logoImg.naturalWidth) start(); else logoImg.addEventListener("load", start);
    if (fine) {
      hero.addEventListener("pointermove", function (e) {
        if (!H) return;
        var r = heroCv.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
      });
      hero.addEventListener("pointerleave", function () { mx = my = -9999; });
    }
    hero.addEventListener("pointerdown", function () { if (H) H.sys.scatter(9); });
  }

  /* =====================================================================
     2) ESCENAS — formas ligadas al scroll
     ===================================================================== */
  var sec = document.getElementById("escenas");
  var scv = sec && sec.querySelector(".scenes-cv");
  var S = null, scene = 0, cx = 0, cy = 0, Rr = 1, theta = 0, smx = -9999, smy = -9999;

  function hexPt(r, t) {
    var k = Math.floor(t) % 6, u = t - Math.floor(t), a = k * Math.PI / 3, b = (k + 1) * Math.PI / 3;
    var x0 = r * Math.sin(a), y0 = -r * Math.cos(a), x1 = r * Math.sin(b), y1 = -r * Math.cos(b);
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
  }

  function genShapes(n) {
    var shapes = [];
    // 0 · hexágonos concéntricos con radios (rumbo)
    var a0 = [], rings = [1, 0.74, 0.48, 0.24], wts = [0.4, 0.7, 0.9, 1];
    for (var i = 0; i < n; i++) {
      var q, rnd = sr();
      if (rnd < 0.1) { var v = hexPt(1, Math.floor(sr() * 6)), t = sr(); q = [v[0] * t, v[1] * t]; }
      else { var w = sr(), ri = w < wts[0] ? 0 : w < wts[1] ? 1 : w < wts[2] ? 2 : 3; q = hexPt(rings[ri], sr() * 6); }
      a0.push([q[0] + (sr() - 0.5) * 0.012, q[1] + (sr() - 0.5) * 0.012]);
    }
    shapes.push(a0);
    // 1 · red de nodos (procesos conectados)
    var nodes = [], edges = [], M = 24, m, j;
    for (m = 0; m < M; m++) { var ang = sr() * 6.2832, rad = Math.sqrt(sr()) * 0.95; nodes.push([Math.cos(ang) * rad, Math.sin(ang) * rad]); }
    nodes.forEach(function (p, a) {
      var ds = nodes.map(function (q, b) { return [b, (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1])]; })
        .sort(function (u, v) { return u[1] - v[1]; });
      edges.push([a, ds[1][0]], [a, ds[2][0]]);
    });
    var a1 = [];
    for (i = 0; i < n; i++) {
      if (sr() < 0.3) { var nd = nodes[(sr() * M) | 0]; a1.push([nd[0] + (sr() + sr() - 1) * 0.04, nd[1] + (sr() + sr() - 1) * 0.04]); }
      else { var e = edges[(sr() * edges.length) | 0], A = nodes[e[0]], B = nodes[e[1]], tt = sr(); a1.push([A[0] + (B[0] - A[0]) * tt + (sr() - 0.5) * 0.012, A[1] + (B[1] - A[1]) * tt + (sr() - 0.5) * 0.012]); }
    }
    shapes.push(a1);
    // 2 · barras ascendentes con línea de tendencia (datos)
    var hs = [0.25, 0.38, 0.34, 0.55, 0.5, 0.8, 1], bw = 0.17, gap = 0.06, x0 = -(7 * bw + 6 * gap) / 2, base = 0.62, a2 = [];
    for (i = 0; i < n; i++) {
      var r2 = sr();
      if (r2 < 0.72) { var bi = (sr() * 7) | 0, bx = x0 + bi * (bw + gap), top = base - hs[bi] * 1.25; a2.push([bx + sr() * bw, top + sr() * (base - top)]); }
      else if (r2 < 0.9) { var s = sr() * 6, si = Math.floor(s), f = s - si, xa = x0 + si * (bw + gap) + bw / 2, xb = x0 + (si + 1) * (bw + gap) + bw / 2; a2.push([xa + (xb - xa) * f, (base - hs[si] * 1.25 - 0.08) + ((base - hs[si + 1] * 1.25 - 0.08) - (base - hs[si] * 1.25 - 0.08)) * f]); }
      else a2.push([-0.95 + sr() * 1.9, base + 0.01 + sr() * 0.012]);
    }
    shapes.push(a2);
    // 3 · esfera (3D, se calcula por cuadro)
    var s3 = [];
    for (i = 0; i < n; i++) {
      var yy = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - yy * yy), ph = i * 2.399963;
      s3.push([Math.cos(ph) * rr, yy, Math.sin(ph) * rr]);
    }
    shapes.push(s3);
    return shapes;
  }

  function setScene(i, kick) {
    scene = i;
    sec.querySelectorAll(".sc").forEach(function (el, k) { el.classList.toggle("active", k === i); });
    sec.querySelectorAll(".sc-dots li").forEach(function (el, k) { el.classList.toggle("on", k === i); });
    if (kick) S.sys.scatter(small ? 10 : 16);
    applyTargets();
  }

  function applyTargets() {
    if (!S || scene === 3) return;
    var sh = S.shapes[scene], sys = S.sys;
    for (var i = 0; i < sys.n; i++) { sys.tx[i] = cx + sh[i][0] * Rr; sys.ty[i] = cy + sh[i][1] * Rr; }
  }

  function layoutScenes(first) {
    if (!S) return;
    var w = innerWidth, h = innerHeight;
    S.sys.resize(w, h);
    if (w >= 900) { cx = w * 0.7; cy = h * 0.5; Rr = Math.min(w * 0.26, h * 0.36); }
    else { cx = w / 2; cy = h * 0.3; Rr = Math.min(w * 0.34, h * 0.15); }   // móvil: la figura queda arriba, lejos del texto
    S.sys.R = small ? 70 : 120;
    if (first) for (var i = 0; i < S.sys.n; i++) { S.sys.x[i] = cx + (Math.random() - 0.5) * w; S.sys.y[i] = cy + (Math.random() - 0.5) * h; }
    applyTargets();
  }

  function buildScenes() {
    var n = small ? 3400 : 7200;
    var sys = new System(scv, n);
    sys.size = small ? 1.8 : 2.3; sys.k = 0.042;
    sys.bounds = [Math.round(n * 0.28), Math.round(n * 0.68), n];
    S = { sys: sys, shapes: genShapes(n) };
    sec.classList.add("live");
    layoutScenes(true);
    setScene(0, false);
    io.observe(sec);
    if (fine) {
      sec.addEventListener("pointermove", function (e) { smx = e.clientX; smy = e.clientY; });
      sec.addEventListener("pointerleave", function () { smx = smy = -9999; });
    }
  }
  if (sec && scv) { try { buildScenes(); } catch (e) { sec.classList.remove("live"); } }

  addEventListener("resize", function () {
    small = innerWidth < 700;
    layoutHero(false); layoutScenes(false);
  });

  /* ---------- Bucle ---------- */
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;

    if (H && live.has(hero)) { H.sys.step(mx, my); H.sys.draw(); }

    if (S && live.has(sec)) {
      var r = sec.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight);
      var p = clamp(-r.top / span, 0, 1), idx = Math.min(3, Math.floor(p * 4));
      if (idx !== scene) setScene(idx, true);
      var sys = S.sys;
      if (scene === 3) {
        theta += 0.006;
        var c = Math.cos(theta), s = Math.sin(theta), sh = S.shapes[3];
        for (var i = 0; i < sys.n; i++) {
          var q = sh[i], x = q[0] * c + q[2] * s, z = -q[0] * s + q[2] * c, f = 1 / (1 - z * 0.22);
          sys.tx[i] = cx + x * f * Rr; sys.ty[i] = cy + q[1] * f * Rr;
        }
      }
      sys.step(smx, smy); sys.draw();
    }
  }
  requestAnimationFrame(frame);
})();
