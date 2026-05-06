// ==================================================
// js/utils/colors.js
// Source de vérité unique pour toutes les couleurs
// du projet — modifier ici, tout suit automatiquement
// version 2 mai 2026
// ==================================================

// --------------------------------------------------
// NODES — cercles de fond par catégorie
// --------------------------------------------------

export const COLOR_NODES = {
  mandataire:   "#000000",   // Blue 400  — coeur du réseau TAC
  scientifique: "#cab593",   // Blue 200  — communauté TAC, nuance claire
  beneficiaire: "#ffffff",   // Amber 400 — acteurs du territoire
  partenaire:   "#FAC775",   // Amber 100 — acteurs externes (discret)
};

// Opacité du cercle de fond
export const NODE_CIRCLE_OPACITY = 0.9;

// Halo par catégorie (anneau semi-transparent)
export const COLOR_NODE_HALOS = {
  mandataire:   "rgba(0, 0, 0, 0.35)",  // Blue 200
  scientifique: "rgba(181, 212, 244, 0.35)",  // Blue 100
  beneficiaire: "rgba(0, 0, 0, 0.35)",  // Amber 100
  partenaire:   "rgba(250, 199, 117, 0.20)",  // Amber 100 très discret
};

// Couleur du halo par défaut (fallback)
export const NODE_HALO_COLOR = "rgba(255,255,255,0.25)";
export const NODE_HALO_WIDTH = 1.5;

// --------------------------------------------------
// BUBBLE CLUSTER TAC
// --------------------------------------------------

export const COLOR_BUBBLE_FILL   = "rgba(230, 241, 251, 0.20)";  // Blue 50 à 10%
export const COLOR_BUBBLE_STROKE = "#85B7EB";                     // Blue 200

// --------------------------------------------------
// MRC — polygones géographiques
// 3 tons de gris pour les 3 régions administratives
// --------------------------------------------------

export const COLOR_MRC_REGIONS = {
  "Bas-Saint-Laurent":              "#7bf0de",  // Gray 100 — le plus clair (sud)
  "Gaspésie–Îles-de-la-Madeleine": "#89caf3",  // Gray 200 — intermédiaire
  "Côte-Nord":                      "#648bd1",  // Gray 400 — le plus foncé (nord)
};

export const COLOR_MRC_FILL         = "#a9b3b4";  // fallback Gray 200
export const COLOR_MRC_FILL_OPACITY = 0.20;
export const COLOR_MRC_STROKE       = "#eeede9";  // Gray 400
export const COLOR_MRC_STROKE_WIDTH = 0.8;

// --------------------------------------------------
// SERVICES — segments du donut chart
// Framboise (pink) = services relationnels
// Teal (vert)      = services de connaissance
// --------------------------------------------------

export const COLOR_SERVICES = {
  // ── Services relationnels ──────────────────────
  "réseautage":        "#f3ae23",   // rose pâle clair
  "représentation":    "#cf2931",   // framboise franc
  "expertise-conseil": "#9a075a",   // prune foncé

  // ── Services de connaissance ───────────────────
  "documentation":     "#08ad52",   // menthe clair
  "production":        "#61ad05",   // teal franc
  "formation":         "#32790b",   // teal profond
};

// --------------------------------------------------
// LIENS — styles par type de relation
// La couleur du lien = couleur du service rendu
// Le style du trait encode le type de relation
// --------------------------------------------------

// Liens — gris neutre, épaisseur encode l'intensité
export const COLOR_LINK_DEFAULT     = "rgba(180,180,180,0.7)";  // gris pâle — TAC↔B
export const COLOR_LINK_CLUSTER     = "rgba(180, 180, 180, 0.7)";  // même gris pâle — pointillé fait la distinction
export const COLOR_LINK_BB          = "rgba(35, 42, 50, 0.9)";     // gris charbon-bleuté — B↔B
export const LINK_OPACITY_CLUSTER   = 1;
export const LINK_OPACITY_DEFAULT   = 1;
export const LINK_OPACITY_BB        = 1;
export const LINK_DASHARRAY_CLUSTER = "5,4";

// --------------------------------------------------
// UTILITAIRE — accès par clé dynamique
// --------------------------------------------------

export function colorFor(type, key) {
  switch (type) {
    case "node":    return COLOR_NODES[key]    ?? "#888";
    case "service": return COLOR_SERVICES[key] ?? "#888";
    default:        return "#888";
  }
}