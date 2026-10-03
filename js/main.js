window.__appReady = true;

document.addEventListener('DOMContentLoaded', function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var ICONS = 'images/icons.svg';

  // Footer year
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Theme toggle ----------
  var themeToggle = document.getElementById('theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#09090b' : '#f3f3f5');
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

  // ---------- Scroll state without scroll listeners ----------
  // Zero-height sentinels are observed instead: the header gets its background once the
  // top sentinel scrolls out, and back-to-top appears once the "fold" sentinel is passed.
  // (The reading-progress bar is a CSS scroll-driven animation, no JS at all.)
  var backToTop = document.getElementById('back-to-top');

  function watchPassed(id, onChange) {
    var el = document.getElementById(id);
    if (!el || !hasIO) return;
    new IntersectionObserver(function (entries) {
      var entry = entries[entries.length - 1];
      onChange(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(el);
  }
  watchPassed('sentinel-top', function (passed) {
    if (header) header.classList.toggle('is-scrolled', passed);
  });
  watchPassed('sentinel-fold', function (passed) {
    if (backToTop) backToTop.classList.toggle('is-visible', passed);
  });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // ---------- Reveal on scroll ----------
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (hasIO && !reduceMotion) {
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

  // ---------- Scrollspy (home page): a thin band at ~40% of the viewport decides the section ----------
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a.nav-link[href^="#"]'));
  if (spyLinks.length && hasIO) {
    var spyBand = null;
    var footerVisible = false;
    var paintSpy = function () {
      var current = footerVisible ? 'contact' : spyBand; // the page end always belongs to "Contact"
      spyLinks.forEach(function (link) {
        link.classList.toggle('is-current', link.getAttribute('href') === '#' + current);
      });
    };
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && spyBand === entry.target.id) spyBand = null;
      });
      entries.forEach(function (entry) {
        if (entry.isIntersecting) spyBand = entry.target.id;
      });
      paintSpy();
    }, { rootMargin: '-40% 0px -55% 0px' });
    spyLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) spyObserver.observe(section);
    });
    var footer = document.querySelector('.site-footer');
    if (footer) {
      new IntersectionObserver(function (entries) {
        footerVisible = entries[entries.length - 1].isIntersecting;
        paintSpy();
      }).observe(footer);
    }
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

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="' + ICONS + '#i-' + name + '"/></svg>';
  }

  function categoryLabel(category) {
    return category === 'android' ? 'Android' : category === 'web' ? 'Web' : category.charAt(0).toUpperCase() + category.slice(1);
  }

  function projectTile(project, i) {
    var category = String(project.category || 'project').toLowerCase();
    var url = safeUrl(project.url);
    var isGithub = /^https?:\/\/(www\.)?github\.com/i.test(url);
    var media = project.image
      ? '<img src="' + escapeHtml(project.image) + '" alt="' + escapeHtml(project.imageAlt || '') + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '" decoding="async" width="1280" height="800" />'
      : '<div class="tile-fallback">' + icon(category === 'android' ? 'device-mobile' : 'browser') + '</div>';
    var meta = categoryLabel(category) + (project.featured ? ', featured' : '');

    return (
      '<article class="tile" style="animation-delay:' + (i * 80) + 'ms">' +
        '<div class="tile-media">' + media + '</div>' +
        '<div class="tile-body">' +
          '<p class="tile-meta">' + escapeHtml(meta) + '</p>' +
          '<h3>' + escapeHtml(project.title) + '</h3>' +
          '<p>' + escapeHtml(project.description) + '</p>' +
          '<p class="tile-stack">' + escapeHtml((project.stack || []).join(', ')) + '</p>' +
          '<a class="link-arrow" href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' +
            (isGithub ? 'View on GitHub' : 'View project') + icon('arrow-up-right') +
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
    projectsList.setAttribute('aria-busy', 'false');
    if (!list.length) {
      projectsList.className = 'projects-grid';
      projectsList.innerHTML =
        '<div class="projects-state"><p>No projects in this category yet.</p>' +
        '<button class="btn btn-secondary btn-sm" type="button" data-show-all>Show all projects</button></div>';
      return;
    }
    projectsList.className = 'projects-grid layout-' + Math.min(list.length, 3);
    projectsList.innerHTML = list.map(projectTile).join('');
  }

  function setFilter(filter) {
    filterButtons.forEach(function (b) {
      var active = (b.getAttribute('data-filter') || 'all').toLowerCase() === filter;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    renderProjects(filter);
  }

  if (projectsList) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setFilter((btn.getAttribute('data-filter') || 'all').toLowerCase());
      });
    });
    projectsList.addEventListener('click', function (e) {
      if (e.target.closest('[data-show-all]')) setFilter('all');
    });

    fetch('data/projects.json')
      .then(function (res) { if (!res.ok) throw new Error('Request failed'); return res.json(); })
      .then(function (data) { projectsData = Array.isArray(data) ? data : []; renderProjects('all'); })
      .catch(function () {
        projectsList.setAttribute('aria-busy', 'false');
        projectsList.className = 'projects-grid';
        projectsList.innerHTML = '<div class="projects-state"><p>Projects could not be loaded. Please refresh the page to try again.</p></div>';
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
        copyBtn.setAttribute('aria-label', 'Email address copied');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          copyBtn.setAttribute('aria-label', 'Copy email address');
        }, 2000);
      }, function () {
        // Clipboard blocked: open the email menu instead so the address is never a dead end.
        openMailMenu(copyBtn);
      });
    });
  }

  // ---------- Email menu ----------
  // A bare mailto: link does nothing on computers without a default mail app, so every
  // email link opens a small menu (Gmail / Outlook / mail app / copy). Without JS it
  // still behaves as a normal mailto: link. On phones it is a bottom sheet (see CSS).
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
          state.textContent = 'copied';
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

  // The popover is positioned in page coordinates, so it scrolls with the page and
  // never needs repositioning (no scroll listener).
  function positionMailMenu(trigger) {
    var r = trigger.getBoundingClientRect();
    var mw = mailMenu.offsetWidth;
    var mh = mailMenu.offsetHeight;
    var gap = 10;
    var vw = document.documentElement.clientWidth;
    var left = Math.min(Math.max(12, r.left), vw - mw - 12);
    var below = window.innerHeight - r.bottom;
    var top = below >= mh + gap + 12 ? r.bottom + gap : Math.max(12, r.top - mh - gap);
    mailMenu.style.left = (left + window.pageXOffset) + 'px';
    mailMenu.style.top = (top + window.pageYOffset) + 'px';
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
});
