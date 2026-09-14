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
    "atomz115": { name: "Train With Tas", handle: "@trainwithtas_", format: "Train With Tas (atomz115)" },
    "atomz116": { name: "Esteban", handle: "@esteban", format: "Esteban (atomz116)" }
  };

  function processCodeAccess(enteredCode) {
    if (!enteredCode) return;
    var cleanedCode = enteredCode.trim().toLowerCase().replace(/[\s\-_]/g, '');
    
    var targetUrl = null;
    if (cleanedCode === "atomz111" || cleanedCode === "111" || cleanedCode.indexOf("rahul") !== -1) {
      targetUrl = "horizon-dossier.html?code=" + encodeURIComponent(enteredCode);
    } else if (cleanedCode === "atomz112" || cleanedCode === "112" || cleanedCode.indexOf("harsh") !== -1) {
      targetUrl = "horizon-harsh.html?code=" + encodeURIComponent(enteredCode);
    } else if (cleanedCode === "atomz113" || cleanedCode === "113" || cleanedCode.indexOf("aum") !== -1) {
      targetUrl = "horizon-113.html?code=" + encodeURIComponent(enteredCode);
    } else if (cleanedCode === "atomz114" || cleanedCode === "114" || cleanedCode.indexOf("somo") !== -1) {
      targetUrl = "horizon-114.html?code=" + encodeURIComponent(enteredCode);
    } else if (cleanedCode === "atomz115" || cleanedCode === "115" || cleanedCode.indexOf("tas") !== -1 || cleanedCode.indexOf("train") !== -1) {
      targetUrl = "horizon-115.html?code=" + encodeURIComponent(enteredCode);
    } else if (cleanedCode === "atomz116" || cleanedCode === "116" || cleanedCode.indexOf("esteban") !== -1) {
      targetUrl = "horizon-116.html?code=" + encodeURIComponent(enteredCode);
    } else if (cleanedCode === "atomztrial" || cleanedCode === "trial" || cleanedCode.indexOf("trial") !== -1) {
      targetUrl = "horizon-trial.html?code=" + encodeURIComponent(enteredCode);
    }

    if (targetUrl) {
      if (statusMsg) {
        statusMsg.innerHTML = "<span style='color:#00FF41; font-weight:700;'>✓ Passkey Accepted — Redirecting to Horizon Client Portal...</span>";
        statusMsg.className = "horizon-status-msg success";
      }
      setTimeout(function() {
        window.location.href = targetUrl;
      }, 400);
    } else {
      if (statusMsg) {
        statusMsg.innerHTML = '<div style="background:rgba(255,42,42,0.1); border:1px solid rgba(255,42,42,0.35); padding:14px 16px; border-radius:12px; margin-top:12px; text-align:left;"><p style="color:#FF4A4A; font-weight:700; font-size:13.5px; margin:0 0 6px 0;">❌ Wrong passkey entered.</p><p style="color:#CCCCCC; font-size:13px; margin:0 0 12px 0; line-height:1.4;">Contact AtomZ on WhatsApp to get your official access passkey.</p><a href="https://wa.me/919099939034?text=Hi%20AtomZ%2C%20I%20need%20my%20Horizon%20Portal%20access%20passkey." target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:8px; background:#25D366; color:#000000; font-family:\'Sora\',sans-serif; font-weight:700; font-size:12.5px; padding:8px 16px; border-radius:20px; text-decoration:none; transition:all 0.2s;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg><span>Contact AtomZ on WhatsApp</span></a></div>';
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
   RESTORED SIGNATURE LOGO INTRO: DUO-STYLE 3D FLIP + FLY TO BRAND LOGO
   - Duo-Style 3D Turn: Solid face flips 180° into luminous contour echo
   - Progressive blur resolves into sharp focus
   - Signature Fly: Staged in center, then smoothly flies directly into the 
     top-left `.brand__logo` header position.
   - Cleans up and stores session key so internal navigation remains snappy.
   ========================================================================== */
function runDuoLogoIntro() {
  const overlay = document.getElementById('introLoaderOverlay');
  const duoCard = document.getElementById('duoLogoCard');
  const brandText = document.getElementById('introLoaderBrandText');
  const targetLogo = document.querySelector('.brand__logo') || 
                     document.querySelector('.brand img') || 
                     document.querySelector('header img') || 
                     document.querySelector('header a.brand');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!overlay) return;

  const INTRO_SHOWN_KEY = 'atomz-intro-completed';
  if (sessionStorage.getItem(INTRO_SHOWN_KEY) || reduceMotion) {
    overlay.classList.add('done');
    overlay.remove();
    return;
  }

  requestAnimationFrame(() => {
    // 1. Center reveal: progressive blur cleans up
    setTimeout(() => {
      overlay.classList.add('stage-sharp');
      if (brandText) brandText.classList.add('resolved');
    }, 100);

    // 2. Duo-Style 3D flip (solid to luminous contour echo)
    setTimeout(() => {
      if (duoCard) duoCard.classList.add('flipped');
    }, 450);

    // 3. Signature Fly to top-left brand logo
    setTimeout(() => {
      overlay.classList.add('flying');

      if (duoCard && targetLogo) {
        const cardRect = duoCard.getBoundingClientRect();
        const targetRect = targetLogo.getBoundingClientRect();

        const dx = targetRect.left + (targetRect.width / 2) - (cardRect.left + (cardRect.width / 2));
        const dy = targetRect.top + (targetRect.height / 2) - (cardRect.top + (cardRect.height / 2));
        const scale = Math.max(0.18, targetRect.width / cardRect.width);

        duoCard.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
      }

      if (brandText) {
        brandText.style.opacity = '0';
        brandText.style.transform = 'translateY(-12px)';
      }
    }, 1050);

    // 4. Settling into header & fade out overlay
    setTimeout(() => {
      overlay.classList.add('exiting');
      try { sessionStorage.setItem(INTRO_SHOWN_KEY, 'true'); } catch (e) {}

      const brandEl = document.querySelector('.brand');
      if (brandEl) brandEl.classList.add('brand-revealed');

      setTimeout(() => {
        overlay.classList.add('done');
        overlay.remove();
      }, 260);
    }, 1550);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runDuoLogoIntro);
} else {
  runDuoLogoIntro();
}

/* ==========================================================================
   PAGE ENTRANCE & COORDINATED INTERNAL NAVIGATION TRANSITIONS
   ========================================================================== */
(function initPageTransitions() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  document.body.classList.add('page-entered');

  // Intercept internal page link clicks for smooth exit
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    if (link.getAttribute('target') === '_blank' || link.hasAttribute('download')) return;

    try {
      const targetUrl = new URL(href, window.location.href);
      if (targetUrl.origin === window.location.origin) {
        e.preventDefault();
        document.documentElement.classList.add('page-transitioning');
        setTimeout(() => {
          window.location.href = href;
        }, 110);
      }
    } catch (err) {}
  });
})();

/* ==========================================================================
   ATOMZ atom ↔ legend highlight sync (progressive enhancement)
   Hovering a legend row highlights its orbiting electron. No-op if absent.
   ========================================================================== */
(function () {
  "use strict";
  var atom = document.querySelector(".atom");
  var legend = document.querySelector(".atom-legend");
  if (!atom || !legend) return;
  legend.querySelectorAll(".leg").forEach(function (li) {
    var k = li.getAttribute("data-k");
    var orbit = atom.querySelector('.orbit[data-k="' + k + '"]');
    function on() { li.classList.add("is-active"); if (orbit) orbit.classList.add("is-active"); }
    function off() { li.classList.remove("is-active"); if (orbit) orbit.classList.remove("is-active"); }
    li.addEventListener("mouseenter", on);
    li.addEventListener("mouseleave", off);
  });
})();

/* ==========================================================================
   CRENCY-STYLE SCROLL ANIMATIONS
   – Stagger reveal observer (for [data-reveal-stagger])
   – Smooth parallax sections
   – Split-word headline stagger
   – Magnetic button hover tracking
   ========================================================================== */
(function crencyAnimations() {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  /* ---- Stagger reveal observer ----------------------------------------- */
  var staggerEls = document.querySelectorAll("[data-reveal-stagger]");
  if ("IntersectionObserver" in window && staggerEls.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          sio.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    staggerEls.forEach(function (el) { sio.observe(el); });
  }

  /* ---- Smooth parallax for [data-parallax] elements -------------------- */
  /* Elements with data-parallax="0.06" move 6% of scroll delta relative    */
  /* to their natural position — subtle Crency-style depth.                 */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length) {
    var applyParallax = function () {
      var scrollTop = window.scrollY;
      var wH = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offset = ((center - wH / 2) / wH) * parseFloat(el.dataset.parallax || 0.06) * -100;
        el.style.transform = "translateY(" + offset.toFixed(2) + "px)";
      });
    };
    var pTicking = false;
    window.addEventListener("scroll", function () {
      if (!pTicking) {
        window.requestAnimationFrame(function () { applyParallax(); pTicking = false; });
        pTicking = true;
      }
    }, { passive: true });
    applyParallax();
  }

  /* ---- Split-word stagger on section headlines -------------------------- */
  /* Wraps each word in a <span class="split-word"> with computed delay.    */
  document.querySelectorAll("[data-split-words]").forEach(function (el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.innerHTML = "";
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "split-word";
      span.style.transitionDelay = (0.04 + i * 0.055) + "s";
      span.textContent = word;
      el.appendChild(span);
      // Add a text space between words
      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });
  });

  /* Observe split-word parents for intersection */
  var splitParents = document.querySelectorAll("[data-split-words]");
  if ("IntersectionObserver" in window && splitParents.length) {
    var swio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          swio.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    splitParents.forEach(function (el) { swio.observe(el); });
  }

  /* ---- Magnetic button hover tracking (Crency btn-bubble) -------------- */
  /* On hover, buttons' ::after pseudo tracks the mouse position.           */
  document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("mousemove", function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      btn.style.setProperty("--mx", x + "px");
      btn.style.setProperty("--my", y + "px");
    });
  });

  /* ---- Scroll-interactive ambient background & kinetic element handler - */
  var kineticEl = document.getElementById("ambientKinetic");
  var ambientBg = document.querySelector(".ambient-bg");

  function updateAmbientMotion() {
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var viewportH = window.innerHeight || 800;

    // 1. Kinetic Element: Most visible on first screen, smoothly fades to 0 as user scrolls past hero (approx 1.25 viewports)
    if (kineticEl) {
      // Fade from 0.42 (top) down to 0 at 1.2 viewports
      var fadeFactor = Math.max(0, 1 - (scrollY / (viewportH * 1.25)));
      var targetOpacity = (fadeFactor * 0.45).toFixed(3);
      
      // Interactive scroll rotation and vertical parallax drift
      var spinDeg = (scrollY * 0.05).toFixed(2);
      var driftPx = (scrollY * 0.16).toFixed(1);

      kineticEl.style.setProperty("--kinetic-fade", targetOpacity);
      kineticEl.style.setProperty("--scroll-spin", spinDeg + "deg");
      kineticEl.style.setProperty("--scroll-drift", driftPx + "px");

      // Hide completely when scrolled far to save GPU compositor work
      kineticEl.style.visibility = fadeFactor <= 0.005 ? "hidden" : "visible";
    }

    // 2. Ambient background deep blur orbs: subtle fade on deeper scroll
    if (ambientBg) {
      var docH = document.documentElement.scrollHeight - viewportH;
      var p = docH > 0 ? Math.min(1, scrollY / docH) : 0;
      // Slightly reduce ambient blur intensity deeper on the page for cleaner reading
      ambientBg.style.opacity = Math.max(0.4, 0.95 - p * 0.35).toFixed(2);
    }
  }

  var aTicking = false;
  window.addEventListener("scroll", function () {
    if (!aTicking) {
      window.requestAnimationFrame(function () { updateAmbientMotion(); aTicking = false; });
      aTicking = true;
    }
  }, { passive: true });
  
  // Initial compute
  updateAmbientMotion();
})();
