/* GEIFEM · capa de motion graphics (sin dependencias).
   Solo corre si el <head> activó .mo (el visitante no pidió reducir movimiento). */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("mo")) return;

  var NS = "http://www.w3.org/2000/svg";
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  var vh = innerHeight;
  addEventListener("resize", function () { vh = innerHeight; buildMarquees(); });

  /* La cortina de intro ya se oculta sola con CSS; aquí solo se retira del DOM */
  setTimeout(function () { var c = document.querySelector(".curtain"); if (c) c.remove(); }, 2400);

  /* Visibilidad: solo se anima lo que está en pantalla */
  var visible = new Set();
  var vis = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.isIntersecting ? visible.add(e.target) : visible.delete(e.target); });
  }, { rootMargin: "80px 0px" });

  /* ---------- Titulares: palabra por palabra ---------- */
  $(".head .h2, .final h2").forEach(function (h) {
    var text = h.textContent.trim().replace(/\s+/g, " ");
    h.setAttribute("aria-label", text);
    h.textContent = "";
    text.split(" ").forEach(function (w, i) {
      if (i) h.appendChild(document.createTextNode(" "));
      var mw = document.createElement("span"), mi = document.createElement("span");
      mw.className = "mw"; mw.setAttribute("aria-hidden", "true");
      mi.className = "mi"; mi.style.setProperty("--wi", i); mi.textContent = w;
      mw.appendChild(mi); h.appendChild(mw);
    });
  });

  /* ---------- Iconos que se dibujan, listas y chips en cascada ---------- */
  $(".ico").forEach(function (svg) {
    $("path,circle,rect,ellipse,line,polyline", svg).forEach(function (el) {
      if (el.hasAttribute("stroke-dasharray")) return; // conserva el trazo punteado original
      el.setAttribute("pathLength", "1");
      el.classList.add("dr");
    });
  });
  $(".sol ul, .plan ul").forEach(function (ul) {
    $("li", ul).forEach(function (li, i) { li.style.setProperty("--i", i); });
  });
  $(".chips").forEach(function (c) {
    $(".chip", c).forEach(function (chip, i) { chip.style.setProperty("--i", i); });
  });

  /* ---------- Números que se resuelven al aparecer ---------- */
  function scramble(el) {
    var fin = el.textContent, n = fin.length, f = 0, total = 20;
    var iv = setInterval(function () {
      f++;
      var out = "";
      for (var i = 0; i < n; i++) {
        out += (/\d/.test(fin.charAt(i)) && f / total * n <= i + 0.5) ? Math.floor(Math.random() * 10) : fin.charAt(i);
      }
      el.textContent = out;
      if (f >= total) { clearInterval(iv); el.textContent = fin; }
    }, 45);
  }
  var nio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { nio.unobserve(e.target); scramble(e.target); } });
  }, { threshold: 0.8 });
  $(".sol .num, .step b").forEach(function (el) { nio.observe(el); });

  /* ---------- "Settled": cuando la tarjeta ya se reveló admite hover y tilt ---------- */
  var settleIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      settleIO.unobserve(e.target);
      var d = parseFloat(e.target.style.getPropertyValue("--d")) || 0;
      setTimeout(function () { e.target.classList.add("settled"); }, 1000 + d * 1000);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $(".card, .item, .step, .fig").forEach(function (el) { settleIO.observe(el); });

  /* ---------- Tilt 3D de tarjetas ---------- */
  if (fine) {
    $(".card, .item").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        if (!c.classList.contains("settled")) return;
        var r = c.getBoundingClientRect();
        var amp = r.width > 450 ? 2.2 : 6;
        c.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 2 * amp).toFixed(2) + "deg");
        c.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - 0.5) * 2 * amp).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", function () {
        c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg");
      });
    });

    /* Botones magnéticos */
    $(".btn-lg, .wa-float").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
        b.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () {
        b.style.setProperty("--bx", "0px"); b.style.setProperty("--by", "0px");
      });
    });
  }

  /* ---------- Hero: resplandor y paralaje con el cursor ---------- */
  var hero = document.getElementById("inicio"), heroArt = hero && hero.querySelector(".hero-art");
  var tx = 0, ty = 0, cx = 0, cy = 0;
  if (hero) {
    var glow = document.createElement("div"); glow.className = "glow"; glow.setAttribute("aria-hidden", "true");
    hero.insertBefore(glow, hero.firstChild);
    var cue = document.createElement("div"); cue.className = "scue"; cue.setAttribute("aria-hidden", "true");
    cue.appendChild(document.createElement("span")); hero.appendChild(cue);
    vis.observe(hero);
    if (fine) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--gx", (e.clientX - r.left) + "px");
        hero.style.setProperty("--gy", (e.clientY - r.top) + "px");
        hero.classList.add("hov");
        tx = (e.clientX / innerWidth - 0.5) * 2 * 16;
        ty = (e.clientY / innerHeight - 0.5) * 2 * 12;
      });
      hero.addEventListener("pointerleave", function () { hero.classList.remove("hov"); tx = ty = 0; });
    }
  }

  /* ---------- Hexágonos decorativos ligados al scroll ---------- */
  function hexPoints(r) {
    var dx = (0.8660254 * r).toFixed(2), dy = (r / 2).toFixed(2);
    return [[100, 100 - r], [100 + +dx, 100 - +dy], [100 + +dx, 100 + +dy], [100, 100 + r], [100 - +dx, 100 + +dy], [100 - +dx, 100 - +dy]];
  }
  var decos = [];
  [["metodologia", "d-r"], ["planes", "d-l"], ["contacto", "d-r"]].forEach(function (cfg) {
    var sec = document.getElementById(cfg[0]); if (!sec) return;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 200 200"); svg.setAttribute("class", "deco " + cfg[1]); svg.setAttribute("aria-hidden", "true");
    [96, 78, 60, 42, 24].forEach(function (r) {
      var p = document.createElementNS(NS, "polygon");
      p.setAttribute("points", hexPoints(r).map(function (q) { return q.join(","); }).join(" "));
      svg.appendChild(p);
    });
    hexPoints(96).forEach(function (q) {
      var l = document.createElementNS(NS, "line");
      l.setAttribute("x1", 100); l.setAttribute("y1", 100); l.setAttribute("x2", q[0]); l.setAttribute("y2", q[1]);
      svg.appendChild(l);
    });
    sec.insertBefore(svg, sec.firstChild);
    decos.push({ el: svg, sec: sec });
    vis.observe(sec);
  });

  /* ---------- Metodología: progreso por paso ---------- */
  var steps = $(".step");
  steps.forEach(function (s) { vis.observe(s); });

  /* ---------- Ilustraciones con paralaje ---------- */
  var figs = $(".fig").map(function (f) { vis.observe(f); return { fig: f, img: f.querySelector("img") }; });

  /* ---------- Capítulos parallax: cada capa con su propia velocidad ---------- */
  var chapters = $(".ch").map(function (ch) {
    vis.observe(ch);
    return {
      ch: ch,
      layers: $("[data-par]", ch).map(function (el) { return { el: el, f: parseFloat(el.getAttribute("data-par")), rot: parseFloat(el.getAttribute("data-rot")) || 0 }; }),
      copy: ch.querySelector("[data-fade]")
    };
  });

  /* ---------- CTA final: explosión de hexágonos ---------- */
  var fin = document.querySelector(".final");
  if (fin) {
    for (var k = 0; k < 14; k++) {
      var b = document.createElement("span"), a = (k / 14) * Math.PI * 2 + (k % 2) * 0.2, d = 170 + (k % 3) * 70;
      b.className = "bh"; b.setAttribute("aria-hidden", "true");
      b.style.cssText = "--k:" + k + ";--s:" + (16 + (k % 4) * 8) + "px;--dx:" + (Math.cos(a) * d * 1.5).toFixed(0) + "px;--dy:" +
        (Math.sin(a) * d * 0.8).toFixed(0) + "px;--c:" + (k % 3 === 0 ? "rgba(0,48,91,.28)" : "rgba(255,255,255,.6)");
      fin.insertBefore(b, fin.firstChild);
    }
    new IntersectionObserver(function (es, o) {
      es.forEach(function (e) { if (e.isIntersecting) { fin.classList.add("boom"); o.disconnect(); } });
    }, { threshold: 0.4 }).observe(fin);
  }

  /* ---------- Banda en movimiento ---------- */
  var marquees = [];
  function buildMarquees() {
    marquees.forEach(function (m) {
      while (m.track.children.length > 1) m.track.removeChild(m.track.lastChild);
      var w = m.set.offsetWidth;
      if (!w) return;
      m.w = w;
      for (var i = 0, n = Math.ceil(innerWidth / w) + 1; i < n; i++) m.track.appendChild(m.set.cloneNode(true));
    });
  }
  $(".mq").forEach(function (row, i) {
    var track = row.querySelector(".mq-track");
    marquees.push({ row: row, track: track, set: track.firstElementChild, w: 0, x: 0, dir: i % 2 ? -1 : 1, base: i % 2 ? 55 : 38 });
  });
  var band = document.querySelector(".band");
  if (band) vis.observe(band);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildMarquees);
  buildMarquees();

  /* ---------- Bucle único ---------- */
  var last = performance.now(), lastY = scrollY, vel = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = t; return; }
    var dt = Math.min(0.05, (t - last) / 1000); last = t;
    var y = scrollY;
    vel += ((y - lastY) / Math.max(dt, 0.001) - vel) * 0.12; lastY = y;
    if (Math.abs(vel) < 1) vel = 0;

    if (band && visible.has(band)) {
      var skew = clamp(vel * -0.006, -9, 9).toFixed(2);
      marquees.forEach(function (m) {
        if (!m.w) return;
        m.x += m.dir * (m.base + vel * 0.28) * dt; // bajar acelera, subir frena o invierte
        var p = ((m.x % m.w) + m.w) % m.w;
        m.track.style.transform = "translate3d(" + (-p).toFixed(1) + "px,0,0)";
        m.row.style.transform = "skewX(" + skew + "deg)";
      });
    }

    if (heroArt && visible.has(hero)) {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      heroArt.style.setProperty("--px", cx.toFixed(2) + "px");
      heroArt.style.setProperty("--py", cy.toFixed(2) + "px");
    }

    for (var i = 0; i < decos.length; i++) {
      var d = decos[i];
      if (!visible.has(d.sec)) continue;
      var r = d.sec.getBoundingClientRect(), mid = r.top + r.height / 2 - vh / 2;
      d.el.style.transform = "translate3d(0," + (-mid * 0.12).toFixed(1) + "px,0) rotate(" + (-mid * 0.07).toFixed(2) + "deg)";
    }

    for (var j = 0; j < steps.length; j++) {
      var s = steps[j];
      if (!visible.has(s)) continue;
      var p2 = clamp((vh * 0.88 - s.getBoundingClientRect().top) / (vh * 0.3), 0, 1);
      if (s._p !== p2) { s._p = p2; s.style.setProperty("--sp", p2.toFixed(3)); }
    }

    for (var c = 0; c < chapters.length; c++) {
      var cp = chapters[c];
      if (!visible.has(cp.ch)) continue;
      var cr = cp.ch.getBoundingClientRect(), span = vh + cr.height;
      var prog = clamp((vh - cr.top) / span, 0, 1), dd = prog - 0.5;
      for (var l = 0; l < cp.layers.length; l++) {
        var ly = cp.layers[l];
        ly.el.style.translate = "0 " + (dd * span * ly.f).toFixed(1) + "px";
        if (ly.rot) ly.el.style.rotate = (dd * ly.rot).toFixed(2) + "deg";
      }
      if (cp.copy) {
        var o = Math.min(clamp((prog - 0.14) / 0.16, 0, 1), clamp((0.9 - prog) / 0.16, 0, 1));
        cp.copy.style.opacity = o.toFixed(3);
        cp.copy.style.translate = "0 " + ((0.5 - prog) * 70).toFixed(1) + "px";
      }
    }

    for (var q = 0; q < figs.length; q++) {
      var f = figs[q];
      if (!f.img || !visible.has(f.fig)) continue;
      var fr = f.fig.getBoundingClientRect();
      var off = clamp(-(fr.top + fr.height / 2 - vh / 2) * 0.045, -24, 24);
      f.img.style.transform = "translate3d(0," + off.toFixed(1) + "px,0) scale(1.18)";
    }
  }
  requestAnimationFrame(frame);
})();
