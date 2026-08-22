/* ==========================================================================
   ATOMZ — interactions
   Zero dependencies. Everything is progressive enhancement:
   the page is complete and readable with this file removed.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Theme (light default, dark flip, persisted) -------------------- */
  var THEME_KEY = "atomz-theme";
  function applyTheme(mode) {
    if (mode === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }
  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") applyTheme("dark");
  } catch (e) {}

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      toggle.setAttribute("aria-pressed", String(next === "dark"));
    });
  }

  /* ---- 2. Sticky header shadow on scroll -------------------------------- */
  var header = document.querySelector(".site-header");
  function headerState() {
    if (!header) return;
    header.setAttribute("data-scrolled", String(window.scrollY > 8));
  }
  headerState();

  /* ---- Opt into reveal animations only when motion is allowed ----------- */
  if (!reduceMotion) {
    root.classList.add("js-anim");

    /* ---- 3. Reveal on enter -------------------------------------------- */
    var revealEls = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }

    /* ---- 4. Section-number highlight for steps ------------------------- */
    var steps = document.querySelectorAll(".step");
    if ("IntersectionObserver" in window && steps.length) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          en.target.classList.toggle("is-visible", en.isIntersecting);
        });
      }, { threshold: 0.5 });
      steps.forEach(function (el) { sio.observe(el); });
    }
  } else {
    document.querySelectorAll(".step").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- 5. Hero compounding staircase ------------------------------------ */
  /* Abstract, accelerating fill — no numbers, no claimed results.          */
  var stair = document.querySelector(".stair");
  if (stair) {
    var bars = stair.querySelectorAll(".stair__bar");
    var n = bars.length;
    bars.forEach(function (bar, i) {
      var t = (i + 1) / n;
      var h = Math.round((0.14 + Math.pow(t, 1.9) * 0.86) * 100); /* accelerating heights */
      bar.style.setProperty("--h", h + "%");
      bar.style.setProperty("--d", (i * 0.09) + "s");
    });
    function fillStair() {
      bars.forEach(function (bar) { bar.style.setProperty("--fill", "1"); });
    }
    if (reduceMotion) {
      fillStair();
    } else if ("IntersectionObserver" in window) {
      var hio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { fillStair(); hio.disconnect(); }
      }, { threshold: 0.3 });
      hio.observe(stair);
    } else {
      fillStair();
    }
  }

  /* ---- 6. The Compound rail (scroll-linked accumulation) ---------------- */
  /* Discrete units fill bottom-to-top; upper units are visually larger,    */
  /* so the accumulated mass accelerates — "compound consistently."         */
  var railMobile = document.querySelector(".compound--top");
  var railDesk = document.querySelector(".compound--rail");

  function buildUnits(container, count, sizing) {
    if (!container) return [];
    var frag = document.createDocumentFragment();
    var made = [];
    for (var i = 0; i < count; i++) {
      var u = document.createElement("span");
      u.className = "unit";
      if (sizing) {
        /* taller toward the TOP (low index = frontier) so the filled mass,
           rising from the base, accelerates as it climbs — compounding */
        var t = (count - i) / count;
        u.style.height = (5 + Math.pow(t, 1.8) * 30).toFixed(1) + "px";
      }
      frag.appendChild(u);
      made.push(u);
    }
    container.appendChild(frag);
    return made;
  }

  var TOP_N = 28, RAIL_N = 18;
  var topUnits = buildUnits(railMobile, TOP_N, false);
  var railUnits = railDesk ? buildUnits(railDesk, RAIL_N, true) : [];
  /* desk rail is column-reverse-ish: build filled from the bottom (last child) */
  var lastTopK = -1, lastRailK = -1;

  function progress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  function paint() {
    var p = progress();

    var kTop = Math.round(p * TOP_N);
    if (kTop !== lastTopK && topUnits.length) {
      for (var i = 0; i < TOP_N; i++) topUnits[i].classList.toggle("on", i < kTop);
      lastTopK = kTop;
    }

    var kRail = Math.round(p * RAIL_N);
    if (kRail !== lastRailK && railUnits.length) {
      /* rail is justify-content:flex-end (grows upward from the base);
         fill the LAST kRail units so accumulation rises from the bottom */
      for (var j = 0; j < RAIL_N; j++) {
        var on = j >= RAIL_N - kRail;
        railUnits[j].classList.toggle("on", on);
        railUnits[j].classList.toggle("tip", on && j === RAIL_N - kRail);
      }
      lastRailK = kRail;
    }
  }

  var ticking = false;
  function onScroll() {
    headerState();
    if (!ticking) {
      window.requestAnimationFrame(function () { paint(); ticking = false; });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { lastTopK = lastRailK = -1; paint(); }, { passive: true });
  paint();

  /* ---- 7. Current year in footer ---------------------------------------- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
