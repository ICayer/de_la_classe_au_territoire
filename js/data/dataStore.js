// ==================================================
// js/data/dataStore.js
// Source centrale de vérité pour TOUTES les données
// Rempli par dataLoader.js et nodesLayer.js
// version 27 avril 2026
// ==================================================

export const dataStore = {

  // ── GÉODONNÉES ───────────────────────────────────
  geoMRC: null,           // GeoJSON des MRC

  // ── DONNÉES RÉSEAU ───────────────────────────────
  nodes: null,            // Array — nodes bruts du CSV
  links: null,            // Array — liens bruts du CSV (1 ligne = 1 événement)
  linksAggregated: null,  // Array { source, target, poids } — agrégé par D3

  // ── POSITIONS PIXEL ──────────────────────────────
  // Calculées par nodesLayer.js après projection
  // Utilisées par linksLayer.js pour tracer les liens
  // Map : id → { px, py }
  nodePositions: {},

  // ── PLAGE TEMPORELLE ─────────────────────────────
  minDate: null,
  maxDate: null,
};