// ==================================================
// js/components/bubbleCluster.js
// Cercle "Communauté TAC" — regroupe le mandataire
// et les scientifiques dans un cluster visuel fixe
// positionné hors des polygones MRC.
//
// Conventions MasterCayer :
//   - initBubbleCluster() → dessine le cercle + simulation
//   - Les positions des nodes TAC sont stockées dans
//     dataStore.nodePositions (comme nodesLayer)
//   - Le cercle suit le zoom via gBubbleCluster (dans gRoot)
// version 2 mai 2026
// ==================================================

import { dataStore }                          from "../data/dataStore.js";
import { gBubbleCluster, projection }         from "../map/mapInit.js";
import { t }                                  from "../utils/i18n.js";
import { COLOR_NODES, COLOR_BUBBLE_FILL, COLOR_BUBBLE_STROKE }      from "../utils/colors.js";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

// Point d'ancrage géographique du centre du cercle
// (dans le fleuve, hors polygones MRC)
const ANCHOR_LON = -72.443848;
const ANCHOR_LAT =  50.868378;


// Rayon de base + facteur par node supplémentaire
const CLUSTER_RADIUS_BASE   = 60;   // px à zoom initial
const CLUSTER_RADIUS_FACTOR = 12;   // px par node TAC

// Rayon des nodes à l'intérieur du cercle
const NODE_RADIUS = 18;

// --------------------------------------------------
// ÉTAT INTERNE
// --------------------------------------------------

let clusterCenter = null;   // {x, y} en coordonnées SVG
let clusterRadius = 0;
let tacNodes      = [];

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initBubbleCluster() {

  // 1. Filtrer les nodes TAC
  tacNodes = dataStore.nodes.filter(d => d.cluster === "tac");

  if (tacNodes.length === 0) {
    console.warn("⚠️ bubbleCluster : aucun node avec cluster='tac'");
    return;
  }

  // 2. Calculer le centre en coordonnées SVG
  clusterCenter = {
    x: projection([ANCHOR_LON, ANCHOR_LAT])[0],
    y: projection([ANCHOR_LON, ANCHOR_LAT])[1]
  };

  // 3. Calculer le rayon selon le nombre de nodes
  clusterRadius = CLUSTER_RADIUS_BASE + tacNodes.length * CLUSTER_RADIUS_FACTOR;

  // 4. Simulation de force pour disposer les nodes
  //    à l'intérieur du cercle
  _runSimulation();

  // 5. Dessiner le cercle et les nodes
  _draw();

  // Mise à jour langue
  document.addEventListener("d3LangueChanged", () => {
    gBubbleCluster.select(".cluster-label textPath")
      .text(t("cluster.label"));
  });

  console.log(`🔵 bubbleCluster : ${tacNodes.length} nodes TAC, r=${clusterRadius}px`);
}

// --------------------------------------------------
// SIMULATION DE FORCE
// Positionne les nodes à l'intérieur du cercle
// --------------------------------------------------

function _runSimulation() {

  const cx = clusterCenter.x;
  const cy = clusterCenter.y;

  // Initialiser les positions autour du centre
    tacNodes.forEach((d, i) => {
    const angle = (i / tacNodes.length) * 2 * Math.PI;
    d.x = cx + (clusterRadius * 0.3) * Math.cos(angle);
    d.y = cy + (clusterRadius * 0.3) * Math.sin(angle);
  });

  // Trouver le mandataire pour le centrer
  const mandataire = tacNodes.find(d => d.categorie === "mandataire");
  if (mandataire) {
    mandataire.x  = cx;
    mandataire.y  = cy;
    mandataire.fx = cx;
    mandataire.fy = cy;
  }

  // Simulation
  d3.forceSimulation(tacNodes)
    .force("radial",  d3.forceRadial(
      d => d.categorie === "mandataire" ? 0 : clusterRadius * 0.55,
      cx, cy
    ).strength(0.8))
    .force("collide", d3.forceCollide(NODE_RADIUS + 3).strength(0.9))
    .force("center",  d3.forceCenter(cx, cy).strength(0.05))
    .stop()
    .tick(300);  // simulation statique — pas d'animation

  // Stocker les positions dans dataStore.nodePositions
  tacNodes.forEach(d => {
    dataStore.nodePositions[d.id] = { x: d.x, y: d.y };
  });
}

// --------------------------------------------------
// DESSIN
// --------------------------------------------------

function _draw() {

  const cx = clusterCenter.x;
  const cy = clusterCenter.y;

  gBubbleCluster.selectAll("*").remove();

  // ── Cercle englobant ──────────────────────────────
  gBubbleCluster.append("circle")
    .attr("class", "cluster-ring")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r",  clusterRadius)
    .attr("fill",   COLOR_BUBBLE_FILL)
    .attr("stroke", COLOR_BUBBLE_STROKE)
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "6,4")
    .style("pointer-events", "none");  // ← ajouter cette ligne;

  // ── Arc path pour le textPath ─────────────────────
  // Arc supérieur du cercle, de -150° à -30° (sens horaire)
  const arcR     = clusterRadius + 14;
  const startRad = (-150 * Math.PI) / 180;
  const endRad   = (-30  * Math.PI) / 180;
  const x1 = cx + arcR * Math.cos(startRad);
  const y1 = cy + arcR * Math.sin(startRad);
  const x2 = cx + arcR * Math.cos(endRad);
  const y2 = cy + arcR * Math.sin(endRad);
  const arcPathD = `M ${x1} ${y1} A ${arcR} ${arcR} 0 0 1 ${x2} ${y2}`;

  const defs = gBubbleCluster.append("defs");
  defs.append("path")
    .attr("id",  "cluster-arc-path")
    .attr("d",   arcPathD);

  // ── Label sur l'arc ───────────────────────────────
  gBubbleCluster.append("text")
    .attr("class", "cluster-label")
    .attr("fill",        COLOR_BUBBLE_STROKE)
    .attr("font-size",   "18px")
    .attr("font-weight", "500")
    .attr("font-family", "var(--font-body, serif)")
    .style("pointer-events", "none")
    .append("textPath")
    .attr("href",        "#cluster-arc-path")
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(t("cluster.label"));
}

// --------------------------------------------------
// MISE À JOUR AU ZOOM
// Recalcule le centre en coordonnées écran courantes
// et redessine. Appelée depuis mapZoom.js.
// --------------------------------------------------

export function updateBubbleCluster(transform) {
  // gBubbleCluster est dans gRoot — le transform est déjà appliqué
  // automatiquement. Rien à faire ici.
}