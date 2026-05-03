// ==================================================
// js/state.js
// Source de vérité unique pour l'état de l'interface
// Aucun module ne modifie directement l'état d'un autre —
// tout passe par cet objet partagé
// version 27 avril 2026
// ==================================================

export const state = {

  // ── LANGUE ───────────────────────────────────────
  langueActive: "fr",         // "fr" | "en"

  // ── CARTE ────────────────────────────────────────
  zoom: "global",             // "global" | "approche" | "focus"
  regionActive: null,         // "Bas-Saint-Laurent" | null

  // ── RÉSEAU ───────────────────────────────────────
  dateActive: null,           // Date | null — pilote le timeSlider
  nodeHovered: null,          // id du node survolé
  nodeSelected: null,         // id du node sélectionné (clic)

  // ── UI ───────────────────────────────────────────
  legende: null,              // "categories" | "services" | null
};