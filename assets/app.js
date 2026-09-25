/* ============================================================
   AURELIA — Shared behaviour
   Cosmic 3D background · theme · nav · reveal · pricing · year
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var PREFERS_REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var FINE_POINTER = !!(window.matchMedia && window.matchMedia("(pointer: fine)").matches);
  var ENHANCE = FINE_POINTER && !PREFERS_REDUCE; // gate for cursor/tilt/magnetic/nav-indicator

  /* ---- Theme (persisted) ---- */
  var THEME_KEY = "aurelia-theme";
  function applyTheme(mode) {
    if (mode === "light") root.classList.add("light");
    else root.classList.remove("light");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "light" ? "#eef0fb" : "#05060d");
  }
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (!saved) {
    saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  applyTheme(saved);

  function toggleTheme() {
    var next = root.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  }

  /* ============================================================
     Cosmos — animated starfield + 3D glowing globe (canvas 2D)
     ============================================================ */
  function initCosmos(host) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas");
    canvas.className = "cosmos-canvas";
    host.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;
    var stars = [];
    var pts = [];
    var rings = [];
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    // aurora colours — read from CSS tokens so one variable rebrands the globe too
    function parseRGB(str, fallback) {
      if (!str) return fallback;
      str = str.trim();
      if (str.charAt(0) === "#") {
        var h = str.slice(1);
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      }
      var m = str.match(/[\d.]+/g);
      return (m && m.length >= 3) ? [+m[0], +m[1], +m[2]] : fallback;
    }
    var cs = getComputedStyle(document.documentElement);
    var VIOLET = parseRGB(cs.getPropertyValue("--violet"), [124, 92, 255]);
    var CYAN = parseRGB(cs.getPropertyValue("--cyan"), [53, 230, 255]);
    function lerp(a, b, t) { return a + (b - a) * t; }
    function mix(c1, c2, t) {
      return "rgb(" + Math.round(lerp(c1[0], c2[0], t)) + "," +
        Math.round(lerp(c1[1], c2[1], t)) + "," + Math.round(lerp(c1[2], c2[2], t)) + ")";
    }

    // fibonacci sphere
    var N = 620;
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var rad = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = i * 2.399963229728653; // golden angle
      pts.push({ x: Math.cos(theta) * rad, y: y, z: Math.sin(theta) * rad });
    }

    // wireframe mesh — connect each node to its nearest neighbours (precomputed once)
    var edges = [];
    (function () {
      var seen = {}, K = 3, WIN = 40;
      for (var i = 0; i < N; i++) {
        var cand = [], lo = Math.max(0, i - WIN), hi = Math.min(N, i + WIN);
        for (var j = lo; j < hi; j++) {
          if (j === i) continue;
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
          cand.push([dx * dx + dy * dy + dz * dz, j]);
        }
        cand.sort(function (a, b) { return a[0] - b[0]; });
        for (var k = 0; k < K && k < cand.length; k++) {
          var a = Math.min(i, cand[k][1]), b = Math.max(i, cand[k][1]), key = a + "_" + b;
          if (!seen[key]) { seen[key] = 1; edges.push([a, b]); }
        }
      }
    })();

    // orbit rings (tilt, radius scale, speed, phase)
    rings = [
      { rx: 1.55, ry: 0.42, tilt: -0.38, speed: 0.55, phase: 0 },
      { rx: 1.9, ry: 0.30, tilt: 0.5, speed: -0.35, phase: 2.0 },
      { rx: 2.25, ry: 0.55, tilt: 0.12, speed: 0.22, phase: 4.1 }
    ];

    function buildStars() {
      stars = [];
      var count = Math.min(Math.floor(W * H / 5200), 320);
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          z: Math.random(), r: Math.random() * 1.3 + 0.2,
          tw: Math.random() * Math.PI * 2, ts: Math.random() * 1.5 + 0.4
        });
      }
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth; H = host.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W * 0.5;
      cy = H * (host.hasAttribute("data-cosmos-center") ? 0.5 : 0.62);
      R = Math.min(W * 0.46, H * 0.72) * (host.hasAttribute("data-cosmos-sm") ? 0.68 : 1);
      buildStars();
      if (reduce) draw(0);
    }

    var CAM = 2.7, tilt = -0.32;
    var comets = [], lastT = 0;
    function spawnComet() {
      var ang = 0.45 + Math.random() * 0.35;
      var speed = Math.min(W, H) * (0.9 + Math.random() * 0.5);
      comets.push({
        x: Math.random() * W * 0.6 - W * 0.1, y: Math.random() * H * 0.3,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        age: 0, life: 0.6 + Math.random() * 0.3
      });
    }
    function draw(t) {
      if (!W || !H) return;
      var dt = lastT ? Math.max(0, Math.min(t - lastT, 0.1)) : 0;
      lastT = t;
      ctx.clearRect(0, 0, W, H);

      // parallax easing
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      var px = pointer.x, py = pointer.y;

      // starfield
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        var sx = st.x + px * (10 + st.z * 26);
        var sy = st.y + py * (10 + st.z * 26);
        var a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * st.ts + st.tw));
        a *= 0.4 + st.z * 0.6;
        ctx.beginPath();
        ctx.fillStyle = "rgba(200,214,255," + a.toFixed(3) + ")";
        ctx.arc(sx, sy, st.r * (0.6 + st.z), 0, 6.2832);
        ctx.fill();
      }

      // aurora halo behind globe
      var halo = ctx.createRadialGradient(cx + px * 30, cy + py * 20, R * 0.1, cx, cy, R * (1.7 + 0.06 * Math.sin(t * 0.6)));
      halo.addColorStop(0, "rgba(60,110,255,0.30)");
      halo.addColorStop(0.5, "rgba(53,230,255,0.11)");
      halo.addColorStop(1, "rgba(5,6,13,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      var rot = t * 0.18 + px * 0.55;
      var ocx = cx + px * 38, ocy = cy + py * 26;

      // project every node (kept in index order so mesh edges can reference them)
      var cosR = Math.cos(rot), sinR = Math.sin(rot);
      var dtilt = tilt + py * 0.22;
      var cosT = Math.cos(dtilt), sinT = Math.sin(dtilt);
      var proj = [];
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var x1 = p.x * cosR + p.z * sinR;
        var z1 = -p.x * sinR + p.z * cosR;
        var y2 = p.y * cosT - z1 * sinT;
        var z2 = p.y * sinT + z1 * cosT;
        var persp = CAM / (CAM - z2);
        proj.push({
          sx: ocx + x1 * R * persp,
          sy: ocy + y2 * R * persp,
          d: (z2 + 1) / 2
        });
      }

      // wireframe edges (drawn first, behind the nodes) — front edges brighter
      ctx.lineWidth = 0.72;
      for (var e = 0; e < edges.length; e++) {
        var ea = proj[edges[e][0]], eb = proj[edges[e][1]];
        var ed = (ea.d + eb.d) * 0.5;
        ctx.beginPath();
        ctx.strokeStyle = mix(VIOLET, CYAN, ed).replace("rgb", "rgba").replace(")", "," + (0.05 + ed * ed * 0.38).toFixed(3) + ")");
        ctx.moveTo(ea.sx, ea.sy);
        ctx.lineTo(eb.sx, eb.sy);
        ctx.stroke();
      }

      // nodes, painted back-to-front
      var order = proj.slice().sort(function (a, b) { return a.d - b.d; });
      for (var j = 0; j < order.length; j++) {
        var pr = order[j];
        var alpha = 0.18 + pr.d * 0.82;
        var size = 0.7 + pr.d * 1.9;
        ctx.beginPath();
        ctx.fillStyle = mix(VIOLET, CYAN, pr.d).replace("rgb", "rgba").replace(")", "," + alpha.toFixed(3) + ")");
        ctx.arc(pr.sx, pr.sy, size, 0, 6.2832);
        ctx.fill();
      }

      // orbit rings + satellites
      for (var r = 0; r < rings.length; r++) {
        var rg = rings[r];
        ctx.save();
        ctx.translate(ocx, ocy);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(120,150,255,0.14)";
        ctx.lineWidth = 1;
        ctx.ellipse(0, 0, R * rg.rx, R * rg.ry, rg.tilt, 0, 6.2832);
        ctx.stroke();
        // satellite dot
        var ang = t * rg.speed + rg.phase;
        var ex = Math.cos(ang) * R * rg.rx;
        var ey = Math.sin(ang) * R * rg.ry;
        var ca = Math.cos(rg.tilt), sa = Math.sin(rg.tilt);
        var dx = ex * ca - ey * sa, dy = ex * sa + ey * ca;
        ctx.beginPath();
        ctx.fillStyle = "rgba(53,230,255,0.95)";
        ctx.shadowBlur = 12; ctx.shadowColor = "rgba(53,230,255,0.9)";
        ctx.arc(dx, dy, 2.6, 0, 6.2832);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // shooting-star comets — rare, brief streaks across the scene
      if (!reduce && dt && Math.random() < dt * 0.16) spawnComet();
      for (var ci = comets.length - 1; ci >= 0; ci--) {
        var cm = comets[ci];
        cm.x += cm.vx * dt; cm.y += cm.vy * dt; cm.age += dt;
        if (cm.age > cm.life || cm.x > W + 60 || cm.y > H + 60) { comets.splice(ci, 1); continue; }
        var cp = cm.age / cm.life;
        var calpha = Math.sin(Math.min(cp * 3, 1) * Math.PI);
        var cmag = Math.sqrt(cm.vx * cm.vx + cm.vy * cm.vy) || 1;
        var ctx2 = cm.x - (cm.vx / cmag) * 74, cty = cm.y - (cm.vy / cmag) * 74;
        var cgrad = ctx.createLinearGradient(cm.x, cm.y, ctx2, cty);
        cgrad.addColorStop(0, "rgba(255,255,255," + (0.9 * calpha).toFixed(3) + ")");
        cgrad.addColorStop(0.45, "rgba(140,190,255," + (0.45 * calpha).toFixed(3) + ")");
        cgrad.addColorStop(1, "rgba(53,230,255,0)");
        ctx.beginPath();
        ctx.strokeStyle = cgrad; ctx.lineWidth = 1.6; ctx.lineCap = "round";
        ctx.moveTo(cm.x, cm.y); ctx.lineTo(ctx2, cty); ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255," + calpha.toFixed(3) + ")";
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(170,205,255,0.9)";
        ctx.arc(cm.x, cm.y, 1.5, 0, 6.2832);
        ctx.fill(); ctx.shadowBlur = 0;
      }
    }

    var raf = null, running = false, start = 0;
    function loop(now) {
      if (!start) start = now;
      var t = (now - start) / 1000;
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    function play() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else play();
    });
    host.addEventListener("pointermove", function (e) {
      var rect = host.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    resize();
    if (reduce) { draw(0); } else { play(); }
  }

  /* ---- Wire up on ready ---- */
  ready(function () {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", toggleTheme);
    });

    /* Cosmos backgrounds */
    document.querySelectorAll("[data-cosmos]").forEach(initCosmos);

    /* Sticky nav shadow */
    var nav = document.querySelector(".nav");
    if (nav) {
      var onScroll = function () {
        if (window.scrollY > 12) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* Mobile menu */
    var burger = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector(".mobile-menu");
    if (burger && menu) {
      burger.addEventListener("click", function () {
        var open = menu.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* Scroll reveal */
    var reveals = document.querySelectorAll("[data-reveal]");
    if (reveals.length) {
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        reveals.forEach(function (el) { io.observe(el); });
      } else {
        reveals.forEach(function (el) { el.classList.add("in"); });
      }
    }

    /* Pricing monthly / annual toggle */
    var pswitch = document.querySelector("[data-price-switch]");
    if (pswitch) {
      var labMonthly = document.querySelector("[data-price-monthly]");
      var labAnnual = document.querySelector("[data-price-annual]");
      var setMode = function (annual) {
        pswitch.classList.toggle("annual", annual);
        pswitch.setAttribute("aria-checked", annual ? "true" : "false");
        if (labMonthly) labMonthly.classList.toggle("on", !annual);
        if (labAnnual) labAnnual.classList.toggle("on", annual);
        document.querySelectorAll("[data-m]").forEach(function (el) {
          el.textContent = annual ? el.getAttribute("data-a") : el.getAttribute("data-m");
        });
        document.querySelectorAll("[data-per]").forEach(function (el) {
          el.textContent = annual ? "/mo · billed yearly" : "/month";
        });
      };
      pswitch.addEventListener("click", function () {
        setMode(!pswitch.classList.contains("annual"));
      });
      setMode(false);
    }

    /* Year stamp */
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    /* Scroll progress bar */
    (function () {
      var bar = document.createElement("div");
      bar.className = "scroll-progress";
      var fill = document.createElement("i");
      bar.appendChild(fill);
      document.body.appendChild(bar);
      var ticking = false;
      function update() {
        var el = document.documentElement;
        var max = el.scrollHeight - el.clientHeight;
        var p = max > 0 ? (window.pageYOffset || el.scrollTop) / max : 0;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
        ticking = false;
      }
      function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    })();

    /* Count-up stat numbers (reveal-triggered) */
    (function () {
      var nums = document.querySelectorAll(".stat .num em");
      if (!nums.length) return;
      var reduceMo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMo || !("IntersectionObserver" in window)) return; // leave final values in place

      function format(n, decimals, comma) {
        var s = n.toFixed(decimals);
        if (comma) {
          var parts = s.split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          s = parts.join(".");
        }
        return s;
      }
      function animate(el, target, decimals, comma) {
        var dur = 1150, t0 = 0;
        function ease(x) { return 1 - Math.pow(1 - x, 3); } // easeOutCubic
        function step(now) {
          if (!t0) t0 = now;
          var p = Math.min((now - t0) / dur, 1);
          el.textContent = format(target * ease(p), decimals, comma);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = format(target, decimals, comma);
        }
        el.textContent = format(0, decimals, comma);
        requestAnimationFrame(step);
      }

      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          io2.unobserve(el);
          var raw = (el.getAttribute("data-count") || el.textContent || "").trim();
          var comma = raw.indexOf(",") > -1;
          var clean = raw.replace(/,/g, "");
          var val = parseFloat(clean);
          if (isNaN(val) || val === 0) return;
          var dot = clean.indexOf(".");
          var decimals = dot > -1 ? clean.length - dot - 1 : 0;
          animate(el, val, decimals, comma);
        });
      }, { threshold: 0.6 });
      nums.forEach(function (el) {
        el.setAttribute("data-count", (el.textContent || "").trim());
        io2.observe(el);
      });
    })();

    /* Custom magnetic cursor (fine pointer + motion allowed only) */
    if (ENHANCE) (function () {
      var dot = document.createElement("div"); dot.className = "cursor-dot";
      var ring = document.createElement("div"); ring.className = "cursor-ring";
      document.body.appendChild(dot); document.body.appendChild(ring);
      root.classList.add("has-cursor");
      var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, live = false;
      window.addEventListener("pointermove", function (e) {
        mx = e.clientX; my = e.clientY;
        if (!live) { live = true; dot.style.opacity = "1"; ring.style.opacity = "0.8"; }
        dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      }, { passive: true });
      document.addEventListener("mouseleave", function () { dot.style.opacity = "0"; ring.style.opacity = "0"; });
      (function loop() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
        requestAnimationFrame(loop);
      })();
      var HOVER_SEL = "a, button, .btn, .icon-btn, summary, [data-menu-toggle], [data-theme-toggle]";
      document.addEventListener("pointerover", function (e) {
        if (e.target.closest && e.target.closest(HOVER_SEL)) ring.classList.add("hover");
      });
      document.addEventListener("pointerout", function (e) {
        if (e.target.closest && e.target.closest(HOVER_SEL)) ring.classList.remove("hover");
      });
    })();

    /* Magnetic pull on buttons */
    if (ENHANCE) document.querySelectorAll(".btn, .icon-btn").forEach(function (el) {
      var rect = null;
      el.addEventListener("pointerenter", function () { rect = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var mx = e.clientX - (rect.left + rect.width / 2);
        var my = e.clientY - (rect.top + rect.height / 2);
        var tx = Math.max(-14, Math.min(14, mx * 0.32));
        var ty = Math.max(-10, Math.min(10, my * 0.32)) - 2;
        el.style.transition = "";
        el.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        rect = null;
        el.style.transition = "transform 0.5s cubic-bezier(.2,1,.3,1)";
        el.style.transform = "translate(0,0)";
      });
    });

    /* 3D tilt + spotlight glare on cards, pricing, quotes, posts */
    if (ENHANCE) document.querySelectorAll(".card, .price, .quote, .post").forEach(function (el) {
      var rect = null;
      el.addEventListener("pointerenter", function () { rect = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rxDeg = (0.5 - py) * 7;
        var ryDeg = (px - 0.5) * 9;
        el.style.transition = "";
        el.style.transform = "perspective(900px) rotateX(" + rxDeg.toFixed(2) + "deg) rotateY(" + ryDeg.toFixed(2) + "deg) translateY(-6px)";
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () {
        rect = null;
        el.style.transition = "transform 0.5s var(--ease)";
        el.style.transform = "";
      });
    });

    /* Click-burst particles on primary CTAs */
    (function () {
      if (PREFERS_REDUCE) return;
      function burst(x, y) {
        var host = document.createElement("div");
        host.className = "click-burst";
        host.style.left = x + "px"; host.style.top = y + "px";
        var n = 10;
        for (var i = 0; i < n; i++) {
          var a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
          var dist = 26 + Math.random() * 30;
          var b = document.createElement("i");
          b.style.setProperty("--bx", (Math.cos(a) * dist).toFixed(1) + "px");
          b.style.setProperty("--by", (Math.sin(a) * dist).toFixed(1) + "px");
          b.style.background = i % 2 ? "var(--violet)" : "var(--cyan)";
          host.appendChild(b);
        }
        document.body.appendChild(host);
        setTimeout(function () { host.remove(); }, 700);
      }
      document.querySelectorAll(".btn-gold").forEach(function (b) {
        b.addEventListener("click", function (e) { burst(e.clientX, e.clientY); });
      });
    })();

    /* Magnetic sliding nav indicator */
    if (ENHANCE) document.querySelectorAll(".nav-links").forEach(function (nav) {
      var ind = document.createElement("span");
      ind.className = "nav-indicator";
      nav.appendChild(ind);
      var links = nav.querySelectorAll("a");
      links.forEach(function (a) {
        a.addEventListener("mouseenter", function () {
          var r1 = nav.getBoundingClientRect(), r2 = a.getBoundingClientRect();
          ind.style.left = (r2.left - r1.left) + "px";
          ind.style.width = r2.width + "px";
          ind.style.opacity = "1";
        });
      });
      nav.addEventListener("mouseleave", function () { ind.style.opacity = "0"; });
    });

    /* Cipher-reveal effect on hero headlines */
    (function () {
      var heads = document.querySelectorAll(".hero h1, .page-hero h1");
      if (!heads.length || PREFERS_REDUCE) return;
      var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$%&*+=";
      function collectTextNodes(el, out) {
        for (var i = 0; i < el.childNodes.length; i++) {
          var n = el.childNodes[i];
          if (n.nodeType === 3) { if (n.nodeValue.replace(/\s/g, "") !== "") out.push(n); }
          else if (n.nodeType === 1) collectTextNodes(n, out);
        }
        return out;
      }
      function scramble(el) {
        var chunks = collectTextNodes(el, []).map(function (n) {
          return { node: n, chars: n.nodeValue.split("") };
        });
        var total = chunks.reduce(function (a, c) { return a + c.chars.length; }, 0);
        if (!total) return;
        var dur = 560 + total * 16, t0 = 0;
        function frame(now) {
          if (!t0) t0 = now;
          var p = Math.min((now - t0) / dur, 1);
          var revealed = Math.floor(p * total), count = 0;
          chunks.forEach(function (c) {
            var out = "";
            for (var i = 0; i < c.chars.length; i++) {
              var ch = c.chars[i];
              out += /[a-zA-Z0-9]/.test(ch) ? (count < revealed ? ch : CHARS[(Math.random() * CHARS.length) | 0]) : ch;
              count++;
            }
            c.node.nodeValue = out;
          });
          if (p < 1) requestAnimationFrame(frame);
          else chunks.forEach(function (c) { c.node.nodeValue = c.chars.join(""); });
        }
        requestAnimationFrame(frame);
      }
      if ("IntersectionObserver" in window) {
        var io4 = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { io4.unobserve(en.target); scramble(en.target); }
          });
        }, { threshold: 0.4 });
        heads.forEach(function (h) { io4.observe(h); });
      } else {
        heads.forEach(scramble);
      }
    })();

    /* Infinite logo marquee */
    (function () {
      if (PREFERS_REDUCE) return;
      document.querySelectorAll(".logo-row").forEach(function (row) {
        var items = Array.prototype.slice.call(row.children);
        if (items.length < 3) return;
        row.classList.add("marquee");
        var track = document.createElement("div");
        track.className = "logo-track";
        items.forEach(function (el) { track.appendChild(el); });
        var clone = track.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        row.appendChild(track);
        row.appendChild(clone);
      });
    })();
  });

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
})();
