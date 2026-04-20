/**
 * ui.js
 * All DOM rendering: calculate results, expense rows, history display, clear.
 * Depends on: InventorySystem.js, storage.js, history.js (loaded before this).
 */

let lastRenderContent = "";
let lastRenderDate    = "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(value) {
  const num = Number(value) || 0;
  return "₱" + num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

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

function addExpenseRow(name = "", price = "") {
  const container = document.getElementById("expensesContainer");
  const row       = document.createElement("div");
  row.className   = "expense-row";
  row.innerHTML   = `
    <input type="text"   class="exp-name"  placeholder="Item name" value="${name}">
    <input type="number" class="exp-price" placeholder="₱0"        value="${price}">
    <button type="button" onclick="this.parentElement.remove(); saveInputs();">x</button>
  `;
  row.addEventListener("input", saveInputs);
  container.appendChild(row);
}

// ── Calculate ─────────────────────────────────────────────────────────────────

function calculate() {
  const v = id => +document.getElementById(id).value || 0;

  const system = new InventorySystem();
  system.setCupsM( v("beginM"),  v("endM"),  v("tallyMC"));
  system.setCupsL( v("beginL"),  v("endL"),  v("tallyLC"));
  system.setCupsS( v("beginS"),  v("endS"));
  system.setCupsHC(v("beginHC"), v("endHC"));
  system.setMC(v("tallyMC"));
  system.setLC(v("tallyLC"));
  system.setExpenses(getExpensesFromUI());
  system.setAddons(v("addons"));

  const totalSales  = system.computeTotalCupSale();
  const salary      = system.computeSalaryBonus(totalSales);
  const grossIncome = system.computeGrossIncome(salary);
  const finalTotal  = system.computeFinalTotal(salary);

  const orderedRows = [
    { item: system.M,  beg: v("beginM"),  end: v("endM")  },
    { item: system.L,  beg: v("beginL"),  end: v("endL")  },
    { item: system.LC, beg: null,         end: null        },
    { item: system.MC, beg: null,         end: null        },
    { item: system.HC, beg: v("beginHC"), end: v("endHC") },
    { item: system.S,  beg: v("beginS"),  end: v("endS")  },
  ];

  const dash  = val => (val === null ? "—" : val);
  const today = new Date().toISOString().split("T")[0];
  const existingDate = document.getElementById("resultDate")?.value || today;
  lastRenderDate = existingDate;

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center;
                border-bottom:2px solid #d4b89e; padding-bottom:4px; margin-bottom:10px;">
      <h3 style="margin:0; font-weight:600; border:none;">Results</h3>
      <input type="date" id="resultDate" value="${existingDate}"
        style="border:none; background:transparent; font-size:0.9rem;
               color:#5a4632; cursor:pointer; text-align:right;">
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
  renderResults(html);
  saveInputs();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Save current result ───────────────────────────────────────────────────────

function saveCurrentResults() {
  if (!lastRenderContent) { alert("Please compute first."); return; }
  const dateInput  = document.getElementById("resultDate");
  const editedDate = dateInput?.value || lastRenderDate || new Date().toISOString().split("T")[0];
  saveHistory(editedDate, lastRenderContent);

  const btn = document.querySelector(".output-actions .primary");
  if (btn) {
    btn.disabled      = true;
    btn.textContent   = "Saved";
    btn.style.opacity = "0.8";
    btn.style.cursor  = "default";
  }
}

// ── History UI ────────────────────────────────────────────────────────────────

function showHistory() {
  const history = getAllHistory();
  const res     = document.getElementById("results");
  res.dataset.view = "history";

  if (!history.length) {
    res.innerHTML = "<p>No history yet.</p>";
    return;
  }

  res.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;
                border-bottom:2px solid #d4b89e; padding-bottom:4px; margin-bottom:10px;">
      <h3 style="margin:0; font-weight:600; border:none;">History</h3>
    </div>
    <div class="history-list">
      ${history.map(h => `
        <div class="history-item">
          <div class="date">${h.date}</div>
          <div class="actions">
            <button class="btn-restore" onclick="restoreHistoryEntryByDate('${h.date}')">Restore</button>
            <button class="btn-delete"  onclick="deleteHistoryEntryByDate('${h.date}')">Delete</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restoreHistoryEntryByDate(date) {
  const entry = getHistoryByDate(date);
  if (!entry) return;
  lastRenderContent = entry.results;
  lastRenderDate    = entry.date;
  renderResults(entry.results);
  delete document.getElementById("results").dataset.view;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteHistoryEntryByDate(date) {
  deleteHistoryByDate(date);
  showHistory();
}

function clearHistoryUI() {
  if (confirm("Are you sure you want to delete all history?")) {
    clearAllHistory();
    const res = document.getElementById("results");
    res.innerHTML    = "<p>History cleared.</p>";
    res.dataset.view = "history";
  }
}

// ── Clear all ─────────────────────────────────────────────────────────────────

function clearAll() {
  document.querySelectorAll("input").forEach(i => { if (!i.disabled) i.value = ""; });
  document.getElementById("results").innerHTML        = "";
  document.getElementById("expensesContainer").innerHTML = "";
  addExpenseRow();
  lastRenderContent = "";
  lastRenderDate    = "";
  clearInputStorage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Internal render helper ────────────────────────────────────────────────────

function renderResults(contentHTML) {
  const res = document.getElementById("results");
  res.innerHTML = contentHTML + `
    <div class="output-actions">
      <button class="primary" onclick="saveCurrentResults()">Save to History</button>
    </div>
  `;
  delete res.dataset.view;
}
