// ==================================================
// js/map/mapZoom.js
// Zoom interactif D3 sur la carte et le réseau
// version 3 mai 2026
// ==================================================

import { svg, gMap, gLinks, gNodes, gBubbleCluster, gServiceButtons } from "./mapInit.js";
import { updateBubbleCluster } from "../components/bubbleCluster.js";
import { drawOSM } from "./mapOSM.js";

export let gRoot;
export let zoomBehavior;
export let currentK = 1;

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const ZOOM_MIN      = 0.8;
const ZOOM_MAX      = 12;
const ZOOM_DURATION = 350;

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initZoom() {

  const width  = +svg.attr("width");
  const height = +svg.attr("height");

  // ── GROUPE RACINE ─────────────────────────────────
  // Inséré avant .ui-layer pour respecter la superposition
  gRoot = svg.insert("g", ".ui-layer")
    .attr("class", "root-layer");

  // Déplacer les couches de données dans gRoot
  gRoot.node().appendChild(gMap.node());
  gRoot.node().appendChild(gLinks.node());
  gRoot.node().appendChild(gBubbleCluster.node());
  gRoot.node().appendChild(gServiceButtons.node());
  gRoot.node().appendChild(gNodes.node());
  // ⚠️ gBasemap reste sur svg directement (vide) — le canvas
  // 2D gère les tuiles OSM, sans transformation SVG.

  // ── COMPORTEMENT ZOOM D3 ──────────────────────────
  zoomBehavior = d3.zoom()
    .scaleExtent([ZOOM_MIN, ZOOM_MAX])
    .on("zoom", onZoom);

  svg.call(zoomBehavior);

  // Premier rendu OSM au chargement
  drawOSM(width, height, d3.zoomIdentity);

  // Écouter le bouton reset zoom
  document.addEventListener("resetZoom", () => resetZoom());

  console.log("🔍 mapZoom : zoom interactif initialisé");
  console.log(`   Plage : ${ZOOM_MIN}x → ${ZOOM_MAX}x`);
}

// --------------------------------------------------
// HANDLER ZOOM — appelé à chaque frame
// --------------------------------------------------

function onZoom(event) {

  const transform = event.transform;
  currentK = transform.k;

  const width  = +svg.attr("width");
  const height = +svg.attr("height");

  // 1. Transformer le groupe racine (carte + liens + nodes)
  gRoot.attr("transform", transform);

  // 2. Recalculer les tuiles OSM pour la vue courante
  //    drawOSM redessine le canvas 2D — net, sans lignes blanches
  drawOSM(width, height, transform);

 // 3. Contre-scaler les nodes — taille visuelle constante
  counterScaleNodes(transform.k);

  // 3bis. Repositionner les boutons de service au zoom
  // (sans attendre un déplacement de la timeline)
  document.dispatchEvent(new CustomEvent("mapZoomChanged"));

  // 4. Mettre à jour le cercle TAC
  updateBubbleCluster(transform);
}

// --------------------------------------------------
// CONTRE-SCALING DES NODES
// --------------------------------------------------

function counterScaleNodes(k) {
  // Croissance partielle : les nodes grossissent au zoom
  // mais moins vite que la carte — facteur 0.4
  // k=1 → scale(1.0) taille normale
  // k=4 → scale(~1.6) un peu plus grand
  // k=12 → scale(~2.3) bien visible
  const growFactor = Math.pow(1 / k, 0.6);
  gNodes.selectAll("g.node-group")
    .attr("transform", function() {
      const current = d3.select(this).attr("transform") || "";
      const match = current.match(/translate\(([^)]+)\)/);
      if (!match) return current;
      return `translate(${match[1]}) scale(${growFactor})`;
    });
}

// --------------------------------------------------
// RESET
// --------------------------------------------------

export function resetZoom() {
  svg.transition()
    .duration(ZOOM_DURATION * 2)
    .call(zoomBehavior.transform, d3.zoomIdentity);
}

// --------------------------------------------------
// ZOOM PROGRAMMATIQUE (pour étape 6 si besoin)
// --------------------------------------------------

export function zoomToPoint(px, py, targetK = 3) {
  const width  = +svg.attr("width");
  const height = +svg.attr("height");

  const transform = d3.zoomIdentity
    .translate(width / 2 - targetK * px, height / 2 - targetK * py)
    .scale(targetK);

  svg.transition()
    .duration(ZOOM_DURATION * 2)
    .call(zoomBehavior.transform, transform);
}