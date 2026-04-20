/**
 * InventorySystem.js
 * Core business logic: product definitions, cup tracking, and financial calculations.
 * Add new products here and wire them up in ui.js → calculate().
 */

class Item {
  constructor(name, price) {
    this.name     = name;
    this.price    = price;
    this.usedCups = 0;
  }

  get total() {
    return this.usedCups * this.price;
  }
}

class InventorySystem {
  constructor() {
    // ── Product catalogue ─────────────────────────────────────────────────
    // To add a new product: new Item("Name", price) and wire setters below.
    this.M  = new Item("Medium",        29);
    this.L  = new Item("Large",         39);
    this.S  = new Item("Small",         25);
    this.MC = new Item("Iced Coffee M", 35);
    this.LC = new Item("Iced Coffee L", 45);
    this.HC = new Item("Hot Coffee",    45);

    this.expensesList = [];
    this.expenses     = 0;
    this.addons       = 0;
  }

  // ── Cup setters ───────────────────────────────────────────────────────────
  setCupsM(begin, end, tallyMC)  { this.M.usedCups  = (begin - end) - tallyMC; }
  setCupsL(begin, end, tallyLC)  { this.L.usedCups  = (begin - end) - tallyLC; }
  setCupsS(begin, end)           { this.S.usedCups  = (begin - end); }
  setCupsHC(begin, end)          { this.HC.usedCups = (begin - end); }
  setMC(tally)                   { this.MC.usedCups = tally; }
  setLC(tally)                   { this.LC.usedCups = tally; }

  // ── Financial setters ─────────────────────────────────────────────────────
  setExpenses(list) {
    this.expensesList = list;
    this.expenses     = list.reduce((sum, item) => sum + item.price, 0);
  }

  setAddons(amount) {
    this.addons = amount;
  }

  // ── Computations ──────────────────────────────────────────────────────────

  computeTotalCupSale() {
    return (
      this.M.total  + this.L.total  + this.S.total +
      this.MC.total + this.LC.total + this.HC.total
    );
  }

  /**
   * Base ₱350 salary + ₱50 bonus for every ₱1,000 above ₱3,000 in sales.
   */
  computeSalaryBonus(totalSales) {
    let salary = 350;
    if (totalSales >= 3000) {
      salary += 50;
      salary += Math.floor((totalSales - 3000) / 1000) * 50;
    }
    return salary;
  }

  computeGrossIncome(salary) {
    return this.computeTotalCupSale() - (this.expenses + salary);
  }

  computeFinalTotal(salary) {
    return this.computeGrossIncome(salary) + this.addons;
  }
}
