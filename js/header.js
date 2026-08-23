/**
 * header.js
 * Shared top-of-page header — same brown header style used on the POS
 * screen (var(--grad-dark)) — used on every page for a consistent look:
 * brand + subtitle on the left, Home / Back / (page actions) / Settings
 * on the right.
 *
 * Settings itself is NOT duplicated here — it's a large, tightly-integrated
 * system on index.html (prices, flavors, theme, sync, role). Rather than
 * risk that logic by copying it, every other page's Settings icon deep-links
 * to index.html, which auto-opens the same modal on load. This means
 * Settings is reachable from anywhere in the app.
 */
(function () {
  window.renderPageHeader = function (opts) {
    opts = opts || {};
    const homeHTML = opts.showHome === false
      ? ""
      : `<a href="index.html" class="app-header-btn" title="Home" aria-label="Home">🏠 Home</a>`;
    const backHTML = opts.showBack === false
      ? ""
      : `<a href="#" class="app-header-btn" onclick="goBack(); return false;" title="Back" aria-label="Back">← Back</a>`;
    const extra = opts.extraButtonsHTML || "";
    const settingsHTML = opts.hideSettings
      ? ""
      : `<button class="app-header-btn" onclick="goToSettings()" title="Settings" aria-label="Settings">⚙️ Settings</button>`;

    return `<div class="app-header">
    <div class="app-header-row1">
      <a href="index.html" style="text-decoration:none;display:block;">
        <div class="app-header-left">
          <span class="app-header-brand">BREWS.CO</span>
          <span class="app-header-sub">${opts.subtitle || ""}</span>
        </div>
      </a>
      <div class="app-header-actions">
        ${homeHTML}${backHTML}${extra}${settingsHTML}
      </div>
    </div>
  </div>`;
  };

  // On index.html this opens the modal in place (no navigation needed).
  // Everywhere else it deep-links home with ?settings=1, which index.html
  // reads on load to auto-open the same modal.
  window.goToSettings = function () {
    const onHome = /(^|\/)index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);
    if (onHome && typeof openSettings === "function") {
      openSettings();
    } else {
      location.href = "index.html?settings=1";
    }
  };

  // Returns to whichever page the user actually came from — not a fixed
  // page — using real browser history. Falls back to Home if there's
  // nowhere to go back to (e.g. app opened fresh on this page).
  window.goBack = function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      location.href = "index.html";
    }
  };
})();
