/* ==============================
   LEARN PAGE — VANILLA JS
   - Accordion lessons
   - Live search filter
   ============================== */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        initAccordion();
        initSearch();
    });

    /* ---------- ACCORDION ---------- */
    function initAccordion() {
        var headers = document.querySelectorAll('.lesson-header');

        headers.forEach(function (header) {
            header.addEventListener('click', function () {
                var card = header.closest('.lesson-card');

                // Locked lessons — do not expand
                if (card.classList.contains('locked')) {
                    flashLocked(card);
                    return;
                }

                var isOpen = card.classList.contains('open');

                // Close all other lessons (single-open accordion)
                document.querySelectorAll('.lesson-card.open').forEach(function (other) {
                    if (other !== card) {
                        other.classList.remove('open');
                        var btn = other.querySelector('.lesson-header');
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current
                card.classList.toggle('open', !isOpen);
                header.setAttribute('aria-expanded', String(!isOpen));

                // Smooth scroll into view when opening
                if (!isOpen) {
                    setTimeout(function () {
                        var rect = card.getBoundingClientRect();
                        if (rect.top < 80 || rect.top > window.innerHeight - 100) {
                            var top = card.offsetTop - 90;
                            window.scrollTo({ top: top, behavior: 'smooth' });
                        }
                    }, 250);
                }
            });
        });
    }

    /* ---------- LOCKED FEEDBACK ---------- */
    function flashLocked(card) {
        card.style.transition = 'transform 0.1s, box-shadow 0.1s';
        card.style.transform = 'translateX(-4px)';
        card.style.boxShadow = '0 0 0 1px var(--warning-amber)';
        setTimeout(function () {
            card.style.transform = 'translateX(4px)';
        }, 80);
        setTimeout(function () {
            card.style.transform = '';
            card.style.boxShadow = '';
            setTimeout(function () {
                card.style.transition = '';
            }, 120);
        }, 160);
    }

    /* ---------- SEARCH ---------- */
    function initSearch() {
        var input = document.getElementById('lessonSearch');
        var clearBtn = document.getElementById('searchClear');
        var countEl = document.getElementById('searchCount');
        var noResults = document.getElementById('noResults');
        var lessons = document.querySelectorAll('.lesson-card');
        var total = lessons.length;

        if (!input || lessons.length === 0) return;

        function filter() {
            var query = input.value.trim().toLowerCase();
            var visible = 0;

            // Toggle clear button
            if (query.length > 0) {
                clearBtn.classList.add('visible');
            } else {
                clearBtn.classList.remove('visible');
            }

            lessons.forEach(function (card) {
                var titleEl = card.querySelector('h3');
                var keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
                var title = titleEl ? titleEl.textContent.toLowerCase() : '';

                // Also search inside lesson body content
                var bodyText = '';
                var body = card.querySelector('.lesson-body');
                if (body) bodyText = body.textContent.toLowerCase();

                var haystack = title + ' ' + keywords + ' ' + bodyText;
                var match = query === '' || haystack.indexOf(query) !== -1;

                if (match) {
                    card.classList.remove('hidden');
                    visible++;
                    // Highlight inside lesson body when searching
                    if (query.length >= 2 && body) {
                        highlightInElement(body, query);
                    } else if (body) {
                        removeHighlights(body);
                    }
                } else {
                    card.classList.add('hidden');
                    if (body) removeHighlights(body);
                }
            });

            // Update count display
            if (query === '') {
                countEl.textContent = total + ' lessons';
            } else {
                countEl.textContent = visible + ' / ' + total + ' match';
            }

            // Toggle no-results message
            if (noResults) {
                if (visible === 0 && query !== '') {
                    noResults.hidden = false;
                } else {
                    noResults.hidden = true;
                }
            }
        }

        // Debounced input listener
        var debounce;
        input.addEventListener('input', function () {
            clearTimeout(debounce);
            debounce = setTimeout(filter, 120);
        });

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                input.value = '';
                input.focus();
                filter();
            });
        }

        // Esc key clears
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.value = '';
                filter();
                input.blur();
            }
        });

        // Initial count
        countEl.textContent = total + ' lessons';
    }

    /* ---------- HIGHLIGHT HELPERS ---------- */
    function highlightInElement(container, query) {
        removeHighlights(container);
        if (!query || query.length < 2) return;

        var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        var nodes = [];
        var node;
        while ((node = walker.nextNode())) {
            // skip code blocks to avoid breaking syntax
            if (node.parentElement && (
                node.parentElement.tagName === 'CODE' ||
                node.parentElement.tagName === 'PRE' ||
                node.parentElement.classList.contains('code') ||
                node.parentElement.classList.contains('output')
            )) return;
            nodes.push(node);
        }

        var regex;
        try {
            regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
        } catch (e) { return; }

        nodes.forEach(function (textNode) {
            var text = textNode.nodeValue;
            if (regex.test(text)) {
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
                textNode.parentNode.replaceChild(frag, textNode);
            }
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
