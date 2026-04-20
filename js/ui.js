/**
 * ui.js
 * Handles all DOM rendering: calculating results, building the expense list,
 * displaying history, and wiring up user interactions.
 *
 * Import and call initUI() from main.js to bootstrap everything.
 */

import { InventorySystem } from "./InventorySystem.js";
import { saveInputs, clearInputStorage } from "./storage.js";
import {
  getAllHistory,
  saveHistory,
  getHistoryByDate,
  deleteHistoryByDate,
  clearAllHistory
} from "./history.js";

// ── Module-level state ────────────────────────────────────────────────────────
let lastRenderContent = "";
let lastRenderDate    = "";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a number as Philippine Peso currency.
 * @param {number|string} value
 * @returns {string}  e.g. "₱1,234.50"
 */
export function formatMoney(value) {
  const num = Number(value) || 0;
  return "₱" + num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Reads all expense rows from the DOM and returns a clean array.
 * @returns {Array<{name: string, price: number}>}
 */
function getExpensesFromUI() {
  const rows = document.querySelectorAll("#expensesContainer .expense-row");
  const list = [];
  rows.forEach(row => {
    const name  = row.querySelector(".exp-name").value.trim();
    const price = parseFloat(row.querySelector(".exp-price").value) || 0;
    if (name && price > 0) list.push({ name, price });
  });
  return list;
}

// ── Expense rows ──────────────────────────────────────────────────────────────

/**
 * Appends a new expense input row to #expensesContainer.
 * @param {string} name  - Pre-fill the name field (optional)
 * @param {string} price - Pre-fill the price field (optional)
 */
export function addExpenseRow(name = "", price = "") {
  const container = document.getElementById("expensesContainer");
  const row = document.createElement("div");
  row.className = "expense-row";
  row.innerHTML = `
    <input type="text"   class="exp-name"  placeholder="Item name" value="${name}">
    <input type="number" class="exp-price" placeholder="₱0"        value="${price}">
    <button type="button" class="remove-expense-btn">x</button>
  `;
  row.querySelector(".remove-expense-btn").addEventListener("click", () => {
    row.remove();
    saveInputs();
  });
  row.addEventListener("input", saveInputs);
  container.appendChild(row);
}

// ── Calculate ─────────────────────────────────────────────────────────────────

/**
 * Reads all form inputs, runs the InventorySystem calculations,
 * and renders the results panel.
 */
export function calculate() {
  const v = id => +document.getElementById(id).value || 0;

  const beginM  = v("beginM"),  endM    = v("endM"),  tallyMC = v("tallyMC");
  const beginL  = v("beginL"),  endL    = v("endL"),  tallyLC = v("tallyLC");
  const beginS  = v("beginS"),  endS    = v("endS");
  const beginHC = v("beginHC"), endHC   = v("endHC");

  const system = new InventorySystem();
  system.setCupsM(beginM, endM, tallyMC);
  system.setCupsL(beginL, endL, tallyLC);
  system.setCupsS(beginS, endS);
  system.setCupsHC(beginHC, endHC);
  system.setMC(tallyMC);
  system.setLC(tallyLC);
  system.setExpenses(getExpensesFromUI());
  system.setAddons(v("addons"));

  const totalSales  = system.computeTotalCupSale();
  const salary      = system.computeSalaryBonus(totalSales);
  const grossIncome = system.computeGrossIncome(salary);
  const finalTotal  = system.computeFinalTotal(salary);

  // Display order for the cup table
  const orderedRows = [
    { item: system.M,  beg: beginM,  end: endM  },
    { item: system.L,  beg: beginL,  end: endL  },
    { item: system.LC, beg: null,    end: null  },
    { item: system.MC, beg: null,    end: null  },
    { item: system.HC, beg: beginHC, end: endHC },
    { item: system.S,  beg: beginS,  end: endS  },
  ];

  const dash  = v => (v === null ? "—" : v);
  const today = new Date().toISOString().split("T")[0];
  const existingDate = document.getElementById("resultDate")?.value || today;
  lastRenderDate = existingDate;

  // ── Build HTML ──────────────────────────────────────────────────────────
  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center;
                border-bottom:2px solid #d4b89e; padding-bottom:4px; margin-bottom:10px;">
      <h3 style="margin:0; font-weight:600; border:none;">Results</h3>
      <input type="date" id="resultDate" value="${existingDate}"
        style="border:none; background:transparent; font-size:0.9rem; color:#5a4632;
               cursor:pointer; text-align:right;">
    </div>

    <table>
      <tr><th>Item</th><th>Beg</th><th>Cups</th><th>Price</th><th>End</th><th>Amount</th></tr>
  `;

  orderedRows.forEach(({ item, beg, end }) => {
    if (item.usedCups > 0) {
      html += `<tr>
        <td>${item.name}</td>
        <td>${dash(beg)}</td>
        <td>${item.usedCups}</td>
        <td>${formatMoney(item.price)}</td>
        <td>${dash(end)}</td>
        <td>${formatMoney(item.total)}</td>
      </tr>`;
    }
  });

  html += `<tr class="totals"><td colspan="5">Total Cup Sales</td><td>${formatMoney(totalSales)}</td></tr></table>`;

  // ── Summary ─────────────────────────────────────────────────────────────
  const totalExpenses = system.expenses + salary;

  html += `<table class="summary">
    <tr class="expense-header">
      <td>Total Expenses:</td>
      <td style="text-align:right">- ${formatMoney(totalExpenses)}</td>
    </tr>
    <tr class="expense-sub">
      <td>Salary + Bonus</td>
      <td style="text-align:right">- ${formatMoney(salary)}</td>
    </tr>
  `;

  system.expensesList.forEach(e => {
    html += `<tr class="expense-sub">
      <td>${e.name}</td>
      <td style="text-align:right">- ${formatMoney(e.price)}</td>
    </tr>`;
  });

  html += `
    <tr>
      <td style="padding-top:10px; border-top:1px solid #e8d5c4;">Gross Income:</td>
      <td style="text-align:right; padding-top:10px; border-top:1px solid #e8d5c4;">${formatMoney(grossIncome)}</td>
    </tr>
    <tr>
      <td>Add-ons:</td>
      <td style="text-align:right">${formatMoney(system.addons)}</td>
    </tr>
    <tr>
      <td><strong>Final Total:</strong></td>
      <td style="text-align:right"><strong>${formatMoney(finalTotal)}</strong></td>
    </tr>
  </table>`;

  lastRenderContent = html;
  renderResults(html, false);
  saveInputs();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Save current result ───────────────────────────────────────────────────────

/**
 * Saves the most recently computed result to history.
 * Called by the "Save to History" button inside the results panel.
 */
export function saveCurrentResults() {
  if (!lastRenderContent) {
    alert("Please compute or load history first.");
    return;
  }
  const dateInput  = document.getElementById("resultDate");
  const editedDate = dateInput?.value || lastRenderDate || new Date().toISOString().split("T")[0];
  saveHistory(editedDate, lastRenderContent);

  // Visual feedback — disable the Save button
  const btn = document.querySelector(".output-actions .primary");
  if (btn) {
    btn.disabled     = true;
    btn.textContent  = "Saved";
    btn.style.opacity = "0.8";
    btn.style.cursor  = "default";
  }
}

// ── History UI ────────────────────────────────────────────────────────────────

/**
 * Renders the full history list into #results.
 */
export function showHistory() {
  const history = getAllHistory();
  const res = document.getElementById("results");
  res.dataset.view = "history";

  if (!history.length) {
    res.innerHTML = "<p>No history yet.</p>";
    return;
  }

  const listHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;
                border-bottom:2px solid #d4b89e; padding-bottom:4px; margin-bottom:10px;">
      <h3 style="margin:0; font-weight:600; border:none;">History</h3>
    </div>
    <div class="history-list">
      ${history.map(h => `
        <div class="history-item">
          <div class="date">${h.date}</div>
          <div class="actions">
            <button class="btn-restore" data-date="${h.date}">Restore</button>
            <button class="btn-delete"  data-date="${h.date}">Delete</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  res.innerHTML = listHTML;

  // Attach events via delegation so we don't use inline handlers
  res.querySelectorAll(".btn-restore").forEach(btn => {
    btn.addEventListener("click", () => restoreHistoryEntry(btn.dataset.date));
  });
  res.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteHistoryByDate(btn.dataset.date);
      showHistory();
    });
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Restores a history entry into the results panel.
 * @param {string} date
 */
function restoreHistoryEntry(date) {
  const entry = getHistoryByDate(date);
  if (!entry) return;
  lastRenderContent = entry.results;
  lastRenderDate    = entry.date;
  renderResults(entry.results, false);
  delete document.getElementById("results").dataset.view;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Prompts the user and wipes all history if confirmed.
 */
export function clearHistoryUI() {
  if (confirm("Are you sure you want to delete all history?")) {
    clearAllHistory();
    const res = document.getElementById("results");
    res.innerHTML = "<p>History cleared.</p>";
    res.dataset.view = "history";
  }
}

// ── Clear all ─────────────────────────────────────────────────────────────────

/**
 * Resets every input field and clears the results panel and saved state.
 */
export function clearAll() {
  document.querySelectorAll("input").forEach(i => { if (!i.disabled) i.value = ""; });
  document.getElementById("results").innerHTML = "";
  document.getElementById("expensesContainer").innerHTML = "";
  addExpenseRow();
  lastRenderContent = "";
  lastRenderDate    = "";
  clearInputStorage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Internal render helper ────────────────────────────────────────────────────

/**
 * Injects content HTML into #results along with the action buttons.
 * @param {string}  contentHTML
 * @param {boolean} alreadySaved - If true, the Save button starts disabled
 */
function renderResults(contentHTML, alreadySaved = false) {
  const actionsHTML = `
    <div class="output-actions">
      <button class="primary" id="saveResultBtn"
        ${alreadySaved ? 'disabled style="opacity:0.8; cursor:default;"' : ""}>
        ${alreadySaved ? "Saved" : "Save to History"}
      </button>
    </div>
  `;

  const res = document.getElementById("results");
  res.innerHTML = contentHTML + actionsHTML;
  delete res.dataset.view;

  res.querySelector("#saveResultBtn")?.addEventListener("click", saveCurrentResults);
}
