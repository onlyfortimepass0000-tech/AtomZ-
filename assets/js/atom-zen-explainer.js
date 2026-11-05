/**
 * ATOM ZEN Explainer Engine
 * Automated 5-scene visual explainer with step scrubbing, pause/play,
 * IntersectionObserver viewport detection, and prefers-reduced-motion support.
 */
(function () {
  'use strict';

  var DURATION = 28000; // 28 seconds total
  var SCENES = [
    { id: 1, name: '01. The Problem', start: 0, end: 5500 },
    { id: 2, name: '02. Meet ATOM ZEN', start: 5500, end: 11000 },
    { id: 3, name: '03. Assemble', start: 11000, end: 17500 },
    { id: 4, name: '04. Balance', start: 17500, end: 23500 },
    { id: 5, name: '05. Your Build', start: 23500, end: 28000 }
  ];

  var section = document.getElementById('zen-explainer');
  if (!section) return;

  var tabs = section.querySelectorAll('.zen-exp__tab');
  var scenes = section.querySelectorAll('.zen-exp__scene');
  var playBtn = section.querySelector('#zenPlayBtn');
  var replayBtn = section.querySelector('#zenReplayBtn');
  var replayBtnS5 = section.querySelector('#zenReplayBtnS5');
  var progressBar = section.querySelector('#zenTimelineProgress');
  var timeDisplay = section.querySelector('#zenTimelineTime');

  // Sub-elements for scene 3 micro-actions
  var s3Badge = section.querySelector('#s3ReelsBadge');
  var s3StepperVal = section.querySelector('#s3StepperValue');
  var s3LandingSat = section.querySelector('#s3LandingSat');
  var s3BannerTitle = section.querySelector('#s3BannerTitle');

  // Sub-elements for scene 4 slider micro-actions
  var s4TimeFill = section.querySelector('#s4TimeFill');
  var s4MoneyFill = section.querySelector('#s4MoneyFill');
  var s4QualityFill = section.querySelector('#s4QualityFill');
  var s4TimeVal = section.querySelector('#s4TimeVal');
  var s4MoneyVal = section.querySelector('#s4MoneyVal');
  var s4QualityVal = section.querySelector('#s4QualityVal');
  var s4EstPrice = section.querySelector('#s4EstPrice');
  var s4EstDays = section.querySelector('#s4EstDays');
  var s4EstDetail = section.querySelector('#s4EstDetail');

  // Scene 1 cursor
  var s1Cursor = section.querySelector('#s1Cursor');

  var isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isPlaying = false;
  var currentTime = 0;
  var lastTimestamp = 0;
  var animationFrameId = null;
  var hasStartedOnce = false;

  function formatTime(ms) {
    var totalSec = Math.floor(ms / 1000);
    var sec = totalSec % 60;
    var min = Math.floor(totalSec / 60);
    return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function getSceneIndex(timeMs) {
    for (var i = 0; i < SCENES.length; i++) {
      if (timeMs >= SCENES[i].start && timeMs < SCENES[i].end) {
        return i;
      }
    }
    return SCENES.length - 1;
  }

  function setScene(index, skipSubAnimations) {
    // Update tabs
    tabs.forEach(function (tab, i) {
      if (i === index) {
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('is-active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Update scene visibility
    scenes.forEach(function (scene, i) {
      if (i === index) {
        scene.classList.add('is-active');
        scene.setAttribute('aria-hidden', 'false');
      } else {
        scene.classList.remove('is-active');
        scene.setAttribute('aria-hidden', 'true');
      }
    });

    if (!skipSubAnimations) {
      renderSceneMicroAnimations(index, currentTime);
    }
  }

  function renderSceneMicroAnimations(sceneIndex, timeMs) {
    // -------------------------------------------------------------
    // Scene 1 Micro-animations: Cursor wandering
    // -------------------------------------------------------------
    if (sceneIndex === 0 && s1Cursor) {
      var s1Progress = (timeMs - SCENES[0].start) / (SCENES[0].end - SCENES[0].start);
      if (s1Progress < 0.3) {
        s1Cursor.style.transform = 'translate(-60px, -40px)';
      } else if (s1Progress < 0.6) {
        s1Cursor.style.transform = 'translate(80px, -20px)';
      } else if (s1Progress < 0.85) {
        s1Cursor.style.transform = 'translate(-40px, 60px)';
      } else {
        s1Cursor.style.transform = 'translate(40px, 30px)';
      }
    }

    // -------------------------------------------------------------
    // Scene 3 Micro-animations: Adding Reels, incrementing, landing page
    // -------------------------------------------------------------
    if (sceneIndex === 2) {
      var s3Progress = (timeMs - SCENES[2].start) / (SCENES[2].end - SCENES[2].start);
      if (s3Progress < 0.25) {
        // Step A: Choose a starting point
        if (s3BannerTitle) s3BannerTitle.textContent = '1. Choose a starting point.';
        if (s3Badge) s3Badge.classList.remove('is-visible');
        if (s3StepperVal) s3StepperVal.textContent = '1';
        if (s3LandingSat) s3LandingSat.style.opacity = '0.2';
      } else if (s3Progress < 0.55) {
        // Step B: Add what you need (Reels added, stepping 1 -> 3)
        if (s3BannerTitle) s3BannerTitle.textContent = '2. Add what you need & set quantities.';
        if (s3Badge) s3Badge.classList.add('is-visible');
        if (s3StepperVal) s3StepperVal.textContent = '3';
        if (s3LandingSat) s3LandingSat.style.opacity = '0.2';
      } else {
        // Step C: Add Landing page across categories
        if (s3BannerTitle) s3BannerTitle.textContent = '3. Mix services across any category freely.';
        if (s3Badge) s3Badge.classList.add('is-visible');
        if (s3StepperVal) s3StepperVal.textContent = '3';
        if (s3LandingSat) {
          s3LandingSat.style.opacity = '1';
          s3LandingSat.style.transform = 'scale(1)';
        }
      }
    }

    // -------------------------------------------------------------
    // Scene 4 Micro-animations: Demonstrating the three trade-offs
    // -------------------------------------------------------------
    if (sceneIndex === 3) {
      var s4Progress = (timeMs - SCENES[3].start) / (SCENES[3].end - SCENES[3].start);
      if (s4Progress < 0.33) {
        // Trade-off 1: Standard delivery (10 days) -> Relaxed (14 days) decreases cost!
        if (s4TimeFill) s4TimeFill.style.width = '75%';
        if (s4TimeVal) s4TimeVal.textContent = '14 days';
        if (s4MoneyFill) s4MoneyFill.style.width = '45%';
        if (s4MoneyVal) s4MoneyVal.textContent = 'Standard';
        if (s4QualityFill) s4QualityFill.style.width = '50%';
        if (s4QualityVal) s4QualityVal.textContent = 'Standard (q=1)';
        if (s4EstPrice) s4EstPrice.textContent = '₹9,800';
        if (s4EstDays) s4EstDays.textContent = '14 workdays';
        if (s4EstDetail) s4EstDetail.textContent = 'Standard';
      } else if (s4Progress < 0.66) {
        // Trade-off 2: Priority Rush (Faster delivery) shortens time to 6 days
        if (s4TimeFill) s4TimeFill.style.width = '30%';
        if (s4TimeVal) s4TimeVal.textContent = '6 days';
        if (s4MoneyFill) s4MoneyFill.style.width = '85%';
        if (s4MoneyVal) s4MoneyVal.textContent = 'Priority Rush';
        if (s4QualityFill) s4QualityFill.style.width = '50%';
        if (s4QualityVal) s4QualityVal.textContent = 'Standard (q=1)';
        if (s4EstPrice) s4EstPrice.textContent = '₹14,500';
        if (s4EstDays) s4EstDays.textContent = '6 workdays';
        if (s4EstDetail) s4EstDetail.textContent = 'Standard';
      } else {
        // Trade-off 3: Increased production detail (Enhanced / Advanced)
        if (s4TimeFill) s4TimeFill.style.width = '55%';
        if (s4TimeVal) s4TimeVal.textContent = '10 days';
        if (s4MoneyFill) s4MoneyFill.style.width = '65%';
        if (s4MoneyVal) s4MoneyVal.textContent = 'Balanced';
        if (s4QualityFill) s4QualityFill.style.width = '80%';
        if (s4QualityVal) s4QualityVal.textContent = 'Enhanced (q=2)';
        if (s4EstPrice) s4EstPrice.textContent = '₹12,800';
        if (s4EstDays) s4EstDays.textContent = '10 workdays';
        if (s4EstDetail) s4EstDetail.textContent = 'Enhanced';
      }
    }
  }

  function tick(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    var delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (isPlaying) {
      currentTime += delta;
      if (currentTime >= DURATION) {
        currentTime = DURATION;
        pause();
      }
    }

    var progressPercent = Math.min(100, (currentTime / DURATION) * 100);
    if (progressBar) {
      progressBar.style.width = progressPercent + '%';
    }
    if (timeDisplay) {
      timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(DURATION);
    }

    var currentScene = getSceneIndex(currentTime);
    setScene(currentScene, false);

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(tick);
    }
  }

  function play() {
    if (currentTime >= DURATION) {
      currentTime = 0;
    }
    isPlaying = true;
    lastTimestamp = 0;
    if (playBtn) {
      playBtn.innerHTML = '<span aria-hidden="true">⏸</span> Pause';
      playBtn.setAttribute('aria-label', 'Pause visual explainer');
    }
    animationFrameId = requestAnimationFrame(tick);
  }

  function pause() {
    isPlaying = false;
    if (playBtn) {
      playBtn.innerHTML = '<span aria-hidden="true">▶</span> Play';
      playBtn.setAttribute('aria-label', 'Play visual explainer');
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function jumpToScene(index) {
    pause();
    currentTime = SCENES[index].start + 100;
    var progressPercent = (currentTime / DURATION) * 100;
    if (progressBar) progressBar.style.width = progressPercent + '%';
    if (timeDisplay) timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(DURATION);
    setScene(index, false);
  }

  function replay() {
    currentTime = 0;
    setScene(0, false);
    play();
  }

  // Event Listeners
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (isPlaying) pause();
      else play();
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', replay);
  }
  if (replayBtnS5) {
    replayBtnS5.addEventListener('click', replay);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      jumpToScene(i);
    });
  });

  // Timeline scrubber click
  var timelineContainer = section.querySelector('.zen-exp__timeline-progress');
  if (timelineContainer) {
    timelineContainer.addEventListener('click', function (e) {
      var rect = timelineContainer.getBoundingClientRect();
      var clickX = e.clientX - rect.left;
      var ratio = Math.max(0, Math.min(1, clickX / rect.width));
      currentTime = ratio * DURATION;
      var currentScene = getSceneIndex(currentTime);
      setScene(currentScene, false);
      if (progressBar) progressBar.style.width = (ratio * 100) + '%';
      if (timeDisplay) timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(DURATION);
    });
  }

  // IntersectionObserver: Auto-play when 25%+ in viewport, pause when offscreen
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!hasStartedOnce && !isReducedMotion) {
              hasStartedOnce = true;
              play();
            } else if (hasStartedOnce && !isReducedMotion && currentTime < DURATION) {
              play();
            }
          } else {
            if (isPlaying) {
              pause();
            }
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(section);
  }

  // Pause when browser tab is inactive / hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && isPlaying) {
      pause();
    }
  });

  // Initial setup: render Scene 1
  setScene(0, false);
  if (isReducedMotion) {
    pause();
  }
})();
