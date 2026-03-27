/**
 * StudyHub — Main JavaScript
 * Features: hamburger nav, page search, TOC auto-gen,
 *           scroll-to-top, smooth scroll, FAQ toggle,
 *           active nav, visit counter
 */

(function () {
  'use strict';

  /* ── 1. DOM Ready helper ─────────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  /* ── 2. Hamburger / Mobile Navigation ───────────────────── */
  function initHamburger() {
    var btn    = document.querySelector('.hamburger');
    var mobileNav = document.querySelector('.mobile-nav');
    if (!btn || !mobileNav) return;

    btn.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen);
      // Prevent body scroll when nav is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close when a link inside mobile nav is clicked
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── 3. Page-level Search & Text Highlighting ────────────── */
  function initSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;

    var debounceTimer;

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var query = this.value.trim();
      debounceTimer = setTimeout(function () {
        clearHighlights();
        if (query.length >= 2) {
          highlightText(query.toLowerCase());
        }
      }, 200);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = this.value.trim();
        if (q) {
          window.location.href = 'search.html?q=' + encodeURIComponent(q);
        }
      }
      if (e.key === 'Escape') {
        this.value = '';
        clearHighlights();
      }
    });
  }

  function highlightText(query) {
    var root = document.querySelector('.container') || document.body;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
    }

    nodes.forEach(function (n) {
      var parent = n.parentNode;
      if (!parent) return;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'MARK') return;

      var text = n.nodeValue;
      var lc   = text.toLowerCase();
      var idx  = lc.indexOf(query);
      if (idx < 0) return;

      var frag = document.createDocumentFragment();
      var pos  = 0;
      while (idx !== -1) {
        frag.appendChild(document.createTextNode(text.slice(pos, idx)));
        var mark = document.createElement('mark');
        mark.className = 'highlight';
        mark.textContent = text.slice(idx, idx + query.length);
        frag.appendChild(mark);
        pos = idx + query.length;
        idx = lc.indexOf(query, pos);
      }
      frag.appendChild(document.createTextNode(text.slice(pos)));
      parent.replaceChild(frag, n);
    });

    // Scroll to first match
    var first = document.querySelector('mark.highlight');
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearHighlights() {
    document.querySelectorAll('mark.highlight').forEach(function (el) {
      var parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
  }

  /* ── 4. Table of Contents Auto-Generator ─────────────────── */
  function initTOC() {
    var tocList = document.getElementById('toc-list');
    if (!tocList) return;

    var content = document.querySelector('.main-content') || document.querySelector('.content-section');
    if (!content) return;

    var headings = content.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    var fragment = document.createDocumentFragment();

    headings.forEach(function (h, i) {
      if (!h.id) {
        h.id = 'heading-' + i;
      }
      var li = document.createElement('li');
      var a  = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      if (h.tagName === 'H3') {
        a.classList.add('toc-h3');
      }
      li.appendChild(a);
      fragment.appendChild(li);
    });

    tocList.appendChild(fragment);

    // Highlight active heading on scroll
    var links = tocList.querySelectorAll('a');
    var headingEls = Array.from(headings);

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY + 80;
      var active  = headingEls[0];

      headingEls.forEach(function (h) {
        if (h.offsetTop <= scrollY) active = h;
      });

      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + active.id);
      });
    }, { passive: true });
  }

  /* ── 5. Scroll-to-Top Button ─────────────────────────────── */
  function initScrollTop() {
    var btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.innerHTML = '&#8679;';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.setAttribute('title', 'Back to top');
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 420);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 6. Smooth Scroll for Anchor Links ───────────────────── */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      var href = anchor.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var navHeight = 70;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  /* ── 7. FAQ Accordion ────────────────────────────────────── */
  function initFAQ() {
    document.addEventListener('click', function (e) {
      var question = e.target.closest('.faq-question');
      if (!question) return;

      var answer  = question.nextElementSibling;
      var icon    = question.querySelector('.faq-icon');
      var isOpen  = answer && answer.classList.contains('open');

      // Close all open items
      document.querySelectorAll('.faq-answer.open').forEach(function (a) {
        a.classList.remove('open');
        var prevIcon = a.previousElementSibling.querySelector('.faq-icon');
        if (prevIcon) {
          prevIcon.textContent = '+';
          prevIcon.classList.remove('rotated');
        }
      });

      if (!isOpen && answer) {
        answer.classList.add('open');
        if (icon) {
          icon.textContent = '×';
          icon.classList.add('rotated');
        }
      }
    });
  }

  /* ── 8. Active Nav Link ───────────────────────────────────── */
  function initActiveNav() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';

    document.querySelectorAll('nav a, .mobile-nav a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      // Match by filename
      if (href === page || href.endsWith('/' + page)) {
        link.classList.add('active');
      }
    });
  }

  /* ── 9. Page Visit Counter (localStorage) ────────────────── */
  function initVisitCounter() {
    try {
      var page = window.location.pathname.split('/').pop() || 'index';
      var key  = 'sh_visits_' + page;
      var visits = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, visits);

      var el = document.getElementById('visit-count');
      if (el) {
        el.textContent = visits.toLocaleString();
      }
    } catch (e) {
      // localStorage may be unavailable in some environments
    }
  }

  /* ── 10. Lazy-load images (IntersectionObserver) ─────────── */
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });

    document.querySelectorAll('img[data-src]').forEach(function (img) {
      observer.observe(img);
    });
  }

  /* ── 11. Copy Formula Button ─────────────────────────────── */
  function initCopyFormulas() {
    document.querySelectorAll('.formula-box, .formula-expr').forEach(function (box) {
      box.style.cursor = 'pointer';
      box.title = 'Click to copy';
      box.addEventListener('click', function () {
        var text = box.textContent.trim();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            showToast('Copied: ' + text);
          });
        }
      });
    });
  }

  /* ── 12. Toast Notification ──────────────────────────────── */
  function showToast(message) {
    var existing = document.querySelector('.sh-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'sh-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1e3a5f',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '24px',
      fontSize: '0.88rem',
      zIndex: '9999',
      boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      maxWidth: '80vw',
      textAlign: 'center',
      pointerEvents: 'none'
    });
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = '1';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 400);
    }, 2400);
  }

  /* ── 13. Search from URL param on page load ──────────────── */
  function initURLSearch() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q) {
      var input = document.getElementById('searchInput');
      if (input) {
        input.value = q;
        highlightText(q.toLowerCase());
      }
    }
  }

  /* ── 14. Animate stats numbers on scroll ─────────────────── */
  function initCountUp() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el     = entry.target;
        var target = parseInt(el.getAttribute('data-target') || el.textContent.replace(/\D/g, ''), 10);
        var suffix = el.getAttribute('data-suffix') || el.textContent.replace(/[\d,]/g, '');
        if (!target) return;

        var start    = 0;
        var duration = 1200;
        var step     = (target / duration) * 16;

        var timer = setInterval(function () {
          start += step;
          if (start >= target) {
            start = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(start).toLocaleString() + suffix;
        }, 16);

        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.num[data-target], .s-num[data-target]').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── Init All ────────────────────────────────────────────── */
  ready(function () {
    initHamburger();
    initSearch();
    initTOC();
    initScrollTop();
    initSmoothScroll();
    initFAQ();
    initActiveNav();
    initVisitCounter();
    initLazyImages();
    initCopyFormulas();
    initURLSearch();
    initCountUp();
  });

})();
