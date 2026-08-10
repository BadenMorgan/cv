const CANONICAL_URL = "https://badenmorgan.github.io/cv/";

let stashedHtml = null;
let swapActive = false;
let safariTimer = null;
const restoreCallbacks = new Set();

export function registerPrintRestoreCallback(fn) {
  restoreCallbacks.add(fn);
}

function noticeHtml() {
  return `<div class="print-notice print-notice--live" role="status">
    <p>This résumé is not available for printing.</p>
    <p>View online at <strong>${CANONICAL_URL}</strong></p>
  </div>`;
}

function getRoot() {
  return document.getElementById("cv-root");
}

function runRestoreCallbacks() {
  for (const fn of restoreCallbacks) {
    try {
      fn();
    } catch (err) {
      console.error("print restore callback failed", err);
    }
  }
}

function swapToNotice() {
  const root = getRoot();
  if (!root || swapActive) return;
  swapActive = true;
  stashedHtml = root.innerHTML;
  root.innerHTML = noticeHtml();
  root.hidden = false;
}

function restoreFromNotice() {
  const root = getRoot();
  if (!root || !swapActive) return;
  if (stashedHtml !== null) {
    root.innerHTML = stashedHtml;
  }
  swapActive = false;
  stashedHtml = null;
  if (safariTimer) {
    clearTimeout(safariTimer);
    safariTimer = null;
  }
  runRestoreCallbacks();
}

function scheduleSafariFallback() {
  if (safariTimer) clearTimeout(safariTimer);
  safariTimer = setTimeout(() => {
    if (swapActive) restoreFromNotice();
  }, 1000);
}

export function initPrintGuard() {
  window.addEventListener("beforeprint", () => {
    swapToNotice();
    scheduleSafariFallback();
  });

  window.addEventListener("afterprint", () => {
    restoreFromNotice();
  });

  const mq = window.matchMedia("print");
  mq.addEventListener("change", (ev) => {
    if (ev.matches) {
      swapToNotice();
      scheduleSafariFallback();
    } else {
      restoreFromNotice();
    }
  });

  // Links use native navigation; delegated so handlers survive print DOM swaps.
  document.addEventListener(
    "click",
    (ev) => {
      const link = ev.target.closest("#cv-root a[href]");
      if (!link) return;
      // Reserved for future delegated actions (analytics, etc.).
    },
    true
  );
}

export function isPrintSwapActive() {
  return swapActive;
}
