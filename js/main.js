/* ==============================
   C PROGRAMMING HUB — MAIN.JS
   Vanilla JS — No Frameworks
   ============================== */

(function () {
    'use strict';

    /* ---------- DOM READY ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        initHamburger();
        initNavbarScroll();
        initActiveLink();
        initScrollReveal();
        initStatCounters();
        initSmoothScroll();
        initDisabledLinks();
    });

    /* ---------- HAMBURGER MENU ---------- */
    function initHamburger() {
        var hamburger = document.getElementById('hamburger');
        var navMenu = document.getElementById('navMenu');

        if (!hamburger || !navMenu) return;

        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        var navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    /* ---------- NAVBAR SCROLL EFFECT ---------- */
    function initNavbarScroll() {
        var navbar = document.getElementById('navbar');
        if (!navbar) return;

        var lastScroll = 0;
        window.addEventListener('scroll', function () {
            var currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    /* ---------- ACTIVE LINK ON SCROLL ---------- */
    function initActiveLink() {
        var sections = document.querySelectorAll('section[id]');
        var navLinks = document.querySelectorAll('.nav-link');

        if (sections.length === 0) return;

        window.addEventListener('scroll', function () {
            var scrollY = window.pageYOffset + 120;

            sections.forEach(function (section) {
                var top = section.offsetTop;
                var height = section.offsetHeight;
                var id = section.getAttribute('id');

                if (scrollY >= top && scrollY < top + height) {
                    navLinks.forEach(function (link) {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { passive: true });
    }

    /* ---------- SCROLL REVEAL ANIMATION ---------- */
    function initScrollReveal() {
        // Elements to animate
        var selectors = [
            '.section-header',
            '.roadmap-card',
            '.feature-card',
            '.why-box',
            '.stat-card',
            '.cta-box',
            '.hero-badge',
            '.hero-title',
            '.hero-subtitle',
            '.hero-buttons',
            '.hero-meta'
        ];

        var elements = document.querySelectorAll(selectors.join(','));

        elements.forEach(function (el) {
            el.classList.add('reveal');
        });

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        // staggered delay for siblings
                        var siblings = entry.target.parentElement
                            ? Array.from(entry.target.parentElement.children).filter(function (c) {
                                return c.classList.contains('reveal');
                            })
                            : [];
                        var idx = siblings.indexOf(entry.target);
                        var delay = idx >= 0 ? Math.min(idx * 80, 400) : 0;

                        setTimeout(function () {
                            entry.target.classList.add('visible');
                        }, delay);

                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.12,
                rootMargin: '0px 0px -50px 0px'
            });

            elements.forEach(function (el) { observer.observe(el); });
        } else {
            // Fallback for old browsers
            elements.forEach(function (el) { el.classList.add('visible'); });
        }
    }

    /* ---------- ANIMATED STAT COUNTERS ---------- */
    function initStatCounters() {
        var statNumbers = document.querySelectorAll('.stat-number');

        if (statNumbers.length === 0) return;

        function animateCounter(el) {
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;
            var duration = 1800;
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);

                // ease-out cubic
                var eased = 1 - Math.pow(1 - progress, 3);
                var current = Math.floor(eased * target);

                el.textContent = current + '+';

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target + '+';
                }
            }

            requestAnimationFrame(step);
        }

        if ('IntersectionObserver' in window) {
            var counterObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            statNumbers.forEach(function (el) { counterObserver.observe(el); });
        } else {
            statNumbers.forEach(function (el) {
                var target = el.getAttribute('data-target') || '0';
                el.textContent = target + '+';
            });
        }
    }

    /* ---------- SMOOTH SCROLL POLYFILL ---------- */
    function initSmoothScroll() {
        var links = document.querySelectorAll('a[href^="#"]');

        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href === '#' || href.length < 2) return;

                var target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();
                var navHeight = 70;
                var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: top,
                    behavior: 'smooth'
                });
            });
        });
    }

    /* ---------- DISABLED / COMING SOON LINKS ---------- */
    function initDisabledLinks() {
        var disabled = document.querySelectorAll('.nav-disabled, [data-soon]');
        var toast = document.getElementById('toast');
        var toastTimer;

        function showToast(msg, type) {
            if (!toast) return;
            // Create toast on the fly if missing (so any page can use it)
            if (!toast.classList.contains('toast')) {
                toast.classList.add('toast');
            }
            toast.textContent = msg;
            toast.classList.remove('toast-success');
            if (type === 'success') toast.classList.add('toast-success');
            toast.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () {
                toast.classList.remove('show');
            }, 2200);
        }

        disabled.forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var msg = el.getAttribute('data-soon') || 'Coming soon';
                showToast('⏳ ' + msg, 'warn');

                // Subtle shake for feedback
                el.style.transition = 'transform 0.12s';
                el.style.transform = 'translateX(-3px)';
                setTimeout(function () { el.style.transform = 'translateX(3px)'; }, 80);
                setTimeout(function () {
                    el.style.transform = '';
                    setTimeout(function () { el.style.transition = ''; }, 120);
                }, 160);
            });
        });
    }

})();
