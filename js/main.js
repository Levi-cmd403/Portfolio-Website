document.addEventListener('DOMContentLoaded', function () {
  var yearEls = document.querySelectorAll('#year');
  yearEls.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('is-open');
    });
  }

  var heroGraphic = document.querySelector('.hero-graphic');
  var artifact = document.querySelector('.artifact');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroGraphic && artifact && !reduceMotion) {
    var motion = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, frame: null };

    var resetBubble = function () {
      motion.targetX = 0;
      motion.targetY = 0;
      motion.active = false;
      heroGraphic.classList.remove('is-bending');
      heroGraphic.style.setProperty('--bubble-scale-x', '1');
      heroGraphic.style.setProperty('--bubble-scale-y', '1');
      heroGraphic.style.setProperty('--bubble-tilt', '0deg');
      heroGraphic.style.setProperty('--bubble-skew-x', '0deg');
      heroGraphic.style.setProperty('--bubble-skew-y', '0deg');
      heroGraphic.style.setProperty('--bubble-inner-x', '0px');
      heroGraphic.style.setProperty('--bubble-inner-y', '0px');
      heroGraphic.style.setProperty('--bubble-ring-scale', '1');
      heroGraphic.style.setProperty('--bubble-ring-rotate', '18deg');
      heroGraphic.style.setProperty('--bubble-highlight-x', '0%');
      heroGraphic.style.setProperty('--bubble-highlight-y', '0%');
      heroGraphic.style.setProperty('--bubble-shadow-x', '0%');
      heroGraphic.style.setProperty('--bubble-shadow-y', '0%');
      heroGraphic.style.setProperty('--bubble-gloss-x', '0%');
    };

    var updateBubble = function (event) {
      var rect = heroGraphic.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width;
      var py = (event.clientY - rect.top) / rect.height;
      motion.targetX = Math.max(-1, Math.min(1, (px - 0.5) * 2));
      motion.targetY = Math.max(-1, Math.min(1, (py - 0.5) * 2));
      motion.active = true;
      heroGraphic.classList.add('is-bending');
      if (!motion.frame) motion.frame = requestAnimationFrame(tickBubble);
    };

    var tickBubble = function () {
      motion.x += (motion.targetX - motion.x) * 0.14;
      motion.y += (motion.targetY - motion.y) * 0.14;

      heroGraphic.style.setProperty('--bubble-scale-x', String(1 + Math.abs(motion.x) * 0.04));
      heroGraphic.style.setProperty('--bubble-scale-y', String(1 - Math.abs(motion.x) * 0.03));
      heroGraphic.style.setProperty('--bubble-tilt', (motion.x * 8).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-skew-x', (motion.x * 3).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-skew-y', (motion.y * 2).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-inner-x', (motion.x * 10).toFixed(2) + 'px');
      heroGraphic.style.setProperty('--bubble-inner-y', (motion.y * 10).toFixed(2) + 'px');
      heroGraphic.style.setProperty('--bubble-ring-scale', String(1 + Math.abs(motion.y) * 0.06));
      heroGraphic.style.setProperty('--bubble-ring-rotate', (18 + motion.x * 7).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-highlight-x', (50 + motion.x * 22).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-highlight-y', (40 + motion.y * 18).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-shadow-x', (50 - motion.x * 20).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-shadow-y', (60 - motion.y * 18).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-gloss-x', (50 + motion.x * 15).toFixed(2) + '%');

      var idle = Math.abs(motion.targetX - motion.x) < 0.003 && Math.abs(motion.targetY - motion.y) < 0.003;
      if (!motion.active && idle) {
        motion.frame = null;
        return;
      }
      motion.frame = requestAnimationFrame(tickBubble);
    };

    heroGraphic.addEventListener('pointermove', updateBubble);
    heroGraphic.addEventListener('pointerenter', updateBubble);
    heroGraphic.addEventListener('pointerleave', resetBubble);
    resetBubble();
  }

  // Scroll progress + back to top
  var progress = document.getElementById('scroll-progress');
  var backToTop = document.getElementById('back-to-top');

  function onScrollUI() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 320);
  }
  window.addEventListener('scroll', onScrollUI, { passive: true });
  onScrollUI();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // Reveal animation
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  // Stats count up
  var statNumbers = document.querySelectorAll('.stat-number[data-count]');
  function animateCount(el) {
    var target = Number(el.getAttribute('data-count')) || 0;
    var startTime = null;
    var duration = 1200;
    function step(ts) {
      if (!startTime) startTime = ts;
      var t = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.floor(target * eased));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.55 });
    statNumbers.forEach(function (el) { statObserver.observe(el); });
  } else {
    statNumbers.forEach(animateCount);
  }

  // Dynamic projects
  var projectsList = document.getElementById('projects-list');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
  var projectsData = [];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function projectCard(project, i) {
    var stack = (project.stack || []).map(function (item) {
      return '<span>' + escapeHtml(item) + '</span>';
    }).join('');
    return (
      '<article class="project-card is-magnetic" style="animation-delay:' + (i * 60) + 'ms">' +
      '<p class="project-kicker">' + escapeHtml(project.category || 'project') + '</p>' +
      '<h3>' + escapeHtml(project.title) + '</h3>' +
      '<p>' + escapeHtml(project.description) + '</p>' +
      '<div class="project-stack">' + stack + '</div>' +
      '<a class="project-link" href="' + escapeHtml(project.url || '#') + '" target="_blank" rel="noreferrer">View Project</a>' +
      '</article>'
    );
  }

  function renderProjects(filter) {
    if (!projectsList) return;
    var list = projectsData.filter(function (project) {
      if (filter === 'all') return true;
      if (filter === 'featured') return !!project.featured;
      return (project.category || '').toLowerCase() === filter;
    });
    if (!list.length) {
      projectsList.innerHTML = '<p class="projects-state">No projects found.</p>';
      return;
    }
    projectsList.innerHTML = list.map(projectCard).join('');
    attachMagnetic();
  }

  function loadProjects() {
    if (!projectsList) return;
    fetch('data/projects.json')
      .then(function (res) { if (!res.ok) throw new Error('Failed'); return res.json(); })
      .then(function (data) { projectsData = Array.isArray(data) ? data : []; renderProjects('all'); })
      .catch(function () { projectsList.innerHTML = '<p class="projects-state">Could not load projects right now.</p>'; });
  }

  if (projectsList) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
        filterButtons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderProjects(filter);
      });
    });
    loadProjects();
  }

  // Active nav
  var navSectionLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var sections = navSectionLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  function setActiveNav() {
    var pos = window.scrollY + 130;
    var current = '';
    sections.forEach(function (sec) {
      if (pos >= sec.offsetTop) current = '#' + sec.id;
    });
    navSectionLinks.forEach(function (link) {
      link.classList.toggle('is-current', link.getAttribute('href') === current);
    });
  }
  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  // Smooth anchors
  navSectionLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (mainNav && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Magnetic interactions
  function attachMagnetic() {
    if (reduceMotion) return;
    var magneticEls = document.querySelectorAll('.btn, .filter-btn, .service-card, .project-card');
    magneticEls.forEach(function (el) {
      if (el.dataset.magReady === '1') return;
      el.dataset.magReady = '1';
      el.classList.add('is-magnetic');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 10;
        el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }
  attachMagnetic();
});