/**
 * main.js
 * App entry point — restores saved state and attaches input auto-save listeners.
 * All functions (calculate, addExpenseRow, etc.) come from the scripts above.
 */

(function init() {
  // Restore saved form inputs from localStorage
  const saved = restoreInputs();
  if (saved?.expenses?.length) {
    document.getElementById("expensesContainer").innerHTML = "";
    saved.expenses.forEach(e => addExpenseRow(e.name, e.price));
  }

  // Auto-save on every input change
  attachInputListeners();
})();
