/* ==============================
   PROGRAMS PAGE — VANILLA JS
   - Live search + highlighting
   - Difficulty filter (shared state)
   - Copy code buttons
   - Smooth scroll helpers
   - Filter chip counters
   ============================== */

(function () {
    'use strict';

    /* ============================================================
       SHARED STATE (IIFE scope — accessible by every function)
       ============================================================ */
    var currentFilter = 'all';
    var allCards = [];
    var allSections = [];
    var cardIndex = [];
    var searchInput = null;
    var clearBtn = null;
    var countEl = null;
    var noResults = null;

    /* ============================================================
       BOOTSTRAP
       ============================================================ */
    document.addEventListener('DOMContentLoaded', function () {
        initCopyButtons();
        initFilterCounts();
        initReferences();
        initCardIndex();
        bindSearchEvents();
        initFilterChips();

        // Initial pass so the UI is in a consistent state on load
        applyFilters();
    });

    /* ============================================================
       DOM REFERENCES
       ============================================================ */
    function initReferences() {
        searchInput = document.getElementById('programSearch');
        clearBtn = document.getElementById('searchClear');
        countEl = document.getElementById('searchCount');
        noResults = document.getElementById('noResults');
    }

    /* ============================================================
       CARD INDEX — built once, used by every filter pass
       ============================================================ */
    function initCardIndex() {
        allCards = Array.from(document.querySelectorAll('.program-card'));
        allSections = Array.from(document.querySelectorAll('.prog-section[data-level]'));

        cardIndex = allCards.map(function (card) {
            return {
                el: card,
                level: card.getAttribute('data-level'),
                keywords: (card.getAttribute('data-keywords') || '').toLowerCase(),
                text: card.textContent.toLowerCase()
            };
        });
    }

    /* ============================================================
       FILTER CHIP COUNTERS
       ============================================================ */
    function initFilterCounts() {
        var counts = { all: 0, beginner: 0, intermediate: 0, advanced: 0, expert: 0 };

        allCards = allCards.length ? allCards : Array.from(document.querySelectorAll('.program-card'));

        allCards.forEach(function (card) {
            counts.all++;
            var level = card.getAttribute('data-level');
            if (counts[level] !== undefined) counts[level]++;
        });

        setChip('chipAllCount', counts.all);
        setChip('chipBeginnerCount', counts.beginner);
        setChip('chipIntermediateCount', counts.intermediate);
        setChip('chipAdvancedCount', counts.advanced);
        setChip('chipExpertCount', counts.expert);
    }

    function setChip(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    /* ============================================================
       SEARCH INPUT EVENTS
       ============================================================ */
    function bindSearchEvents() {
        if (!searchInput) return;

        var debounce;
        searchInput.addEventListener('input', function () {
            clearTimeout(debounce);
            debounce = setTimeout(applyFilters, 80);
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                searchInput.value = '';
                searchInput.focus();
                applyFilters();
            });
        }

        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                searchInput.value = '';
                applyFilters();
                searchInput.blur();
            }
        });
    }

    /* ============================================================
       DIFFICULTY FILTER CHIPS
       ============================================================ */
    function initFilterChips() {
        var chips = document.querySelectorAll('.filter-chips .chip');
        if (!chips.length) return;

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
                currentFilter = chip.getAttribute('data-filter');
                applyFilters();
                scrollToResults();
            });
        });
    }

    /* ============================================================
       APPLY FILTERS — the single source of truth
       Now lives at IIFE scope so EVERY handler can reach it.
       ============================================================ */
    function applyFilters() {
        if (!searchInput) return;

        var query = searchInput.value.trim().toLowerCase();
        var visibleCards = 0;

        // Clear (×) button visibility
        if (clearBtn) {
            if (query.length > 0) clearBtn.classList.add('visible');
            else clearBtn.classList.remove('visible');
        }

        // Per-card evaluation
        cardIndex.forEach(function (c) {
            removeHighlights(c.el);

            var matchFilter = (currentFilter === 'all') || (c.level === currentFilter);
            var matchQuery = true;
            if (query !== '') {
                matchQuery = c.keywords.indexOf(query) !== -1 || c.text.indexOf(query) !== -1;
            }

            if (matchFilter && matchQuery) {
                c.el.classList.remove('hidden-prog');
                visibleCards++;
                if (query.length >= 2) highlightInElement(c.el, query);
            } else {
                c.el.classList.add('hidden-prog');
            }
        });

        // Hide entire section headers when zero cards inside are visible
        allSections.forEach(function (sec) {
            var visibleInSection = sec.querySelectorAll('.program-card:not(.hidden-prog)').length;
            if (visibleInSection === 0) {
                sec.classList.add('hidden-prog');
            } else {
                sec.classList.remove('hidden-prog');
            }
        });

        // Counter
        if (countEl) {
            if (query === '') {
                countEl.textContent = visibleCards + ' programs';
            } else {
                countEl.textContent = visibleCards + ' / ' + cardIndex.length + ' match';
            }
        }

        // No-results panel
        if (noResults) {
            if (visibleCards === 0) {
                noResults.hidden = false;
            } else {
                noResults.hidden = true;
            }
        }
    }

    /* ============================================================
       SMOOTH SCROLL TO RESULTS — subtle UX cue after filter change
       ============================================================ */
    function scrollToResults() {
        var firstVisible = document.querySelector('.program-card:not(.hidden-prog)');
        if (!firstVisible) return;

        // Only scroll if the user is below the search bar already
        var searchRect = document.getElementById('global-search').getBoundingClientRect();
        if (searchRect.bottom < 0) return; // already scrolled past, don't snap back

        var navHeight = 70;
        var top = firstVisible.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    }

    /* ============================================================
       COPY CODE BUTTONS
       ============================================================ */
    function initCopyButtons() {
        var buttons = document.querySelectorAll('.copy-btn');

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var wrap = btn.closest('.code-block-wrap');
                if (!wrap) return;

                var codeEl = wrap.querySelector('pre code') || wrap.querySelector('pre');
                if (!codeEl) return;

                var text = codeEl.innerText.replace(/^\s+|\s+$/g, '');
                copyToClipboard(text).then(function (ok) {
                    if (ok) {
                        showCopied(btn);
                        showToast('✅ Code copied!');
                    } else {
                        showToast('❌ Copy failed');
                    }
                });
            });
        });
    }

    function copyToClipboard(text) {
        if (!text) return Promise.resolve(false);
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(
                function () { return true; },
                function () { return fallbackCopy(text); }
            );
        }
        return Promise.resolve(fallbackCopy(text));
    }

    function fallbackCopy(text) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.top = '-9999px';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (e) {
            return false;
        }
    }

    function showCopied(btn) {
        var original = btn.textContent;
        btn.classList.add('copied');
        btn.textContent = '✓ Copied';
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.textContent = original;
        }, 1500);
    }

    /* ============================================================
       TOAST
       ============================================================ */
    var toastTimer;
    function showToast(msg) {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show', 'toast-success');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 1800);
    }

    /* ============================================================
       HIGHLIGHTING
       ============================================================ */
    function highlightInElement(container, query) {
        removeHighlights(container);
        if (!query || query.length < 2) return;

        var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.parentElement) return NodeFilter.FILTER_REJECT;
                var p = node.parentElement;
                var tag = p.tagName;
                if (tag === 'CODE' || tag === 'PRE' || tag === 'MARK' ||
                    p.classList.contains('code-block-wrap') ||
                    p.classList.contains('prog-output') ||
                    tag === 'SCRIPT' || tag === 'STYLE') {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }, false);

        var nodes = [];
        var n;
        while ((n = walker.nextNode())) nodes.push(n);

        var regex;
        try {
            regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
        } catch (e) {
            return;
        }

        nodes.forEach(function (tn) {
            var text = tn.nodeValue;
            if (!regex.test(text)) return;
            regex.lastIndex = 0;
            var frag = document.createDocumentFragment();
            var last = 0;
            var match;
            while ((match = regex.exec(text)) !== null) {
                frag.appendChild(document.createTextNode(text.slice(last, match.index)));
                var mark = document.createElement('mark');
                mark.className = 'search-mark';
                mark.textContent = match[1];
                frag.appendChild(mark);
                last = regex.lastIndex;
            }
            frag.appendChild(document.createTextNode(text.slice(last)));
            tn.parentNode.replaceChild(frag, tn);
        });
    }

    function removeHighlights(container) {
        var marks = container.querySelectorAll('mark.search-mark');
        marks.forEach(function (m) {
            var text = document.createTextNode(m.textContent);
            m.parentNode.replaceChild(text, m);
        });
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

})();
