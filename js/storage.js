/**
 * storage.js
 * Persists and restores form input state via localStorage.
 * Add any new input field IDs to FIELD_IDS to include them in auto-save.
 */

const INPUT_STORAGE_KEY = "brewsInputState";

const FIELD_IDS = [
  "beginM", "endM", "tallyMC",
  "beginL", "endL", "tallyLC",
  "beginS", "endS",
  "beginHC", "endHC",
  "addons"
];

function saveInputs() {
  const state = {};

  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  });

  const rows = document.querySelectorAll("#expensesContainer .expense-row");
  state._expenses = [];
  rows.forEach(row => {
    state._expenses.push({
      name:  row.querySelector(".exp-name").value,
      price: row.querySelector(".exp-price").value
    });
  });

  localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(state));
}

function restoreInputs() {
  const raw = localStorage.getItem(INPUT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const state = JSON.parse(raw);

    FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.value = state[id];
    });

    return { expenses: state._expenses || [] };
  } catch (e) {
    return null;
  }
}

function clearInputStorage() {
  localStorage.removeItem(INPUT_STORAGE_KEY);
}

function attachInputListeners() {
  FIELD_IDS.forEach(id => {
    document.getElementById(id)?.addEventListener("input", saveInputs);
  });
  document.getElementById("expensesContainer")
    .addEventListener("input", saveInputs);
}
