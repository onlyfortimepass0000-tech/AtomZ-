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

  /* ---- 8. Horizon Client Hub & Chart.js Integration --------------------- */
  var viewsChartInst = null;
  var interactionChartInst = null;
  var erChartInst = null;

  function initHorizonCharts() {
    if (typeof Chart === "undefined") return;

    if (typeof ChartDataLabels !== "undefined") {
      try { Chart.register(ChartDataLabels); } catch (e) {}
    }

    Chart.defaults.color = '#888';
    Chart.defaults.font.family = "'Open Sans', sans-serif";

    var createGradient = function(ctx, color1, color2, isHorizontal) {
      var gradient = isHorizontal 
        ? ctx.createLinearGradient(0, 0, 800, 0)
        : ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      return gradient;
    };

    /* Chart 1: Views */
    var canvasViews = document.getElementById('viewsChart');
    if (canvasViews) {
      if (viewsChartInst) viewsChartInst.destroy();
      var ctxViews = canvasViews.getContext('2d');
      var gradOrange = createGradient(ctxViews, '#FF4500', '#FFA500', true);
      
      viewsChartInst = new Chart(ctxViews, {
        type: 'bar',
        data: {
          labels: ['₹10K Challenge', 'Hanging Crunches', 'Ayurveda vs Steroids', 'AI Avatar', 'PM Fitness'],
          datasets: [{
            label: 'Total Views',
            data: [1308878, 191861, 148249, 47628, 41170],
            backgroundColor: [gradOrange, '#333', '#333', '#333', '#333'],
            borderRadius: 6,
            borderWidth: 0
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 60 } },
          animation: { duration: 1800, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111', titleColor: '#FFA500', bodyColor: '#fff',
              callbacks: { label: function(ctx) { return ctx.raw.toLocaleString() + ' Views 👁️'; } }
            },
            datalabels: {
              color: function(ctx) { return ctx.dataIndex === 0 ? '#FFA500' : '#888'; },
              anchor: 'end', align: 'right', offset: 8,
              font: { weight: 'bold', size: 12 },
              formatter: function(val) { return val > 1000000 ? (val/1000000).toFixed(1) + 'M' : (val/1000).toFixed(0) + 'K'; }
            }
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5,5] } },
            y: { grid: { display: false }, ticks: { color: '#ddd', font: { weight: '600' } } }
          }
        }
      });
    }

    /* Chart 2: Likes vs Comments */
    var canvasInteraction = document.getElementById('interactionChart');
    if (canvasInteraction) {
      if (interactionChartInst) interactionChartInst.destroy();
      var ctxInteraction = canvasInteraction.getContext('2d');
      
      interactionChartInst = new Chart(ctxInteraction, {
        type: 'bar',
        data: {
          labels: ['₹10K Chal.', 'Ayurveda', 'AI Avatar', 'Crunches', 'PM Fit.'],
          datasets: [
            {
              label: 'Likes',
              data: [30063, 2365, 778, 1808, 635],
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: '#555',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Comments',
              data: [1343, 1031, 1422, 22, 2],
              backgroundColor: createGradient(ctxInteraction, '#FF4500', '#FF8C00'),
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { delay: 300, duration: 1400 },
          scales: {
            y: {
              type: 'logarithmic',
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#666', maxTicksLimit: 5 }
            },
            x: { grid: { display: false }, ticks: { color: '#aaa', font: { size: 10 } } }
          },
          plugins: {
            legend: { labels: { color: '#ccc' } },
            tooltip: { backgroundColor: '#111' },
            datalabels: { display: false }
          }
        }
      });
    }

    /* Chart 3: Engagement Rate */
    var canvasER = document.getElementById('erChart');
    if (canvasER) {
      if (erChartInst) erChartInst.destroy();
      var ctxER = canvasER.getContext('2d');
      var goldGrad = createGradient(ctxER, '#FFD700', '#FF8C00', true);

      erChartInst = new Chart(ctxER, {
        type: 'bar',
        data: {
          labels: ['AI Avatar', '₹10K Chal.', 'Ayurveda', 'PM Fit.', 'Crunches'],
          datasets: [{
            label: 'Engagement Rate (%)',
            data: [4.62, 2.40, 2.29, 1.55, 0.95],
            backgroundColor: [goldGrad, '#663300', '#663300', '#442200', '#331100'],
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 40 } },
          animation: { delay: 600, duration: 1400, easing: 'easeOutBounce' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111', titleColor: '#FFD700',
              callbacks: { label: function(ctx) { return ctx.raw + '% Interaction'; } }
            },
            datalabels: {
              color: function(ctx) { return ctx.dataIndex === 0 ? '#FFD700' : '#888'; },
              anchor: 'end', align: 'right', offset: 5,
              font: { weight: 'bold', size: 11 },
              formatter: function(val) { return val + '%'; }
            }
          },
          scales: {
            x: { display: false },
            y: { grid: { display: false }, ticks: { color: '#aaa', font: { size: 11 } } }
          }
        }
      });
    }
  }

  /* Client Passcode Unlock Logic */
  var accessForm = document.getElementById("horizonAccessForm");
  var codeInput = document.getElementById("horizonCodeInput");
  var statusMsg = document.getElementById("horizonStatusMsg");
  var metaBadge = document.getElementById("clientMetaBadge");
  var nameHolder = document.getElementById("clientNameHolder");
  var codeChips = document.querySelectorAll(".code-chip");

  var CLIENT_DATABASE = {
    "atomz111": { name: "Rahul Jawatwala", handle: "@rahuljawatwala", format: "Rahul Jawatwala (atomz111)" },
    "atomz112": { name: "Harsh", handle: "@fitharsh__15", format: "Harsh (atomz112)" },
    "atomz113": { name: "Aum", handle: "@aum.creation", format: "Aum (atomz113)" },
    "atomz114": { name: "Toxic Somo", handle: "@fitwithtoxic_somo", format: "Toxic Somo (atomz114)" },
    "atomz115": { name: "Vraj Fit", handle: "@vraj_fit", format: "Vraj Fit (atomz115)" }
  };

  function processCodeAccess(enteredCode) {
    if (!enteredCode) return;
    var cleanedCode = enteredCode.trim().toLowerCase();
    
    if (cleanedCode.length >= 3) {
      if (statusMsg) {
        statusMsg.textContent = "✓ Access Granted — Redirecting to Horizon Client Portal...";
        statusMsg.className = "horizon-status-msg success";
      }
      setTimeout(function() {
        if (cleanedCode === "atomztrial" || cleanedCode.indexOf("trial") !== -1) {
          window.location.href = "horizon-trial.html?code=" + encodeURIComponent(cleanedCode);
        } else if (cleanedCode === "atomz112" || cleanedCode.indexOf("harsh") !== -1) {
          window.location.href = "horizon-harsh.html?code=" + encodeURIComponent(cleanedCode);
        } else if (cleanedCode === "atomz113" || cleanedCode.indexOf("aum") !== -1) {
          window.location.href = "horizon-113.html?code=" + encodeURIComponent(cleanedCode);
        } else if (cleanedCode === "atomz114" || cleanedCode.indexOf("somo") !== -1) {
          window.location.href = "horizon-114.html?code=" + encodeURIComponent(cleanedCode);
        } else if (cleanedCode === "atomz115" || cleanedCode.indexOf("vraj") !== -1) {
          window.location.href = "horizon-115.html?code=" + encodeURIComponent(cleanedCode);
        } else {
          window.location.href = "horizon-dossier.html?code=" + encodeURIComponent(cleanedCode);
        }
      }, 400);
    } else {
      if (statusMsg) {
        statusMsg.textContent = "❌ Please enter a valid client passkey.";
        statusMsg.className = "horizon-status-msg error";
      }
    }
  }

  if (accessForm) {
    accessForm.addEventListener("submit", function(e) {
      e.preventDefault();
      if (codeInput) processCodeAccess(codeInput.value);
    });
  }
})();

/* ==========================================================================
   INTRO LOADING ANIMATION (Center Logo Shrink & Fly to Top-Left)
   ========================================================================== */
function runIntroLoader() {
  const overlay = document.getElementById('introLoaderOverlay');
  const loaderLogo = document.getElementById('introLoaderLogo');
  const targetLogo = document.querySelector('.brand__logo') || document.querySelector('.brand img') || document.querySelector('header img');

  if (!overlay || !loaderLogo) return;

  // Reveal brand text in center loader briefly
  setTimeout(() => {
    overlay.classList.add('show-text');
  }, 150);

  // Logo starts flying to top-left corner
  setTimeout(() => {
    overlay.classList.add('animating');

    if (targetLogo) {
      const loaderRect = loaderLogo.getBoundingClientRect();
      const targetRect = targetLogo.getBoundingClientRect();

      const dx = targetRect.left + (targetRect.width / 2) - (loaderRect.left + (loaderRect.width / 2));
      const dy = targetRect.top + (targetRect.height / 2) - (loaderRect.top + (loaderRect.height / 2));
      const scale = Math.max(0.12, targetRect.width / loaderRect.width);

      loaderLogo.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    } else {
      loaderLogo.style.transform = `translate(calc(-50vw + 60px), calc(-50vh + 35px)) scale(0.15)`;
    }
  }, 450);

  // As logo reaches top-left corner: fade out overlay and trigger brand text slide-in animation
  setTimeout(() => {
    overlay.classList.add('done');

    const brandEl = document.querySelector('.brand') || document.querySelector('header .font-headline-md');
    if (brandEl) {
      brandEl.classList.add('brand-text-reveal');
    }
  }, 1150);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runIntroLoader);
} else {
  runIntroLoader();
}
