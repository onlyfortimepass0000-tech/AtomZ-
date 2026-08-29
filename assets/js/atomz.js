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
    "atomz111": { name: "Rahul Jawatwala", format: "Rahul Jawatwala (atomz111)" },
    "atomz112": { name: "Creator Partner #112", format: "Client Portal #112 (atomz112)" },
    "atomz113": { name: "Creator Partner #113", format: "Client Portal #113 (atomz113)" }
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
        if (cleanedCode === "atomz112" || cleanedCode.indexOf("harsh") !== -1) {
          window.location.href = "horizon-harsh.html?code=" + encodeURIComponent(cleanedCode);
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

/* ==========================================================================
   ATOMZ — CREATOR GROWTH DIAGNOSTIC ENGINE
   ========================================================================== */
window.CreatorDiagnosticEngine = {
  profiles: {
    rahul: {
      id: "rahul",
      name: "Rahul Jawatwala",
      handle: "@rahul_jawatwala",
      followers: 12400,
      baselineViews: 8400,
      peakReach: 48900,
      sampleSize: 28,
      confidence: "High (28 Reels analyzed)",
      provenData: {
        topFormat: "Case Study Breakdown Reels & Visual Carousels",
        saveRate: "12.4% Save Rate (4.2× Industry Average)",
        topCategory: "Founder Case Studies & Growth Breakdown",
        weakCategory: "Generic Motivational Quotes (<0.4× Outlier)",
        ctaStatus: "Passive / Missing DM Keyword Trigger"
      },
      initialMatrix: [
        { dimension: "Content Direction", signal: "Developing", confidence: "High", tag: "PROVEN", desc: "Data proves Case Studies outperform quotes by 4.2×" },
        { dimension: "Growth Objective", signal: "Unclear", confidence: "Low", tag: "UNKNOWN", desc: "Requires creator input on monetization preference" },
        { dimension: "Audience Alignment", signal: "Strong", confidence: "Medium", tag: "INDICATED", desc: "High saves signal serious founder/creator audience" },
        { dimension: "Monetization Readiness", signal: "Developing", confidence: "Medium", tag: "INDICATED", desc: "Strong engagement, missing direct offer funnel" },
        { dimension: "Content Consistency", signal: "Strong", confidence: "High", tag: "PROVEN", desc: "Consistent 4.2 posts/week schedule over 60 days" },
        { dimension: "Growth Opportunity", signal: "Opportunity", confidence: "High", tag: "PROVEN", desc: "High Save Rate indicates massive DM lead potential" }
      ],
      questions: [
        {
          id: "q1",
          title: "What is your primary 90-day business & growth outcome?",
          subtitle: "Uncertainty: Data shows 12.4% save rate, but monetization intent is unverified.",
          type: "single",
          options: [
            { text: "Monetize via High-Ticket 1-on-1 Consulting or Client Services", value: "consulting", impact: "high_monetization" },
            { text: "Build Massive Reach & Authority for Brand Sponsorships", value: "brand_deals", impact: "high_reach" },
            { text: "Launch a Digital Product, Course, or Private Community", value: "digital_product", impact: "high_scale" },
            { text: "Generate Direct Inbound Leads for an Existing Business", value: "inbound_leads", impact: "high_leads" }
          ]
        },
        {
          id: "q2",
          title: "Which content creation format fits your actual weekly schedule?",
          subtitle: "Uncertainty: Carousels generate 4.2× higher saves but require design time.",
          type: "single",
          options: [
            { text: "2-3 Hours/Week: Prefer Talking Head Videos + Quick Text Overlays", value: "short_video", impact: "time_constrained" },
            { text: "4-6 Hours/Week: Can create 4-5 Slide Educational Carousels + Video Hooks", value: "carousels_video", impact: "optimal_mix" },
            { text: "6+ Hours/Week: Full Deep-Dive Production & Long-form Breakdown", value: "deep_dive", impact: "high_production" }
          ]
        },
        {
          id: "q3",
          title: "What direct offer or lead trigger can you fulfill immediately?",
          subtitle: "Uncertainty: Your reels currently lack psychological action triggers.",
          type: "single",
          options: [
            { text: "Free PDF Blueprint / Resource Guide (via Instagram DM Keyword)", value: "dm_keyword", impact: "dm_funnel" },
            { text: "15-Minute Strategy Audit Call (Link in Bio Booking)", value: "call_booking", impact: "calendar_funnel" },
            { text: "Exclusive Weekly Newsletter / Substack Signup", value: "newsletter", impact: "email_funnel" }
          ]
        },
        {
          id: "q4",
          title: "What is your biggest personal constraint or boundary right now?",
          subtitle: "Uncertainty: Ensuring recommendations don't cause creator burnout.",
          type: "single",
          options: [
            { text: "Limited time due to client fulfillment / primary business", value: "time_limit", impact: "batch_template" },
            { text: "Unwilling to post low-effort meme trends or clickbait", value: "quality_boundary", impact: "high_brand" },
            { text: "Need predictable script templates to remove creative block", value: "script_need", impact: "template_library" }
          ]
        }
      ]
    },
    harsh: {
      id: "harsh",
      name: "Harsh",
      handle: "@harsh_fitness",
      followers: 390,
      baselineViews: 1943,
      peakReach: 5894,
      sampleSize: 14,
      confidence: "Medium (14 Reels analyzed — 15.1× Viral Outlier Detected)",
      provenData: {
        topFormat: "Marathi Cultural Fitness & Gym Meme Reels",
        saveRate: "68.59% Carousel ER (3.7× Outlier Winner)",
        topCategory: "Cultural Pride Lifts (कोंडाजी फर्जंद 🚩 - 2.45× Outlier)",
        weakCategory: "Generic Motivational Posts (<0.8× Outlier)",
        ctaStatus: "Broken Conversion Mechanism (390 Followers vs 5.8K Views)"
      },
      initialMatrix: [
        { dimension: "Content Direction", signal: "Emerging", confidence: "Medium", tag: "PROVEN", desc: "Marathi audio & humor yield 2.45× outlier reach" },
        { dimension: "Growth Objective", signal: "Unclear", confidence: "Low", tag: "UNKNOWN", desc: "Requires input on fitness coaching vs entertainment" },
        { dimension: "Audience Alignment", signal: "Strong", confidence: "Medium", tag: "INDICATED", desc: "AURA FARM & Okay 💀 drive massive engagement" },
        { dimension: "Monetization Readiness", signal: "Misaligned", confidence: "High", tag: "PROVEN", desc: "High viral reach but 0 active lead capture triggers" },
        { dimension: "Content Consistency", signal: "Risk", confidence: "High", tag: "PROVEN", desc: "23.5% view slowdown after reverting to generic quotes" },
        { dimension: "Growth Opportunity", signal: "Opportunity", confidence: "High", tag: "PROVEN", desc: "15.1× follower reach gap represents explosive growth" }
      ],
      questions: [
        {
          id: "q1",
          title: "What is your primary 90-day goal for your Instagram account?",
          subtitle: "Uncertainty: Data shows 5.8K reach (15.1× followers), but conversion intent is unknown.",
          type: "single",
          options: [
            { text: "Build a Massive Following (10K+) & Become a Known Fitness Influencer", value: "influence_scale", impact: "viral_reach" },
            { text: "Get Paid Online Coaching Clients (1-on-1 Transformation Training)", value: "online_coaching", impact: "high_ticket" },
            { text: "Promote Local Gym / Personal Training & Regional Fitness Apparel", value: "local_training", impact: "local_brand" }
          ]
        },
        {
          id: "q2",
          title: "How do you feel about blending Gym Entertainment with Serious Advice?",
          subtitle: "Uncertainty: Meme reels drive views (5.8K), while Carousels drive 68% saves.",
          type: "single",
          options: [
            { text: "Hybrid Approach (Recommended): Short 5-7s Memes for Reach + Carousels for Authority", value: "hybrid_blend", impact: "optimal_growth" },
            { text: "100% Serious Fitness & Transformation (No Jokes or Memes)", value: "pure_fitness", impact: "authority_only" },
            { text: "100% Gym Humor & Relatable Content (Pure Entertainment)", value: "pure_entertainment", impact: "viral_only" }
          ]
        },
        {
          id: "q3",
          title: "What lead magnet or offer can you give viewers who comment 'BULK'?",
          subtitle: "Uncertainty: Replacing 'Follow for more' requires a tangible incentive.",
          type: "single",
          options: [
            { text: "Free 7-Day Indian Bulk Diet Plan & Workout Split (PDF Guide)", value: "diet_pdf", impact: "lead_magnet" },
            { text: "Free Physique & Workout Audit via DM Voice Notes", value: "voice_audit", impact: "direct_dm" },
            { text: "Access to a Private WhatsApp Fitness Community", value: "whatsapp_community", impact: "community_funnel" }
          ]
        },
        {
          id: "q4",
          title: "How many days per week can you consistently post new Reels?",
          subtitle: "Uncertainty: Consistency metric dropped views by 23.5% recently.",
          type: "single",
          options: [
            { text: "3-4 Posts/Week (Focus on High-Quality Carousels & Marathi Audio)", value: "moderate_freq", impact: "quality_focus" },
            { text: "5-6 Posts/Week (Daily Short Memes + Bi-Weekly Transformation Updates)", value: "high_freq", impact: "scale_focus" }
          ]
        }
      ]
    }
  },

  // Calculate dynamic interpretation matrix based on answers
  calculateMatrix: function(profileId, answers) {
    const profile = this.profiles[profileId] || this.profiles.rahul;
    let matrix = JSON.parse(JSON.stringify(profile.initialMatrix));

    if (answers.q1) {
      const q1Val = answers.q1;
      const targetDim = matrix.find(m => m.dimension === "Growth Objective");
      if (targetDim) {
        targetDim.signal = "Clear";
        targetDim.confidence = "High";
        targetDim.tag = "INDICATED";
        targetDim.desc = "Selected: " + (q1Val === "consulting" || q1Val === "online_coaching" ? "High-Ticket Client Monetization" : "Brand Authority & Massive Reach");
      }
    }

    if (answers.q2) {
      const q2Val = answers.q2;
      const targetDim = matrix.find(m => m.dimension === "Content Direction");
      if (targetDim) {
        targetDim.signal = q2Val.includes("hybrid") || q2Val.includes("carousels") ? "Strong" : "Developing";
        targetDim.confidence = "High";
        targetDim.tag = "INDICATED";
        targetDim.desc = "Aligned with " + (q2Val.includes("carousels") || q2Val.includes("hybrid") ? "High-Save Carousels & Video Hooks" : "Targeted Short Format");
      }
    }

    if (answers.q3) {
      const targetDim = matrix.find(m => m.dimension === "Monetization Readiness");
      if (targetDim) {
        targetDim.signal = "Ready";
        targetDim.confidence = "High";
        targetDim.tag = "INDICATED";
        targetDim.desc = "DM Keyword Psychological Trigger Funnel Active";
      }
    }

    if (answers.q4) {
      const targetDim = matrix.find(m => m.dimension === "Content Consistency");
      if (targetDim) {
        targetDim.signal = "Strong";
        targetDim.confidence = "High";
        targetDim.tag = "INDICATED";
        targetDim.desc = "Execution batching strategy established";
      }
    }

    return matrix;
  },

  // Synthesize combined Data + Intent + Constraints into structured Diagnosis
  synthesizeDiagnosis: function(profileId, answers) {
    const profile = this.profiles[profileId] || this.profiles.rahul;
    
    let working = profile.provenData.topFormat + " (" + profile.provenData.saveRate + ")";
    let intent = answers.q1 ? "Focus on " + answers.q1 : "High-Growth Scaling";
    let alignment = "Strong alignment between high-performing formats and creator's long-term business goals.";
    let conflict = "No major strategic conflict detected.";
    let missing = "Automated DM Keyword Trigger & Niche Hashtag Categorization.";
    let leverage = "Transition from generic CTAs to High-Intent Psychological Triggers.";

    if (profileId === "harsh") {
      working = "Cultural Marathi Audio Reels (2.45× Outlier) & 4-Slide Transformation Carousels (68.59% ER).";
      if (answers.q2 === "pure_fitness") {
        conflict = "⚠️ STRATEGIC CONFLICT DETECTED: You selected 100% Serious Fitness, but your data proves Relatable Gym Humor (AURA FARM & Okay 💀) generates 15.1× viral reach. We recommend a Hybrid Model rather than eliminating humor completely.";
      } else {
        conflict = "Strategic alignment: Blending cultural identity & humor for reach while using carousels for follower conversion.";
      }
      missing = "Specific psychological CTAs ('Comment BULK for Diet Plan') to convert 5.8K viral views into followers.";
      leverage = "Double down on Marathi fitness identity (कोंडाजी फर्जंद 🚩) and convert top Reels into 4-slide carousels.";
    } else {
      working = "Case Study Breakdowns & Educational Carousels (12.4% Save Rate • 4.2× Outlier).";
      missing = "DM Keyword Automation (Comment 'BLUEPRINT' to receive PDF guide).";
      leverage = "Scale 5-Slide breakdown carousels to drive high-ticket client consulting inquiries.";
    }

    return {
      working: working,
      intent: intent,
      alignment: alignment,
      conflict: conflict,
      missing: missing,
      leverage: leverage
    };
  },

  // Generate Prioritized Next Actions (DO NOW, TEST NEXT, STOP/REDUCE, BUILD TOWARD)
  generateNextActions: function(profileId, answers) {
    if (profileId === "harsh") {
      return [
        {
          type: "DO NOW",
          title: "Implement High-Intent Psychological CTAs",
          desc: "Replace 'Follow for more' on all upcoming Reels with: 'Save this split for your next push day' or 'Comment BULK and I'll DM you my exact diet plan'.",
          badgeClass: "do-now",
          icon: "bolt"
        },
        {
          type: "TEST NEXT",
          title: "Scale 4-Slide Transformation Carousels",
          desc: "Convert your top-performing 'Skinny 😮💨' Reel into a 4-slide carousel (Slide 1: Hook, Slide 2: Diet, Slide 3: Workout, Slide 4: Result + Save CTA).",
          badgeClass: "test-next",
          icon: "science"
        },
        {
          type: "STOP / REDUCE",
          title: "Purge Generic Broad Hashtags",
          desc: "Immediately stop using #viralreels, #explorepage, and #fypppppp. Shift exclusively to niche tags: #marathifitness, #indianfitnesscommunity, #skinnytobulk.",
          badgeClass: "stop-reduce",
          icon: "block"
        },
        {
          type: "BUILD TOWARD",
          title: "Systematize Cultural Identity Moat (कोंडाजी फर्जंद 🚩)",
          desc: "Establish 1-2 posts/week dedicated to Marathi fitness audio & regional pride combined with heavy lifts (proven 2.45× outlier score).",
          badgeClass: "build-toward",
          icon: "flag"
        }
      ];
    } else {
      return [
        {
          type: "DO NOW",
          title: "Launch DM Keyword Trigger Funnel",
          desc: "Add 'Comment BLUEPRINT for my free 1-Page Growth Guide' to your next 3 breakdown reels to convert high save rates into direct DM leads.",
          badgeClass: "do-now",
          icon: "bolt"
        },
        {
          type: "TEST NEXT",
          title: "Batch 4-Slide Case Study Carousels",
          desc: "Test 2 educational carousels per week breaking down specific founder growth case studies (capitalizing on your 12.4% save rate outlier).",
          badgeClass: "test-next",
          icon: "science"
        },
        {
          type: "STOP / REDUCE",
          title: "Eliminate Generic Motivational Quotes",
          desc: "Stop spending production time on text-on-video quotes (<0.4× outlier performance). Reallocate effort to case study breakdowns.",
          badgeClass: "stop-reduce",
          icon: "block"
        },
        {
          type: "BUILD TOWARD",
          title: "High-Ticket Client Inbound Pipeline",
          desc: "Build a structured 90-day positioning funnel offering 1-on-1 strategy audits for high-growth founders.",
          badgeClass: "build-toward",
          icon: "trending_up"
        }
      ];
    }
  }
};
