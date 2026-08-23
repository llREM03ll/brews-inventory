/**
 * main.js
 * Entry point — restores saved state, handles auto-fill from POS end shift.
 */

const SHIFT_KEY = "brewsShiftResult";
const LOCK_KEY  = "brewsSummaryLocked";
window.SUMMARY_LOCK_KEY = LOCK_KEY; // shared with clearAll() in ui.js

// The exact fields that are ever auto-filled from a POS shift — locking
// these (and only these) is what "view only" on the Shift Data section
// actually means. Kept as one list so the initial fill and any later
// re-lock (e.g. after leaving and coming back) can't drift apart.
const POS_SOURCED_FIELD_IDS = [
  "beginM","endM","tallyMC","beginL","endL","tallyLC",
  "beginS","endS","beginHC","endHC",
  "deliveredM","deliveredL","deliveredS","deliveredHC",
  "damageM","damageL","damageS","damageHC","addons",
];

function lockPosSourcedFields() {
  POS_SOURCED_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  const note = document.getElementById("cupsLockedNote");
  if (note) note.style.display = "block";
  localStorage.setItem(LOCK_KEY, "1");
}

(function init() {
  const shiftRaw = localStorage.getItem(SHIFT_KEY);

  if (shiftRaw) {
    try {
      const s = JSON.parse(shiftRaw);

      // Cup fields — begM/L/S/HC already adjusted (+delivered) by POS so formula works
      const fields = {
        beginM:  s.begM,  endM:  s.endM,  tallyMC: s.tallyMC,
        beginL:  s.begL,  endL:  s.endL,  tallyLC: s.tallyLC,
        beginS:  s.begS,  endS:  s.endS,
        beginHC: s.begHC, endHC: s.endHC,
        // Delivery & damage annotations — fill the existing calculate.html fields
        deliveredM:  s.deliveredM  || 0,
        deliveredL:  s.deliveredL  || 0,
        deliveredS:  s.deliveredS  || 0,
        deliveredHC: s.deliveredHC || 0,
        damageM:  s.damageM  || 0,
        damageL:  s.damageL  || 0,
        damageS:  s.damageS  || 0,
        damageHC: s.damageHC || 0,
      };

      // Stagger fill animation
      let delay = 0;
      Object.entries(fields).forEach(([id, val]) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (!el) return;
          el.value = val;
          el.style.transition = "background .4s, box-shadow .4s";
          el.style.background = "#fdf0d8";
          el.style.boxShadow  = "0 0 0 3px rgba(199,162,124,0.3)";
          setTimeout(() => { el.style.background = ""; el.style.boxShadow = ""; }, 1000);
        }, delay);
        delay += 35;
      });

      // Pre-fill expenses from POS shift expenses
      if (s.expenses && s.expenses.length) {
        document.getElementById("expensesContainer").innerHTML = "";
        s.expenses.forEach(e => addExpenseRow(e.name, e.price));
      }

      // Pre-fill addon revenue from POS
      if (s.addonRevenue) {
        setTimeout(() => {
          const el = document.getElementById("addons");
          if (el) {
            el.value = s.addonRevenue;
            el.style.transition = "background .4s";
            el.style.background = "#fdf0d8";
            setTimeout(() => el.style.background = "", 1000);
          }
        }, delay);
      }

      // Store original beg (pre-delivery) for receipt annotation
      window._shiftOrigBegs = {
        M: s.origBegM ?? s.begM, L: s.origBegL ?? s.begL,
        S: s.origBegS ?? s.begS, HC:s.origBegHC?? s.begHC,
      };
      window._shiftDeliveries = {
        M: s.deliveredM||0, L: s.deliveredL||0,
        S: s.deliveredS||0, HC:s.deliveredHC||0,
      };
      localStorage.removeItem(SHIFT_KEY);
      saveInputs();
      showShiftBanner();

      // These values all came straight from the POS shift — lock them so
      // the worker can't accidentally edit numbers that are no longer
      // theirs to change, and go straight to the computed Summary below
      // instead of requiring a manual "Compute" tap. The lock is also
      // persisted (LOCK_KEY) so it survives leaving and coming back — see
      // the restore branch below.
      setTimeout(() => {
        lockPosSourcedFields();
        if (typeof calculate === "function") calculate();
      }, delay + 60);
    } catch (e) {
      console.error("Failed to load POS shift data into Summary:", e);
    }
  } else {
    const saved = restoreInputs();
    if (saved?.expenses?.length) {
      document.getElementById("expensesContainer").innerHTML = "";
      saved.expenses.forEach(e => addExpenseRow(e.name, e.price));
    }
    if (saved?.needs?.length) {
      saved.needs.forEach(n => addNeedRow(n));
    }
    // If this draft was locked from a previous POS shift, re-lock it now —
    // otherwise leaving the page and coming back (or a reload) would quietly
    // make POS-sourced numbers editable again while still saying "view only".
    if (localStorage.getItem(LOCK_KEY) === "1") {
      lockPosSourcedFields();
    }
    // Manual/fallback path (no POS shift data waiting, never locked): if
    // there's already some saved draft with real cup numbers, show the
    // Summary for it too.
    const hasDraftCups = ["beginM","beginL","beginHC","beginS"].some(id => {
      const el = document.getElementById(id);
      return el && el.value !== "";
    });
    if (hasDraftCups && typeof calculate === "function") calculate();
  }

  attachInputListeners();
  renderNeedsAutoPreview();
})();

function showShiftBanner() {
  const banner = document.createElement("div");
  banner.style.cssText = `
    background: linear-gradient(135deg, #d4a97c, #7a5c3e); color:#fff;
    text-align:center; padding:10px 16px; font-size:0.84rem; font-weight:600;
    border-radius:12px; margin-bottom:16px; box-shadow:0 3px 10px rgba(122,92,62,0.2);
    opacity:0; transform:translateY(-6px); transition:opacity .35s ease, transform .35s ease;
  `;
  banner.textContent = "✓ Shift data auto-filled — here's your Summary.";
  const container = document.querySelector(".container");
  // insertBefore's reference node must be a *direct* child of container —
  // querySelector(".section") can return a nested match (e.g. one now
  // living inside the collapsible "Shift data from POS" details block),
  // which throws. Only ever insert before an actual direct child.
  const anchor = container.querySelector(":scope > .section, :scope > .pos-source-details")
    || container.firstElementChild;
  container.insertBefore(banner, anchor);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    banner.style.opacity = "1"; banner.style.transform = "translateY(0)";
  }));
  setTimeout(() => {
    banner.style.opacity = "0"; banner.style.transform = "translateY(-6px)";
    setTimeout(() => banner.remove(), 400);
  }, 5000);
}
