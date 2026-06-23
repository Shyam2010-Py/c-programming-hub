/* ==============================
   SYNTAX / CHEAT SHEET — VANILLA JS
   - Copy buttons (code blocks + keywords)
   - Global search with highlighting
   ============================== */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        initCopyButtons();
        initSearch();
    });

    /* ---------- COPY BUTTONS ---------- */
    function initCopyButtons() {
        var copyButtons = document.querySelectorAll('.copy-btn');

        copyButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var wrap = btn.closest('.code-block-wrap') || btn.closest('.kw-card');
                if (!wrap) return;

                var text = extractText(wrap, btn);
                copyToClipboard(text).then(function (ok) {
                    if (ok) {
                        showCopied(btn);
                        showToast('Copied!');
                    } else {
                        showToast('Copy failed');
                    }
                });
            });
        });

        // Mini copy buttons inside keyword cards
        var miniButtons = document.querySelectorAll('.copy-mini');
        miniButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var card = btn.closest('.kw-card');
                if (!card) return;
                var kw = card.querySelector('.kw-name');
                var text = kw ? kw.textContent : '';
                copyToClipboard(text).then(function (ok) {
                    if (ok) {
                        btn.classList.add('copied');
                        btn.textContent = '✓';
                        showToast('Copied: ' + text);
                        setTimeout(function () {
                            btn.classList.remove('copied');
                            btn.textContent = '📋';
                        }, 1500);
                    }
                });
            });
        });

        // Also allow clicking the keyword card itself to copy
        var kwCards = document.querySelectorAll('.kw-card');
        kwCards.forEach(function (card) {
            card.addEventListener('click', function (e) {
                // Skip if clicking the mini button
                if (e.target.closest('.copy-mini')) return;
                var kw = card.querySelector('.kw-name');
                if (!kw) return;
                copyToClipboard(kw.textContent).then(function () {
                    showToast('Copied: ' + kw.textContent);
                    card.style.transition = 'transform 0.15s';
                    card.style.transform = 'scale(0.97)';
                    setTimeout(function () {
                        card.style.transform = '';
                        setTimeout(function () { card.style.transition = ''; }, 150);
                    }, 120);
                });
            });
        });
    }

    function extractText(wrap, btn) {
        // For code blocks, get text from <pre><code>
        var pre = wrap.querySelector('pre code') || wrap.querySelector('pre') || wrap.querySelector('code');
        if (pre) return pre.innerText.replace(/^\s+|\s+$/g, '');
        return wrap.innerText.replace(/^\s+|\s+$/g, '');
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
        } catch (e) { return false; }
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

    /* ---------- TOAST ---------- */
    var toastTimer;
    function showToast(msg) {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 1800);
    }

    /* ---------- SEARCH ---------- */
    function initSearch() {
        var input = document.getElementById('cheatSearch');
        var clearBtn = document.getElementById('searchClear');
        var countEl = document.getElementById('searchCount');
        var noResults = document.getElementById('noResults');

        if (!input) return;

        var sections = Array.from(document.querySelectorAll('.cheat-section'));
        var kwCards = Array.from(document.querySelectorAll('.kw-card'));
        var tableRows = Array.from(document.querySelectorAll('.cheat-table tbody tr'));

        // Pre-build searchable index per section
        var sectionIndex = sections.map(function (sec) {
            return {
                el: sec,
                title: (sec.getAttribute('data-title') || '').toLowerCase(),
                text: ''
            };
        });

        // Build section text lazily on first search
        var textBuilt = false;
        function buildText() {
            if (textBuilt) return;
            sectionIndex.forEach(function (s) {
                s.text = s.el.textContent.toLowerCase();
            });
            textBuilt = true;
        }

        var debounce;
        input.addEventListener('input', function () {
            clearTimeout(debounce);
            debounce = setTimeout(filter, 80);
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                input.value = '';
                input.focus();
                filter();
            });
        }

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.value = '';
                filter();
                input.blur();
            }
        });

        function filter() {
            buildText();
            var query = input.value.trim().toLowerCase();
            var visibleSections = 0;
            var visibleKeywords = 0;
            var visibleRows = 0;

            // Clear button visibility
            if (query.length > 0) {
                clearBtn.classList.add('visible');
            } else {
                clearBtn.classList.remove('visible');
            }

            // Filter sections
            sectionIndex.forEach(function (s) {
                if (query === '') {
                    s.el.classList.remove('hidden-section');
                    visibleSections++;
                } else {
                    var match = s.title.indexOf(query) !== -1 || s.text.indexOf(query) !== -1;
                    if (match) {
                        s.el.classList.remove('hidden-section');
                        visibleSections++;
                        if (query.length >= 2) highlightInElement(s.el, query);
                        else removeHighlights(s.el);
                    } else {
                        s.el.classList.add('hidden-section');
                        removeHighlights(s.el);
                    }
                }
            });

            // Filter keyword cards
            kwCards.forEach(function (card) {
                var name = card.querySelector('.kw-name');
                var desc = card.querySelector('.kw-desc');
                var haystack = ((name ? name.textContent : '') + ' ' + (desc ? desc.textContent : '')).toLowerCase();
                var match = query === '' || haystack.indexOf(query) !== -1;
                if (match) {
                    card.classList.remove('hidden-kw');
                    visibleKeywords++;
                } else {
                    card.classList.add('hidden-kw');
                }
            });

            // Filter table rows
            tableRows.forEach(function (row) {
                var text = row.textContent.toLowerCase();
                var match = query === '' || text.indexOf(query) !== -1;
                if (match) {
                    row.style.display = '';
                    visibleRows++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Update counter
            if (countEl) {
                if (query === '') {
                    countEl.textContent = sections.length + ' topics';
                } else {
                    countEl.textContent = visibleSections + ' / ' + sections.length + ' match';
                }
            }

            // No results state
            if (noResults) {
                if (query !== '' && visibleSections === 0 && visibleKeywords === 0) {
                    noResults.hidden = false;
                } else {
                    noResults.hidden = true;
                }
            }

            // Smooth scroll to first match if user pressed enter
            if (query !== '' && document.activeElement === input) {
                // don't auto-scroll on each input
            }
        }
    }

    /* ---------- HIGHLIGHTING ---------- */
    function highlightInElement(container, query) {
        removeHighlights(container);
        if (!query || query.length < 2) return;

        // Walk text nodes, skip code/pre/mark and tables (to avoid messing with row data)
        var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.parentElement) return NodeFilter.FILTER_REJECT;
                var p = node.parentElement;
                var tag = p.tagName;
                if (tag === 'CODE' || tag === 'PRE' || tag === 'MARK' ||
                    p.classList.contains('code-block-wrap') ||
                    p.classList.contains('code') ||
                    p.classList.contains('output') ||
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
        try { regex = new RegExp('(' + escapeRegex(query) + ')', 'gi'); }
        catch (e) { return; }

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
