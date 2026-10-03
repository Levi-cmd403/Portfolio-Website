window.__appReady = true;

document.addEventListener('DOMContentLoaded', function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Footer year
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Theme toggle ----------
  var themeToggle = document.getElementById('theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0c0b10' : '#f7f6f3');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // ---------- Mobile navigation ----------
  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');

  function setMenu(open) {
    if (!navToggle || !mainNav) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mainNav.classList.toggle('is-open', open);
    if (header) header.classList.toggle('menu-open', open);
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    // pointerdown (not click): iOS Safari does not deliver clicks from non-interactive areas to document.
    document.addEventListener('pointerdown', function (e) {
      if (!mainNav.classList.contains('is-open')) return;
      if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
    });
    mainNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  // ---------- Back to top ----------
  var progress = document.getElementById('scroll-progress');
  var backToTop = document.getElementById('back-to-top');

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // ---------- Reveal on scroll ----------
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  // ---------- Scroll effects (one throttled handler: progress, header, back-to-top, scrollspy) ----------
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a.nav-link[href^="#"]'));
  var spySections = spyLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  });
  var scrollState = { scrolled: null, topBtn: null, spy: -2, pending: false };

  function updateOnScroll() {
    scrollState.pending = false;
    var doc = document.documentElement;
    var y = window.pageYOffset || doc.scrollTop || 0;
    var max = doc.scrollHeight - window.innerHeight;

    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';

    var scrolled = y > 8;
    if (header && scrolled !== scrollState.scrolled) {
      scrollState.scrolled = scrolled;
      header.classList.toggle('is-scrolled', scrolled);
    }

    var showTop = y > 480;
    if (backToTop && showTop !== scrollState.topBtn) {
      scrollState.topBtn = showTop;
      backToTop.classList.toggle('is-visible', showTop);
    }

    if (spyLinks.length) {
      var current = -1;
      for (var i = 0; i < spySections.length; i++) {
        if (spySections[i] && y + 140 >= spySections[i].offsetTop) current = i;
      }
      // At the very bottom the last section may be too short to reach the trigger line.
      if (max > 0 && y >= max - 4) current = spySections.length - 1;
      if (current !== scrollState.spy) {
        scrollState.spy = current;
        spyLinks.forEach(function (link, idx) { link.classList.toggle('is-current', idx === current); });
      }
    }
  }

  function requestScrollUpdate() {
    if (scrollState.pending) return;
    scrollState.pending = true;
    window.requestAnimationFrame(updateOnScroll);
  }
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  window.addEventListener('load', requestScrollUpdate); // fonts/layout have settled
  updateOnScroll();

  // Pause the floating hero mockup while it is offscreen (battery / jank on phones).
  var heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { heroVisual.classList.toggle('is-paused', !entry.isIntersecting); });
    }).observe(heroVisual);
  }

  // ---------- Projects ----------
  var projectsList = document.getElementById('projects-list');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
  var projectsData = [];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    return /^https?:\/\//i.test(url || '') ? url : '#';
  }

  function thumbMarkup(category) {
    if (category === 'android') {
      return '<div class="pt pt-app" aria-hidden="true">' +
        '<span class="h"></span>' +
        '<span class="r on"><i></i><b></b></span>' +
        '<span class="r on"><i></i><b></b></span>' +
        '<span class="r"><i></i><b></b></span>' +
        '<span class="r"><i></i><b></b></span>' +
        '<span class="fab"></span></div>';
    }
    return '<div class="pt pt-web" aria-hidden="true">' +
      '<span class="bar"><i></i><i></i><i></i></span>' +
      '<span class="l"></span><span class="l w2"></span><span class="l m"></span>' +
      '<span class="b"></span>' +
      '<span class="g"><i></i><i></i><i></i></span></div>';
  }

  var TINTS = ['', 'tint-b', 'tint-c'];

  function projectCard(project, i) {
    var category = String(project.category || 'project').toLowerCase();
    var stack = (project.stack || []).map(function (item) {
      return '<span>' + escapeHtml(item) + '</span>';
    }).join('');
    var url = safeUrl(project.url);
    var isGithub = /^https?:\/\/(www\.)?github\.com/i.test(url);
    var num = String(i + 1);
    if (num.length < 2) num = '0' + num;

    return (
      '<article class="project-card ' + TINTS[i % TINTS.length] + '" style="animation-delay:' + (i * 70) + 'ms">' +
        '<div class="project-thumb">' +
          '<span class="project-index">' + num + '</span>' +
          (project.featured ? '<span class="project-badge">Featured</span>' : '') +
          thumbMarkup(category) +
        '</div>' +
        '<div class="project-body">' +
          '<p class="project-kicker">' + escapeHtml(category) + '</p>' +
          '<h3>' + escapeHtml(project.title) + '</h3>' +
          '<p>' + escapeHtml(project.description) + '</p>' +
          '<div class="project-stack">' + stack + '</div>' +
          '<a class="link-arrow project-link" href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' +
            (isGithub ? 'View on GitHub' : 'View project') +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>' +
          '</a>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProjects(filter) {
    if (!projectsList) return;
    var list = projectsData.filter(function (project) {
      if (filter === 'all') return true;
      if (filter === 'featured') return !!project.featured;
      return String(project.category || '').toLowerCase() === filter;
    });
    if (!list.length) {
      projectsList.innerHTML = '<p class="projects-state">No projects in this category yet.</p>';
      return;
    }
    projectsList.innerHTML = list.map(projectCard).join('');
  }

  if (projectsList) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
        filterButtons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        renderProjects(filter);
      });
    });

    fetch('data/projects.json')
      .then(function (res) { if (!res.ok) throw new Error('Request failed'); return res.json(); })
      .then(function (data) { projectsData = Array.isArray(data) ? data : []; renderProjects('all'); })
      .catch(function () {
        projectsList.innerHTML = '<p class="projects-state">Projects couldn’t be loaded right now. Please try again shortly.</p>';
      });
  }

  // ---------- Copy to clipboard (with fallback for older / non-secure contexts) ----------
  function copyText(text, onDone, onFail) {
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
      document.body.appendChild(ta);
      try { ta.focus({ preventScroll: true }); } catch (e) {}
      ta.select();
      try { ta.setSelectionRange(0, text.length); } catch (e) {} // iOS needs an explicit range
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (ok) onDone(); else if (onFail) onFail();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone, legacy);
    } else {
      legacy();
    }
  }

  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    var copyTimer = null;
    copyBtn.addEventListener('click', function () {
      var addr = copyBtn.getAttribute('data-email') || '';
      copyText(addr, function () {
        copyBtn.classList.add('is-copied');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () { copyBtn.classList.remove('is-copied'); }, 2000);
      }, function () {
        // Clipboard blocked: open the email menu instead so the address is never a dead end.
        openMailMenu(copyBtn);
      });
    });
  }

  // ---------- Email menu ----------
  // A bare mailto: link does nothing on computers without a default mail app, so every
  // email link opens a small menu (Gmail / Outlook / mail app / copy). Without JS it
  // still behaves as a normal mailto: link.
  var mailMenu = null;
  var mailBackdrop = null;
  var mailTrigger = null;

  function buildMailMenu() {
    var el = document.createElement('div');
    el.className = 'mail-menu';
    el.setAttribute('role', 'menu');
    el.setAttribute('aria-label', 'Choose how to send an email');
    el.hidden = true;
    mailBackdrop = document.createElement('div');
    mailBackdrop.className = 'mail-backdrop';
    mailBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(mailBackdrop);
    el.innerHTML =
      '<p class="mail-menu-title">Send an email via</p>' +
      '<a role="menuitem" data-kind="gmail" target="_blank" rel="noreferrer"><span>Gmail</span><small>opens in a new tab</small></a>' +
      '<a role="menuitem" data-kind="outlook" target="_blank" rel="noreferrer"><span>Outlook</span><small>opens in a new tab</small></a>' +
      '<a role="menuitem" data-kind="app"><span>Email app</span><small>on this device</small></a>' +
      '<button role="menuitem" type="button" data-kind="copy"><span>Copy address</span><small data-copy-state></small></button>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      var copy = e.target.closest('[data-kind="copy"]');
      if (copy) {
        var state = copy.querySelector('[data-copy-state]');
        copyText(el.getAttribute('data-email'), function () {
          state.textContent = 'copied ✓';
          setTimeout(closeMailMenu, 900);
        }, function () {
          state.textContent = 'press Ctrl+C to copy';
        });
      } else if (e.target.closest('a')) {
        closeMailMenu(false);
      }
    });
    el.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(el.querySelectorAll('[role="menuitem"]'));
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Tab') { closeMailMenu(false); }
    });
    return el;
  }

  function positionMailMenu(trigger) {
    var r = trigger.getBoundingClientRect();
    var mw = mailMenu.offsetWidth;
    var mh = mailMenu.offsetHeight;
    var gap = 10;
    var left = Math.min(Math.max(12, r.left), window.innerWidth - mw - 12);
    var below = window.innerHeight - r.bottom;
    var top = below >= mh + gap + 12 ? r.bottom + gap : Math.max(12, r.top - mh - gap);
    mailMenu.style.left = left + 'px';
    mailMenu.style.top = top + 'px';
  }

  function openMailMenu(trigger) {
    var href = trigger.getAttribute('href') || ('mailto:' + (trigger.getAttribute('data-email') || ''));
    var email = decodeURIComponent(href.replace(/^mailto:/i, '').split('?')[0]);
    var subject = encodeURIComponent('Project enquiry');
    if (!mailMenu) mailMenu = buildMailMenu();

    mailMenu.setAttribute('data-email', email);
    mailMenu.querySelector('[data-kind="gmail"]').href =
      'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) + '&su=' + subject;
    mailMenu.querySelector('[data-kind="outlook"]').href =
      'https://outlook.live.com/mail/0/deeplink/compose?to=' + encodeURIComponent(email) + '&subject=' + subject;
    mailMenu.querySelector('[data-kind="app"]').href = 'mailto:' + email + '?subject=' + subject;
    mailMenu.querySelector('[data-copy-state]').textContent = email;

    mailTrigger = trigger;
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'true');
    mailMenu.hidden = false;
    positionMailMenu(trigger);
    mailMenu.classList.add('is-open');
    mailBackdrop.classList.add('is-open');
    mailMenu.querySelector('[role="menuitem"]').focus({ preventScroll: true });
  }

  function closeMailMenu(restoreFocus) {
    if (!mailMenu || mailMenu.hidden) return;
    mailMenu.classList.remove('is-open');
    mailBackdrop.classList.remove('is-open');
    mailMenu.hidden = true;
    if (mailTrigger) {
      mailTrigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus !== false) mailTrigger.focus({ preventScroll: true });
    }
    mailTrigger = null;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="mailto:"]');
    if (link && !(mailMenu && mailMenu.contains(link))) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var same = mailTrigger === link && mailMenu && !mailMenu.hidden;
      closeMailMenu(false);
      if (!same) openMailMenu(link);
      return;
    }
    if (mailMenu && !mailMenu.hidden && !mailMenu.contains(e.target)) closeMailMenu(false);
  });
  document.addEventListener('pointerdown', function (e) {
    if (!mailMenu || mailMenu.hidden) return;
    if (mailMenu.contains(e.target) || (mailTrigger && mailTrigger.contains(e.target))) return;
    closeMailMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMailMenu();
  });
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    // Mobile browsers fire resize when the address bar collapses; only react to real width changes.
    if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; closeMailMenu(false); }
  });
  window.addEventListener('scroll', function () {
    if (mailMenu && !mailMenu.hidden && mailTrigger) positionMailMenu(mailTrigger);
  }, { passive: true });
});
