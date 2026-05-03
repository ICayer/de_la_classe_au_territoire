// ==================================================
// js/controls/uiControls.js
// Boutons de contrôle de l'interface :
//   - Bouton reset zoom (⊙)
//   - Bouton info/légende (?)
// Pattern : initUIControls() initialise les deux boutons
// Bilingue via i18n.js
// version 3 mai 2026
// ==================================================

import { t }          from "../utils/i18n.js";
import { resetZoom }  from "../map/mapZoom.js";

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initUIControls() {
  _buildResetZoomButton();
  _buildInfoButton();

  // Mise à jour langue
  document.addEventListener("d3LangueChanged", () => {
    _updateLabels();
  });

  console.log("🎛️ uiControls : boutons initialisés");
}

// --------------------------------------------------
// BOUTON RESET ZOOM
// --------------------------------------------------

function _buildResetZoomButton() {
  const btn = document.createElement("button");
  btn.id = "reset-zoom-btn";
  btn.textContent = "⊙";
  _setLabels(btn, "zoom.reset");

  btn.addEventListener("click", () => resetZoom());

  const container = document.getElementById("viz-wrapper") || document.body;
  container.appendChild(btn);
}

// --------------------------------------------------
// BOUTON INFO ?
// --------------------------------------------------

function _buildInfoButton() {
  const btn = document.createElement("button");
  btn.id = "info-btn";
  btn.textContent = "?";
  _setLabels(btn, "info.btnLabel");
  btn.setAttribute("aria-expanded", "false");

  btn.addEventListener("click", () => {
    const panel  = document.getElementById("info-panel");
    const isOpen = panel.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen);
    btn.classList.toggle("active", isOpen);
  });

  const container = document.getElementById("viz-wrapper") || document.body;
  container.appendChild(btn);
}

// --------------------------------------------------
// UTILITAIRES
// --------------------------------------------------

function _setLabels(btn, key) {
  btn.setAttribute("aria-label", t(key));
  btn.setAttribute("title",      t(key));
}

function _updateLabels() {
  const resetBtn = document.getElementById("reset-zoom-btn");
  const infoBtn  = document.getElementById("info-btn");
  if (resetBtn) _setLabels(resetBtn, "zoom.reset");
  if (infoBtn)  _setLabels(infoBtn,  "info.btnLabel");
}