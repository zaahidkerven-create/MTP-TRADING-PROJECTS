(function () {
  'use strict';

  var WA = '27763650195';

  // Header turns opaque once the hero starts scrolling away.
  var header = document.getElementById('site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  var menuBtn = document.getElementById('menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    var setOpen = function (open) {
      mobileNav.classList.toggle('is-open', open);
      menuBtn.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function () {
      setOpen(!mobileNav.classList.contains('is-open'));
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) setOpen(false);
    });
  }

  // Quote form hands off to WhatsApp — the way this business takes enquiries.
  var form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      var name = val('name');
      var phone = val('phone');
      var status = document.getElementById('form-status');

      if (!name || !phone) {
        if (status) {
          status.textContent = 'Please provide a name and telephone number so that we can respond.';
          status.hidden = false;
        }
        (name ? document.getElementById('phone') : document.getElementById('name')).focus();
        return;
      }
      if (status) status.hidden = true;

      var lines = [
        'Good day. I would like to request a quotation from MTP Trading & Projects.',
        '',
        'Name: ' + name,
        'Telephone: ' + phone,
        'Property: ' + (val('vehicle') || 'Not given'),
        'Service required: ' + val('jobtype')
      ];
      var details = val('details');
      if (details) lines.push('Description of works: ' + details);

      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveals. rootMargin pulls the trigger line up from the bottom edge so
  // items animate as they enter rather than after they've already been read —
  // a smaller bite on short viewports, where 40px is most of the fold.
  var targets = document.querySelectorAll(
    '.reveal, .reveal-media, .reveal-mask, .reveal-group, .reveal-left, .reveal-right, .reveal-draw'
  );
  if (targets.length) {
    var bottomMargin = window.innerHeight < 700 ? -30 : -80;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
          // threshold 0, not a percentage: a percentage is measured against the
      // element's own height, so a very tall group (a 24-tile gallery) can need
      // more of itself on screen than a short viewport can ever show, and never
      // fires at all. rootMargin alone decides when it triggers.
    }, { threshold: 0, rootMargin: '0px 0px ' + bottomMargin + 'px 0px' });
    targets.forEach(function (el) {
      if (!el.classList.contains('reveal-late')) io.observe(el);
    });

    // Anything marked .reveal-late also waits for the reader to actually scroll.
    // Visibility alone is not enough for a block that sits at the bottom edge of
    // a full-height hero: it is already on screen at load, so it would appear
    // immediately, which is exactly what it is meant not to do.
    // Holding content back until you scroll is a phone behaviour: there the
    // block sits just below a full-height hero. On a laptop the whole hero and
    // everything under it is visible at once, so it should simply be there.
    var lateEls = window.matchMedia('(max-width: 767px)').matches
      ? Array.prototype.slice.call(document.querySelectorAll('.reveal-late'))
      : [];
    if (!lateEls.length) {
      document.querySelectorAll('.reveal-late').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
    if (lateEls.length) {
      var scrolled = window.scrollY > 40;
      var pending = [];

      var lateIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (scrolled) {
            entry.target.classList.add('is-visible');
            lateIO.unobserve(entry.target);
          } else if (pending.indexOf(entry.target) === -1) {
            pending.push(entry.target);
          }
        });
      }, { threshold: 0.35 });
      lateEls.forEach(function (el) { lateIO.observe(el); });

      if (!scrolled) {
        var onFirstScroll = function () {
          if (window.scrollY <= 40) return;
          scrolled = true;
          window.removeEventListener('scroll', onFirstScroll);
          pending.forEach(function (el) {
            el.classList.add('is-visible');
            lateIO.unobserve(el);
          });
          pending.length = 0;
        };
        window.addEventListener('scroll', onFirstScroll, { passive: true });
      }
    }

    // Safety net. An element that was display:none when it was first observed —
    // or one whose layout settles late, after fonts and images land — can end up
    // on screen while still marked hidden, and the observer has no reason to
    // fire again. Sweep once the page has settled and reveal anything visible.
    var sweep = function () {
      var vh = window.innerHeight;
      targets.forEach(function (el) {
        if (el.classList.contains('is-visible')) return;
        if (el.classList.contains('reveal-late')) return;
        var r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.top < vh && r.bottom > 0) {
          el.classList.add('is-visible');
        }
      });
    };
    window.addEventListener('load', function () { setTimeout(sweep, 400); });
    window.addEventListener('resize', function () { setTimeout(sweep, 300); });
  }

  // Pinned horizontal scroll.
  //
  // The section is made tall enough that scrolling through it equals the track's
  // horizontal overflow, so the row slides left at a natural 1:1 rate.
  //
  // Two drivers. Where the browser has scroll-driven animations, CSS runs the
  // slide on the compositor and this code only measures. Everywhere else a rAF
  // loop drives it — but a CONTINUOUS loop that samples window.scrollY every
  // frame, not one started by scroll events. That distinction is the whole
  // ballgame on iOS: during momentum scrolling Safari fires scroll events in
  // sparse bursts, so an event-driven loop updates a few times a second and the
  // row lurches. scrollY itself is accurate every frame, so reading it from a
  // free-running rAF tracks the finger properly.
  var hsections = Array.prototype.slice.call(document.querySelectorAll('[data-hscroll]'));
  var hasTimeline = CSS && CSS.supports && CSS.supports('animation-timeline: view()');

  if (hsections.length && !reduceMotion) {
    var rigs = [];

    var measure = function () {
      var vw = window.innerWidth;
      rigs = [];

      hsections.forEach(function (section) {
        var pin = section.querySelector('.hscroll-pin');
        var track = section.querySelector('.hscroll-track');
        if (!pin || !track) return;

        section.classList.remove('is-pinned', 'has-timeline');
        section.style.height = '';
        section.style.removeProperty('--hs-distance');
        track.style.transform = '';

        // Sections marked "mobile" stay a normal grid on wider screens.
        if (section.getAttribute('data-hscroll') === 'mobile' && vw >= 768) return;

        // Measure to the last card's right edge rather than using scrollWidth:
        // on an overflowing flex container scrollWidth leaves out the trailing
        // padding, which stops the run short and leaves the last card hanging
        // off the screen.
        var last = track.lastElementChild;
        if (!last) return;
        var padRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
        var trackLeft = track.getBoundingClientRect().left;
        var contentRight = last.getBoundingClientRect().right - trackLeft;
        var distance = Math.ceil(contentRight + padRight - pin.clientWidth);

        // Under ~120px of travel the pin costs more than it shows.
        if (distance < 120) return;

        section.classList.add('is-pinned');
        // Before this runs the pin is a snapping scroll container, and the
        // browser may already have snapped it sideways. That scrollLeft
        // survives the switch to overflow:hidden and offsets everything.
        pin.scrollLeft = 0;
        // Measure the pin itself rather than window.innerHeight. The pin is
        // 100svh, which stays put when a phone's address bar slides in and out;
        // innerHeight does not, and a section height that changes mid-scroll is
        // what makes the page lurch when you scroll back up.
        var pinH = pin.getBoundingClientRect().height;
        section.style.height = (pinH + distance) + 'px';
        section.style.setProperty('--hs-distance', distance + 'px');

        if (hasTimeline) {
          section.classList.add('has-timeline');
          return;                         // CSS drives it from here
        }

        rigs.push({
          section: section,
          track: track,
          bar: section.querySelector('.hscroll-progress i'),
          distance: distance,
          top: section.getBoundingClientRect().top + window.scrollY,
          height: pinH + distance,
          applied: -1
        });
      });
    };

    measure();

    if (!hasTimeline) {
      // Free-running loop. It idles cheaply when no pinned section is near the
      // viewport, and never reads layout — all geometry is cached by measure().
      var tick = function () {
        var y = window.scrollY;
        var vh = window.innerHeight;
        for (var i = 0; i < rigs.length; i++) {
          var r = rigs[i];
          if (y + vh < r.top || y > r.top + r.height) {
            // Park it at whichever end it left from, then skip.
            var park = y < r.top ? 0 : r.distance;
            if (r.applied !== park) {
              r.track.style.transform = 'translate3d(' + -park + 'px,0,0)';
              if (r.bar) r.bar.style.width = (park / r.distance * 100).toFixed(1) + '%';
              r.applied = park;
            }
            continue;
          }
          var p = (y - r.top) / r.distance;
          p = p < 0 ? 0 : p > 1 ? 1 : p;
          var x = Math.round(p * r.distance);
          if (x !== r.applied) {
            r.track.style.transform = 'translate3d(' + -x + 'px,0,0)';
            if (r.bar) r.bar.style.width = (p * 100).toFixed(1) + '%';
            r.applied = x;
          }
        }
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    }

    // On a phone, showing or hiding the address bar fires resize with the same
    // width. Re-measuring there would resize every pinned section underneath
    // the reader mid-scroll, so only width changes and orientation count.
    var lastWidth = window.innerWidth;
    var resizeTimer;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    });
    window.addEventListener('orientationchange', function () {
      lastWidth = window.innerWidth;
      setTimeout(measure, 200);
    });
    // Late-loading images change the track width, so re-measure once settled.
    window.addEventListener('load', measure);
  }

  // Stat figures count up the first time they scroll into view.
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
      var suffix = el.getAttribute('data-count-suffix') || '';
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      var duration = 1100;
      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }
})();
