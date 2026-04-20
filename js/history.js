/**
 * history.js
 * Manages the daily result history stored in localStorage.
 * Each entry is keyed by date (YYYY-MM-DD) and stores rendered HTML content.
 */

const HISTORY_KEY = "inventoryHistory";

/**
 * Returns all history entries sorted newest-first.
 * @returns {Array<{date: string, results: string}>}
 */
export function getAllHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  return history.sort((a, b) => (a.date > b.date ? -1 : 1));
}

/**
 * Saves or overwrites a history entry for the given date.
 * @param {string} date    - ISO date string (YYYY-MM-DD)
 * @param {string} results - Rendered HTML content of the results panel
 */
export function saveHistory(date, results) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  const idx = history.findIndex(h => h.date === date);
  const entry = { date, results };
  if (idx >= 0) history[idx] = entry;
  else history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Returns a single history entry by date, or null if not found.
 * @param {string} date
 * @returns {{date: string, results: string} | null}
 */
export function getHistoryByDate(date) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  return history.find(h => h.date === date) || null;
}

/**
 * Deletes a single history entry by date.
 * @param {string} date
 */
export function deleteHistoryByDate(date) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.filter(h => h.date !== date)));
}

/**
 * Wipes all history entries from localStorage.
 */
export function clearAllHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
