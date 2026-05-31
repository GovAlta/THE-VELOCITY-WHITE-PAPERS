/* a11y.js — shared accessibility helpers.
   Loaded before any other component scripts.

   Exposes on window.VWA11y:
     announce(message, priority='polite')   — sends a string to the global
                                               live region #vw-announce
     trapFocus(rootEl, returnFocusEl)       — locks Tab inside rootEl until
                                               release() is called; on release,
                                               focus returns to returnFocusEl
     focusableSelector                      — selector string for focusable
                                               descendants of a container
*/

(function () {
  const W = window;
  W.VWA11y = W.VWA11y || {};

  W.VWA11y.focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    'iframe',
    'object',
    'embed',
    '[contenteditable]:not([contenteditable="false"])',
  ].join(',');

  /* Announce a message to assistive technology via the global live region.
     Idempotent if the region doesn't exist yet (degrades silently). */
  W.VWA11y.announce = function (message, priority) {
    const el = document.getElementById('vw-announce');
    if (!el) return;
    el.setAttribute('aria-live', priority === 'assertive' ? 'assertive' : 'polite');
    /* Clear then set so identical successive messages still fire. */
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = String(message || ''); });
  };

  /* Lock keyboard focus inside rootEl. Returns a release function that:
       - removes the keydown handler,
       - returns focus to returnFocusEl (or the previously-focused element). */
  W.VWA11y.trapFocus = function (rootEl, returnFocusEl) {
    if (!rootEl) return () => {};
    const previousActive = returnFocusEl || document.activeElement;

    function getFocusables() {
      return Array.from(rootEl.querySelectorAll(W.VWA11y.focusableSelector))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    function onKeydown(e) {
      if (e.key !== 'Tab') return;
      const list = getFocusables();
      if (list.length === 0) { e.preventDefault(); return; }
      const first = list[0];
      const last  = list[list.length - 1];
      const cur   = document.activeElement;
      if (e.shiftKey) {
        if (cur === first || !rootEl.contains(cur)) { e.preventDefault(); last.focus(); }
      } else {
        if (cur === last  || !rootEl.contains(cur)) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', onKeydown, true);

    /* Move initial focus into the trap if not already there. */
    requestAnimationFrame(() => {
      if (!rootEl.contains(document.activeElement)) {
        const list = getFocusables();
        if (list.length) list[0].focus();
      }
    });

    return function release() {
      document.removeEventListener('keydown', onKeydown, true);
      if (previousActive && typeof previousActive.focus === 'function') {
        try { previousActive.focus(); } catch {}
      }
    };
  };

  /* Convenience: wire ESC-to-close onto an element while it's open.
     Pass a callback that closes the dialog. Returns a release function. */
  W.VWA11y.onEsc = function (handler) {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); handler(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  };
})();
