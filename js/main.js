/**
 * main.js
 * Application entry point.
 * Bootstraps the app by restoring saved inputs, attaching button listeners,
 * and registering the service worker.
 *
 * All heavy logic lives in the modules below — this file should stay thin.
 */

import { FIELD_IDS, restoreInputs } from "./storage.js";
import { saveInputs }               from "./storage.js";
import {
  addExpenseRow,
  calculate,
  clearAll,
  showHistory,
  clearHistoryUI
} from "./ui.js";

// ── Boot ──────────────────────────────────────────────────────────────────────

function init() {
  // 1. Restore previously saved form state
  const saved = restoreInputs();
  if (saved?.expenses?.length) {
    document.getElementById("expensesContainer").innerHTML = "";
    saved.expenses.forEach(e => addExpenseRow(e.name, e.price));
  }

  // 2. Attach input auto-save listeners to all named fields
  FIELD_IDS.forEach(id => {
    document.getElementById(id)?.addEventListener("input", saveInputs);
  });
  document.getElementById("expensesContainer")
    .addEventListener("input", saveInputs);

  // 3. Wire up primary action buttons
  document.getElementById("computeBtn")
    .addEventListener("click", calculate);

  document.getElementById("clearBtn")
    .addEventListener("click", clearAll);

  document.getElementById("historyBtn")
    .addEventListener("click", showHistory);

  document.getElementById("clearHistoryBtn")
    .addEventListener("click", clearHistoryUI);

  // 4. Wire up the "Add Expense" button
  document.getElementById("addExpenseBtn")
    .addEventListener("click", () => addExpenseRow());

  // 5. Wire up the initial remove button on the default expense row
  document.querySelector(".remove-expense-btn")
    ?.addEventListener("click", function () {
      this.closest(".expense-row").remove();
      saveInputs();
    });
}

// ── Service Worker ────────────────────────────────────────────────────────────

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"))
    .catch(err => console.error("SW registration failed:", err));
}

// ── Run ───────────────────────────────────────────────────────────────────────

init();
