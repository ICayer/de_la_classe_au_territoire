// ==================================================
// js/layers/nodesLayer.js
// Dessine les nodes (personnes) sur gNodes
// Chaque node = image SVG centrée sur le centroïde MRC
// Stratégie A : dispersion angulaire par catégorie
// Pattern MasterCayer : init / show / hide
// version 3 mai 2026
// ==================================================

import { gNodes, projection } from "../map/mapInit.js";
import { dataStore } from "../data/dataStore.js";
import { showTooltip, moveTooltip, hideTooltip, buildNodeTooltip } from "../components/tooltip.js";
import { COLOR_NODES, COLOR_NODE_HALOS, NODE_CIRCLE_OPACITY, NODE_HALO_COLOR, NODE_HALO_WIDTH } from "../utils/colors.js";
import { focusNodeLinks, unfocusLinks } from "../layers/linksLayer.js";

// --------------------------------------------------
// CONFIGURATION — ajuster ici sans toucher au code
// --------------------------------------------------

const NODE_SIZE = 36; // px — largeur/hauteur de l'image SVG

// Image associée à chaque catégorie
// ⚠️ Les valeurs dans nodes.csv doivent correspondre
//    exactement aux clés de cet objet
const NODE_IMAGES = {
  mandataire:   "public/data/images/mandataire.svg",
  beneficiaire: "public/data/images/beneficiaire.svg",
  scientifique: "public/data/images/scientifique.svg",
  partenaire:   "public/data/images/partenaire.svg",
  // Alias pour la valeur dans ton CSV
  "collaborateur·trice": "public/data/images/partenaire.svg"
};

// Disposition angulaire par catégorie (en radians)
// 0 = Est, -PI/2 = Nord, PI/2 = Sud, PI = Ouest
// Le beneficiaire reste au centroïde (offset = 0)
const CATEGORY_ANGLE = {
  mandataire:   -Math.PI / 2,   // Nord   (270°)
  beneficiaire: null,            // Centre — pas d'offset
  scientifique: Math.PI,         // Ouest  (180°)
  partenaire:   Math.PI / 2,     // Sud    (90°)
  "collaborateur·trice": Math.PI / 2
};

// Rayon de base de l'orbite en pixels
const BASE_RADIUS = 48;

// Espacement entre nodes d'une même catégorie sur l'arc
const ARC_SPACING = NODE_SIZE + 6; // px entre centres

// --------------------------------------------------
// CALCUL DES POSITIONS
// Gère la superposition : plusieurs nodes au même
// point géographique sont disposés en arc
// --------------------------------------------------

function computePositions(nodes) {

  // 1. Grouper les nodes par coordonnées géographiques
  //    (clé = "lon,lat" pour identifier les superpositions)
  const byCoords = d3.group(
    nodes,
    d => `${d.lon.toFixed(4)},${d.lat.toFixed(4)}`
  );

  const positions = new Map(); // id → { px, py }

  byCoords.forEach((group, _coordKey) => {

    // 2. Séparer les nodes TAC des nodes géographiques dans ce groupe
    const tacInGroup  = group.filter(d => d.cluster === "tac");
    const geoInGroup  = group.filter(d => d.cluster !== "tac");

    // Nodes TAC — positions gérées par bubbleCluster.js
    tacInGroup.forEach(node => {
      const pos = dataStore.nodePositions?.[node.id];
      if (pos) positions.set(node.id, { px: pos.x, py: pos.y });
    });

    // Si tout le groupe était TAC, on passe au suivant
    if (geoInGroup.length === 0) return;

    // Remplacer le groupe par les nodes géographiques seulement
    const geoGroup = geoInGroup;

    // 3. Projeter le centroïde géographique en pixels
    const [cx, cy] = projection([geoGroup[0].lon, geoGroup[0].lat]);

    // 3. Sous-grouper par catégorie au sein de ce point
    const byCategory = d3.group(geoGroup, d => d.categorie);

    byCategory.forEach((catNodes, categorie) => {

      const angle = CATEGORY_ANGLE[categorie];

      // --- Beneficiaire : reste au centroïde exact ---
      if (angle === null) {
        catNodes.forEach(node => {
          positions.set(node.id, { px: cx, py: cy });
        });
        return;
      }

      const n = catNodes.length;

      if (n === 1) {
        // Un seul node dans cette catégorie → offset simple
        positions.set(catNodes[0].id, {
          px: cx + Math.cos(angle) * BASE_RADIUS,
          py: cy + Math.sin(angle) * BASE_RADIUS
        });

      } else {
        // Plusieurs nodes → disposés en arc autour de l'angle principal
        // L'arc est centré sur l'angle de la catégorie
        // et s'étend symétriquement de chaque côté
        const totalSpan = (n - 1) * ARC_SPACING;
        const startOffset = -totalSpan / 2;

        // Direction perpendiculaire à l'angle principal
        // pour étaler les nodes sur un arc
        const perpAngle = angle + Math.PI / 2;

        catNodes.forEach((node, i) => {
          const lateralOffset = startOffset + i * ARC_SPACING;
          positions.set(node.id, {
            px: cx + Math.cos(angle) * BASE_RADIUS
                   + Math.cos(perpAngle) * lateralOffset,
            py: cy + Math.sin(angle) * BASE_RADIUS
                   + Math.sin(perpAngle) * lateralOffset
          });
        });
      }
    });
  });

  return positions;
}

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initNodesLayer() {

  const nodes = dataStore.nodes;
  if (!nodes || !nodes.length) {
    console.warn("⚠️ nodesLayer : dataStore.nodes vide");
    return;
  }

  // Calculer toutes les positions pixel avant le rendu
  const positions = computePositions(nodes);

  // DATA JOIN — un <g> par node
  const nodeGroups = gNodes
    .selectAll("g.node-group")
    .data(nodes, d => d.id)    // clé = id pour les updates futurs
    .join("g")
    .attr("class", d => `node-group node-${d.categorie}`)
    .attr("transform", d => {
      const pos = positions.get(d.id);
      if (!pos) return "translate(0,0)";
      return `translate(${pos.px}, ${pos.py})`;
    });

  // ── CERCLE DE FOND coloré ────────────────────────
  // La couleur vient de colors.js — modifiable sans toucher aux SVG
  nodeGroups
    .append("circle")
    .attr("r",    NODE_SIZE / 2)
    .attr("fill", d => COLOR_NODES[d.categorie] ?? "#888")
    .attr("opacity", NODE_CIRCLE_OPACITY);

  // ── HALO (anneau blanc semi-transparent) ─────────
  nodeGroups
    .append("circle")
    .attr("r",            NODE_SIZE / 2)
    .attr("fill",         "none")
    .attr("stroke", d => COLOR_NODE_HALOS[d.categorie] ?? NODE_HALO_COLOR)
    .attr("stroke-width", NODE_HALO_WIDTH);

  // ── IMAGE SVG (personnage noir, sans cercle) ─────
  nodeGroups
    .append("image")
    .attr("href",   d => NODE_IMAGES[d.categorie] || NODE_IMAGES.beneficiaire)
    .attr("width",  NODE_SIZE)
    .attr("height", NODE_SIZE)
    .attr("x", -NODE_SIZE / 2)
    .attr("y", -NODE_SIZE / 2)
    .attr("class", "node-image");

  // Stocker les positions dans dataStore pour linksLayer
  // Fusionner avec les positions existantes (ex. bubbleCluster)
  // sans écraser les positions TAC déjà calculées
  positions.forEach((pos, id) => {
    dataStore.nodePositions[id] = pos;
  });

  // ── TOOLTIP ────────────────────────────────────
  nodeGroups
    .on("mouseenter", (event, d) => {
      showTooltip(event, buildNodeTooltip(d));
      d3.select(event.currentTarget)
        .select("image").style("filter", "brightness(1.25)");
      focusNodeLinks(d.id);
    })
    .on("mousemove",  (event) => moveTooltip(event))
    .on("mouseleave", (event) => {
      hideTooltip();
      d3.select(event.currentTarget)
        .select("image").style("filter", null);
      unfocusLinks();
    });

  console.log(`👤 nodesLayer : ${nodes.length} nodes dessinés`);
  console.log("   Positions calculées :", positions.size);
}

// --------------------------------------------------
// SHOW / HIDE
// --------------------------------------------------

export function showNodes() {
  gNodes.transition().duration(400).style("opacity", 1);
}

export function hideNodes() {
  gNodes.transition().duration(400).style("opacity", 0);
}