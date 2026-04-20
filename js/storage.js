/**
 * storage.js
 * Handles saving and restoring the form's input state to/from localStorage.
 * Extend FIELD_IDS if you add new input fields to index.html.
 */

const INPUT_STORAGE_KEY = "brewsInputState";

export const FIELD_IDS = [
  "beginM", "endM", "tallyMC",
  "beginL", "endL", "tallyLC",
  "beginS", "endS",
  "beginHC", "endHC",
  "addons"
];

/**
 * Reads all form fields and expense rows, then persists them to localStorage.
 */
export function saveInputs() {
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

/**
 * Reads localStorage and repopulates all form fields and expense rows.
 * Returns the saved expense rows so ui.js can rebuild them via addExpenseRow().
 *
 * @returns {{ expenses: Array<{name: string, price: string}> } | null}
 */
export function restoreInputs() {
  const raw = localStorage.getItem(INPUT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const state = JSON.parse(raw);

    FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.value = state[id];
    });

    return { expenses: state._expenses || [] };
  } catch {
    return null;
  }
}

/**
 * Removes the saved input state from localStorage.
 */
export function clearInputStorage() {
  localStorage.removeItem(INPUT_STORAGE_KEY);
}
