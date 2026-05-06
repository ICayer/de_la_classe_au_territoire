// ==================================================
// js/components/serviceModal.js
// Fenêtre surgissante pour les 6 pages de service
// Fetch le HTML depuis public/data/services/
// Injecte --service-color depuis colors.js
// Gère FR/EN via state.langueActive
// Pattern MasterCayer V2
// version 6 mai 2026
// ==================================================

import { COLOR_SERVICES } from "../utils/colors.js";
import { state } from "../state.js";

// --------------------------------------------------
// CRÉATION DU CONTENEUR DOM (une seule fois)
// Hors SVG — div HTML positionné sur #viz-wrapper
// --------------------------------------------------

let modalEl    = null;
let overlayEl  = null;

export function initServiceModal() {
  _buildModal();
  console.log("🪟 serviceModal : modal initialisée");
}

function _buildModal() {

  // Overlay sombre
  overlayEl = document.createElement("div");
  overlayEl.id = "service-overlay";
  overlayEl.addEventListener("click", closeServiceModal);

  // Conteneur modal
  modalEl = document.createElement("div");
  modalEl.id = "service-modal";
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");

  // Bouton fermer
  const closeBtn = document.createElement("button");
  closeBtn.id = "service-modal-close";
  closeBtn.setAttribute("aria-label", "Fermer");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeServiceModal);
  modalEl.appendChild(closeBtn);

  // Zone de contenu — le HTML fetchée sera injecté ici
  const content = document.createElement("div");
  content.id = "service-modal-content";
  modalEl.appendChild(content);

  // Attacher au viz-wrapper
  const wrapper = document.getElementById("viz-wrapper") || document.body;
  wrapper.appendChild(overlayEl);
  wrapper.appendChild(modalEl);
}

// --------------------------------------------------
// OUVRIR — appelé par serviceButtons.js au clic
// --------------------------------------------------

export async function openServiceModal(evt) {

  if (!modalEl) return;

  const color = COLOR_SERVICES[evt.id] ?? "#888";

  // Injecter la couleur du service comme variable CSS
  modalEl.style.setProperty("--service-color", color);

  // Afficher overlay + modal (classe open gérée par CSS transition)
  overlayEl.classList.add("open");
  modalEl.classList.add("open");

  // Fetch du contenu HTML
  const content = modalEl.querySelector("#service-modal-content");
  content.innerHTML = `<div class="modal-loading">…</div>`;

  try {
    const res  = await fetch(evt.page);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    content.innerHTML = html;

    // Appliquer la langue active après injection
    _applyLang(content, state.langueActive);

  } catch (err) {
    content.innerHTML = `<p class="modal-error">Contenu non disponible (${err.message})</p>`;
    console.warn("⚠️ serviceModal : impossible de charger", evt.page, err);
  }

  // Écouter les changements de langue pendant que la modal est ouverte
  document.addEventListener("d3LangueChanged", _onLangChange);

  // Empêcher le scroll de la page derrière
  document.body.style.overflow = "hidden";
}

// --------------------------------------------------
// FERMER
// --------------------------------------------------

export function closeServiceModal() {
  if (!modalEl) return;

  overlayEl.classList.remove("open");
  modalEl.classList.remove("open");

  document.removeEventListener("d3LangueChanged", _onLangChange);
  document.body.style.overflow = "";
}

// --------------------------------------------------
// LANGUE — applique FR/EN sur le contenu injecté
// Même pattern data-lang / visible que index.html
// --------------------------------------------------

function _applyLang(container, lang) {
  container.querySelectorAll("[data-lang]").forEach(el => {
    el.classList.toggle("visible", el.dataset.lang === lang);
  });
}

function _onLangChange() {
  const content = modalEl?.querySelector("#service-modal-content");
  if (content) _applyLang(content, state.langueActive);
}