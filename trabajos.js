/* GEIFEM · Trabajos realizados — carrusel 3D con Motion (motion.dev, el motor de Framer Motion).
   Se carga solo cuando la sección está cerca de la pantalla. Sin JS, o con "reducir movimiento",
   la sección queda como rejilla estática (ver trabajos.css). */
(function () {
  var root = document.getElementById("trabajos");
  if (!root) return;
  var stage = root.querySelector(".tr-stage");
  if (!stage) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  var started = false;
  var io = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting && !started) {
      started = true; io.disconnect();
      import("./vendor/motion.mjs").then(init).catch(function () { /* se queda la rejilla estática */ });
    }
  }, { rootMargin: "700px 0px" });
  io.observe(root);

  function init(M) {
    var animate = M.animate, motionValue = M.motionValue, stagger = M.stagger;
    var $ = function (s, c) { return (c || root).querySelector(s); };
    var cards = [].slice.call(root.querySelectorAll(".tr-card"));
    var N = cards.length;
    var imgs = cards.map(function (c) { return c.querySelector("img"); });
    var panel = $(".tr-panel"), big = $(".tr-bignum"), cur = $(".tr-cur"), cursor = $(".tr-cursor");
    var route = $(".tr-route"), baseP = $(".tr-r-base"), fillP = $(".tr-r-fill"), dot = $(".tr-dot");
    var autoBar = $(".tr-auto i"), playBtn = $(".tr-play");
    var mod = function (a, n) { return ((a % n) + n) % n; };
    var wrap = function (d) { return mod(d + N / 2, N) - N / 2; };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };

    root.classList.add("tr-live");
    cards.forEach(function (c, i) {
      c.setAttribute("role", "group");
      c.setAttribute("aria-roledescription", "diapositiva");
      c.setAttribute("aria-label", (i + 1) + " de " + N + ": " + c.dataset.sector);
      var tag = document.createElement("span");
      tag.className = "tr-tag"; tag.setAttribute("aria-hidden", "true"); tag.textContent = c.dataset.sector;
      c.querySelector(".tr-hex-in").appendChild(tag);
    });

    var pos = motionValue(0), spread = motionValue(0), routeP = motionValue(0);
    var active = -1, ctl = null, cw = 360, spacing = 280, len = 1, dragged = false;

    /* ---------- Medidas ---------- */
    function metrics() {
      var w = stage.clientWidth;
      cw = w < 640 ? Math.min(w * 0.64, 290) : w < 1000 ? 330 : 370;
      spacing = cw * (w < 640 ? 0.78 : 0.8);
      stage.style.setProperty("--cw", cw + "px");
    }

    /* ---------- Ruta con nodos ---------- */
    var nodes = cards.map(function (c, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "tr-node";
      b.setAttribute("aria-label", "Ir a " + c.dataset.sector);
      b.innerHTML = "<i></i><span>" + c.dataset.short + "</span>";
      b.addEventListener("click", function () { goTo(i); });
      route.appendChild(b);
      return b;
    });
    function layoutRoute() {
      len = baseP.getTotalLength();
      fillP.style.strokeDasharray = len;
      nodes.forEach(function (b, i) {
        var p = baseP.getPointAtLength(len * i / (N - 1));
        b.style.left = (p.x / 1000 * 100) + "%"; b.style.top = (p.y / 90 * 100) + "%";
      });
      drawRoute(routeP.get());
    }
    function drawRoute(v) {
      v = Math.max(0, Math.min(1, v));
      fillP.style.strokeDashoffset = len * (1 - v);
      var p = baseP.getPointAtLength(len * v);
      dot.style.left = (p.x / 1000 * 100) + "%"; dot.style.top = (p.y / 90 * 100) + "%";
    }
    routeP.on("change", drawRoute);

    /* ---------- Render del coverflow ---------- */
    function render() {
      var p = pos.get(), sp = spread.get();
      for (var i = 0; i < N; i++) {
        var d = wrap(i - p), ad = Math.abs(d), sgn = d < 0 ? -1 : 1;
        var x = sgn * (Math.min(ad, 1) * spacing + Math.max(0, Math.min(ad, 2.5) - 1) * spacing * 0.62) * sp;
        var sc = 1 - Math.min(ad, 2.5) * 0.15;
        var ry = Math.max(-55, Math.min(55, -d * 24)) * sp;
        var z = -Math.min(ad, 2.5) * 120;
        var op = ad > 2.4 ? 0 : (1 - Math.max(0, ad - 0.15) * 0.3) * (0.2 + 0.8 * sp);
        var el = cards[i];
        el.style.transform = "translate3d(calc(-50% + " + x.toFixed(1) + "px),0," + z.toFixed(0) + "px) rotateY(" + ry.toFixed(1) + "deg) scale(" + sc.toFixed(3) + ")";
        el.style.opacity = op.toFixed(3);
        el.style.zIndex = String(100 - Math.round(ad * 20));
        el.style.setProperty("--act", (1 - Math.min(ad, 1)).toFixed(3));
        el.style.pointerEvents = ad > 2.4 ? "none" : "auto";
        imgs[i].style.transform = "translate3d(" + (-d * 34).toFixed(1) + "px,0,0) scale(1.24)";
      }
      var idx = mod(Math.round(p), N);
      if (idx !== active) setActive(idx);
    }
    pos.on("change", render); spread.on("change", render);

    /* ---------- Sector activo: panel, contador, ruta ---------- */
    function setActive(idx) {
      var first = active === -1;
      active = idx;
      cards.forEach(function (c, i) { c.classList.toggle("is-active", i === idx); c.setAttribute("aria-hidden", i === idx ? "false" : "true"); });
      nodes.forEach(function (b, i) { b.classList.toggle("on", i === idx); if (i === idx) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
      var src = cards[idx].querySelector(".tr-body");
      panel.innerHTML = src.innerHTML;
      var parts = [].slice.call(panel.querySelectorAll(".tr-sector,h3,.tr-sum,.tr-works li"));
      if (!first) {
        parts.forEach(function (p) { p.style.opacity = "0"; });
        animate(parts, { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] }, { delay: stagger(0.055), duration: 0.65, ease: [0.22, 0.8, 0.24, 1] });
        [cur, big].forEach(function (el, k) {
          el.textContent = pad(idx + 1);
          animate(el, { opacity: [0, 1], transform: [k ? "translateY(14%)" : "translateY(70%)", "translateY(0%)"] }, { duration: 0.55, ease: [0.22, 0.8, 0.24, 1] });
        });
        animate(routeP, idx / (N - 1), { type: "spring", stiffness: 90, damping: 17 });
        startAuto();
      } else {
        cur.textContent = big.textContent = pad(idx + 1);
        routeP.set(idx / (N - 1));
      }
    }

    /* ---------- Navegación ---------- */
    function animateTo(v) {
      if (ctl) ctl.stop();
      ctl = animate(pos, v, { type: "spring", stiffness: 120, damping: 19, mass: 0.9 });
    }
    function goTo(i) { animateTo(pos.get() + wrap(i - pos.get())); }
    function next() { animateTo(Math.round(pos.get()) + 1); }
    function prev() { animateTo(Math.round(pos.get()) - 1); }
    $(".tr-next").addEventListener("click", next);
    $(".tr-prev").addEventListener("click", prev);
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    });
    var wheelAt = 0;
    stage.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.2 || Math.abs(e.deltaX) < 8) return;
      e.preventDefault();
      var t = performance.now();
      if (t - wheelAt > 450) { wheelAt = t; e.deltaX > 0 ? next() : prev(); }
    }, { passive: false });

    /* ---------- Arrastre con inercia ---------- */
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest("button,a")) return;
      drag = { x: e.clientX, p: pos.get(), lx: e.clientX, lt: performance.now(), v: 0, moved: 0 };
      dragged = false;
      if (ctl) ctl.stop();
      pauseAuto(true);
    });
    addEventListener("pointermove", function (e) {
      if (cursor && stage.contains(e.target) && matchMedia("(hover:hover) and (pointer:fine)").matches) moveCursor(e);
      if (!drag) return;
      var dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved > 6) { dragged = true; stage.classList.add("drag"); }
      var t = performance.now(), dt = Math.max(1, t - drag.lt);
      drag.v = 0.8 * drag.v + 0.2 * ((e.clientX - drag.lx) / dt);
      drag.lx = e.clientX; drag.lt = t;
      pos.set(drag.p - dx / spacing);
    });
    function endDrag() {
      if (!drag) return;
      var v = drag.v; drag = null; stage.classList.remove("drag");
      var target = Math.round(pos.get() - v * 420 / spacing * 1.6);
      animateTo(target);
      pauseAuto(false);
      setTimeout(function () { dragged = false; }, 0);
    }
    addEventListener("pointerup", endDrag);
    addEventListener("pointercancel", endDrag);
    cards.forEach(function (c, i) {
      c.addEventListener("click", function () { if (!dragged && Math.abs(wrap(i - pos.get())) > 0.4) goTo(i); });
    });

    /* ---------- Cursor "Arrastrar" con resorte ---------- */
    var cx = motionValue(0), cy = motionValue(0);
    function paintCursor() { cursor.style.transform = "translate3d(" + (cx.get() + 18) + "px," + (cy.get() + 18) + "px,0)"; }
    cx.on("change", paintCursor); cy.on("change", paintCursor);
    function moveCursor(e) {
      var r = stage.getBoundingClientRect();
      var sp = { type: "spring", stiffness: 260, damping: 26 };
      cursor.classList.add("on");
      animate(cx, e.clientX - r.left, sp); animate(cy, e.clientY - r.top, sp);
    }
    stage.addEventListener("pointerleave", function () { cursor.classList.remove("on"); });

    /* ---------- Reproducción automática (con botón de pausa) ---------- */
    var playing = true, autoCtl = null, token = 0, held = false, visible = true;
    function stopAuto() { token++; if (autoCtl) { try { autoCtl.cancel(); } catch (e) {} autoCtl = null; } }
    function startAuto() {
      stopAuto();
      autoBar.style.transform = "scaleX(0)";
      if (!playing) return;
      var my = token;
      autoCtl = animate(autoBar, { transform: ["scaleX(0)", "scaleX(1)"] }, { duration: 7, ease: "linear" });
      if (held || !visible) autoCtl.pause();
      autoCtl.then(function () { if (my === token && playing) next(); }, function () {});
    }
    function pauseAuto(on) {
      held = on;
      if (!autoCtl) return;
      try { (held || !visible) ? autoCtl.pause() : autoCtl.play(); } catch (e) {}
    }
    stage.addEventListener("pointerenter", function () { pauseAuto(true); });
    stage.addEventListener("pointerleave", function () { if (!drag) pauseAuto(false); });
    stage.addEventListener("focusin", function () { pauseAuto(true); });
    stage.addEventListener("focusout", function () { pauseAuto(false); });
    playBtn.addEventListener("click", function () {
      playing = !playing;
      playBtn.setAttribute("aria-pressed", playing ? "false" : "true");
      playBtn.setAttribute("aria-label", playing ? "Pausar la reproducción automática" : "Reanudar la reproducción automática");
      playing ? startAuto() : (stopAuto(), autoBar.style.transform = "scaleX(0)");
    });
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !spread.get()) animate(spread, 1, { type: "spring", stiffness: 55, damping: 15, mass: 1.1 });   // apertura en abanico
      pauseAuto(held);
    }, { threshold: 0.35 }).observe(stage);
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; pauseAuto(held); });

    /* ---------- Arranque ---------- */
    metrics(); layoutRoute(); render();
    addEventListener("resize", function () { metrics(); layoutRoute(); render(); });
  }
})();
