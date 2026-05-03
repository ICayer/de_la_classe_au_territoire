// ==================================================
// js/layers/linksLayer.js
// Dessine les liens du réseau sur gLinks
// Épaisseur = poids agrégé (nb d'événements)
// Pattern MasterCayer : init / show / hide
//
// Deux corrections vs version précédente :
// 1. Zone de détection invisible (hit area 12px)
//    Les <line> fines sont quasi-impossibles à survoler.
//    On superpose une ligne transparente épaisse sur chaque
//    lien visible — seule cette ligne capte les événements souris.
// 2. Tooltip rebindé dans updateLinks()
//    updateLinks() recrée les lignes via enter/update/exit.
//    Les nouveaux liens entrants n'avaient pas d'événements.
//    On appelle bindLinkTooltips() après chaque DATA JOIN.
// version 3 mai 2026
// ==================================================

import { gLinks } from "../map/mapInit.js";
import { dataStore } from "../data/dataStore.js";
import { showTooltip, moveTooltip, hideTooltip, buildLinkTooltip } from "../components/tooltip.js";
import { COLOR_SERVICES, COLOR_LINK_DEFAULT, COLOR_LINK_BB, COLOR_LINK_CLUSTER, LINK_OPACITY_CLUSTER, LINK_OPACITY_DEFAULT, LINK_OPACITY_BB, LINK_DASHARRAY_CLUSTER } from "../utils/colors.js";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const STROKE_SCALE = d3.scaleLinear()
  .domain([1, 15])
  .range([1, 8])
  .clamp(true);

// Couleur d'un lien selon son service et son type
function linkColor(d) {
  const sourceNode = dataStore.nodes.find(n => n.id === d.source);
  const targetNode = dataStore.nodes.find(n => n.id === d.target);
  const bothBenef  = sourceNode?.categorie === "beneficiaire" &&
                     targetNode?.categorie === "beneficiaire";
  return bothBenef ? COLOR_LINK_BB : COLOR_LINK_DEFAULT;
}

function linkOpacity(d) { return 1; }

function linkDashArray(d) {
  const isCluster = (d.source === "node_mandataire" || d.target === "node_mandataire") &&
    dataStore.nodes.find(n => n.id === (d.source === "node_mandataire" ? d.target : d.source))?.cluster === "tac";
  return isCluster ? LINK_DASHARRAY_CLUSTER : null;
}

// Épaisseur de la zone de détection invisible (hit area)
const HIT_WIDTH = 14;

function _dominantService(source, target) {
  const events = dataStore.links.filter(
    d => (d.source === source && d.target === target) ||
         (d.source === target && d.target === source)
  );
  const counts = d3.rollup(events, v => v.length, d => d.service);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "documentation";
}

function bezierPath(d) {
  const dx = d.x2 - d.x1;
  const dy = d.y2 - d.y1;
  const mid_x = (d.x1 + d.x2) / 2;
  const mid_y = (d.y1 + d.y2) / 2;
  const len = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(len * 0.25, 80);
  const cx = mid_x - (dy / len) * offset;
  const cy = mid_y + (dx / len) * offset;
  return `M${d.x1},${d.y1} Q${cx},${cy} ${d.x2},${d.y2}`;
}

// --------------------------------------------------
// UTILITAIRE — préparer les liens avec positions pixel
// --------------------------------------------------

function buildLinksWithPos(links, positions) {
  return links
    .map(link => {
      const posSource = positions[link.source];
      const posTarget = positions[link.target];
      if (!posSource || !posTarget) return null;
      return {
        ...link,
        x1: posSource.px ?? posSource.x,
        y1: posSource.py ?? posSource.y,
        x2: posTarget.px ?? posTarget.x,
        y2: posTarget.py ?? posTarget.y,
        service: link.service ?? _dominantService(link.source, link.target),
        isSecondary: link.source !== "node_mandataire" &&
                     link.target !== "node_mandataire"
      };
    })
    .filter(Boolean);
}

// --------------------------------------------------
// UTILITAIRE — binder les tooltips sur les hit areas
// Appelé après chaque DATA JOIN (init ET update)
// --------------------------------------------------

function bindLinkTooltips() {
  gLinks.selectAll("path.link-hit")
    .on("mouseenter", (event, d) => {
      showTooltip(event, buildLinkTooltip(d));
      // Mettre en valeur le lien visible correspondant
      gLinks.selectAll("path.network-link")
        .filter(l => l.source === d.source && l.target === d.target)
        .attr("stroke-width", l => STROKE_SCALE(l.poids) + 3)
        .attr("stroke-opacity", 1);
    })
    .on("mousemove",  (event) => moveTooltip(event))
    .on("mouseleave", (event, d) => {
      hideTooltip();
      gLinks.selectAll("path.network-link")
        .filter(l => l.source === d.source && l.target === d.target)
        .attr("stroke-width", l => STROKE_SCALE(l.poids))
        .attr("stroke-opacity", null);
    });
}

// --------------------------------------------------
// FOCUS — appelé par nodesLayer au survol d'un node
// --------------------------------------------------

export function focusNodeLinks(nodeId) {
  gLinks.selectAll("path.network-link")
    .transition().duration(200)
    .attr("stroke-opacity", d =>
      (d.source === nodeId || d.target === nodeId) ? 1 : 0.08
    );
}

export function unfocusLinks() {
  gLinks.selectAll("path.network-link")
    .transition().duration(200)
    .attr("stroke-opacity", 1);
}

// --------------------------------------------------
// INIT — dessine tous les liens agrégés (statique)
// --------------------------------------------------

export function initLinksLayer() {

  const links     = dataStore.linksAggregated;
  const positions = dataStore.nodePositions;

  if (!links || !positions) {
    console.warn("⚠️ linksLayer : données manquantes", { links, positions });
    return;
  }

  const linksWithPos = buildLinksWithPos(links, positions);

  // ── LIGNES VISIBLES ────────────────────────────
  gLinks
    .selectAll("path.network-link")
    .data(linksWithPos, d => `${d.source}--${d.target}`)
    .join("path")
    .attr("class",          d => `network-link ${d.isSecondary ? "link-secondary" : "link-primary"}`)
    .attr("d",              d => bezierPath(d))
    .attr("stroke",         d => linkColor(d))
    .attr("stroke-opacity", d => linkOpacity(d))
    .attr("stroke-dasharray", d => linkDashArray(d))
    .attr("stroke-width",   d => STROKE_SCALE(d.poids))
    .attr("stroke-linecap", "round")
    .attr("fill",           "none")
    .attr("pointer-events", "none");

  gLinks
    .selectAll("path.link-hit")
    .data(linksWithPos, d => `${d.source}--${d.target}`)
    .join("path")
    .attr("class", "link-hit")
    .attr("d",     d => bezierPath(d))
    .attr("stroke", "transparent")
    .attr("stroke-width",   HIT_WIDTH)
    .attr("stroke-linecap", "round")
    .attr("fill",           "none")
    .attr("cursor", "crosshair");

  bindLinkTooltips();

  console.log(`🔗 linksLayer : ${linksWithPos.length} liens dessinés`);
  console.log(`   Primaires : ${linksWithPos.filter(l => !l.isSecondary).length}`);
  console.log(`   Secondaires : ${linksWithPos.filter(l => l.isSecondary).length}`);
}

// --------------------------------------------------
// UPDATE — filtre cumulatif selon la date courante
// Appelé par timeSlider
// --------------------------------------------------

export function updateLinks(currentDate) {

  const allLinks  = dataStore.links;
  const positions = dataStore.nodePositions;

  if (!allLinks || !positions || !currentDate) return;

  // Filtrer et reagréger
  const activeEvents = allLinks.filter(d => d.date <= currentDate);

  const grouped = d3.rollup(
    activeEvents,
    v => v.length,
    d => d.source,
    d => d.target
  );

  const linksWithPos = [];
  grouped.forEach((targets, source) => {
    targets.forEach((poids, target) => {
      const posSource = positions[source];
      const posTarget = positions[target];
      if (!posSource || !posTarget) return;
      linksWithPos.push({
        source, target, poids,
        x1: posSource.px ?? posSource.x,
        y1: posSource.py ?? posSource.y,
        x2: posTarget.px ?? posTarget.x,
        y2: posTarget.py ?? posTarget.y,
        service: _dominantService(source, target),
        isSecondary: source !== "node_mandataire" && target !== "node_mandataire"
      });
    });
  });

  // ── LIGNES VISIBLES ────────────────────────────
 gLinks
    .selectAll("path.network-link")
    .data(linksWithPos, d => `${d.source}--${d.target}`)
    .join(
      enter => enter
        .append("path")
        .attr("class",          d => `network-link ${d.isSecondary ? "link-secondary" : "link-primary"}`)
        .attr("d",              d => bezierPath(d))
        .attr("stroke",         d => linkColor(d))
        .attr("stroke-opacity", d => linkOpacity(d))
        .attr("stroke-dasharray", d => linkDashArray(d))
        .attr("stroke-linecap", "round")
        .attr("fill",           "none")
        .attr("pointer-events", "none")
        .attr("stroke-width", 0)
        .call(enter => enter.transition().duration(600)
          .attr("stroke-width", d => STROKE_SCALE(d.poids))
        ),
      update => update.transition().duration(300)
        .attr("stroke-width", d => STROKE_SCALE(d.poids)),
      exit => exit.transition().duration(300)
        .attr("stroke-width", 0).remove()
    );

  // ── HIT AREAS — recréées à chaque update ───────
  // Les hit areas ne sont pas animées (pas de transition)
  // pour rester toujours cliquables même pendant l'animation
  gLinks
    .selectAll("path.link-hit")
    .data(linksWithPos, d => `${d.source}--${d.target}`)
    .join(
      enter => enter
        .append("path")
        .attr("class",  "link-hit")
        .attr("d",      d => bezierPath(d))
        .attr("stroke", "transparent")
        .attr("fill",   "none")
        .attr("stroke-width",   HIT_WIDTH)
        .attr("stroke-linecap", "round")
        .attr("cursor",         "crosshair"),
      update => update, // position inchangée
      exit => exit.remove()
    );

  // Rebinder les tooltips sur toutes les hit areas
  // (y compris les nouvelles entrantes)
  bindLinkTooltips();
}

// --------------------------------------------------
// SHOW / HIDE
// --------------------------------------------------

export function showLinks() {
  gLinks.transition().duration(400).style("opacity", 1);
}

export function hideLinks() {
  gLinks.transition().duration(400).style("opacity", 0);
}