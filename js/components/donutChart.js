// ==================================================
// js/components/donutChart.js
// version 27 avril 2026
// ==================================================

import { gNodes } from "../map/mapInit.js";
import { dataStore } from "../data/dataStore.js";
import { COLOR_SERVICES } from "../utils/colors.js";

const NODE_RADIUS  = 18;
const DONUT_WIDTH  = 9;
const OUTER_RADIUS = NODE_RADIUS + 2 + DONUT_WIDTH;
const SERVICE_KEYS = Object.keys(COLOR_SERVICES);

// Snapshot du dernier état — pour détecter les nouveaux segments
// Map : nodeId → Set de clés de services déjà présents
const prevState = new Map();

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initDonutCharts() {
  const links = dataStore.links;
  const nodes = dataStore.nodes;
  if (!links || !nodes) {
    console.warn("⚠️ donutChart : données manquantes");
    return;
  }
  prevState.clear();

  // On part de minDate (même logique que le timeSlider)
  // pour n'afficher que les services du premier événement
 // Démarrer avec une date vide — aucun donut visible au départ
  const initLinks = [];

  _render(initLinks, true);
  console.log("🍩 donutCharts initialisés depuis minDate");
}

// --------------------------------------------------
// UPDATE — appelé à chaque tick de la timeline
// --------------------------------------------------

export function updateDonutCharts(currentDate) {
  const allLinks = dataStore.links;
  if (!allLinks || !currentDate) return;
  const activeLinks = allLinks.filter(d => d.date <= currentDate);
  _render(activeLinks, false);
}

// --------------------------------------------------
// RENDU INTERNE
// animate=true  → pas de transition (init)
// animate=false → transition sur les nouveaux segments
// --------------------------------------------------

function _render(links, skipAnimation) {

  const servicesParNode = buildServicesParNode(links);

  const pie = d3.pie().value(d => d.count).sort(null);
  const arc = d3.arc()
    .innerRadius(NODE_RADIUS + 2)
    .outerRadius(OUTER_RADIUS);

  gNodes.selectAll("g.node-group").each(function(d) {

    const g        = d3.select(this);
    const nodeData = servicesParNode.get(d.id);
    const prev     = prevState.get(d.id) ?? new Set();

    // Aucun service → retirer le donut si présent
    if (!nodeData || nodeData.total === 0) {
      g.selectAll("path.donut-slice")
        .transition().duration(300)
        .attr("opacity", 0)
        .remove();
      prevState.delete(d.id);
      return;
    }

    const segments = SERVICE_KEYS
      .map(key => ({ key, count: nodeData.counts[key] ?? 0 }))
      .filter(s => s.count > 0);

    if (segments.length === 0) return;

    // Clés actuelles
    const currKeys = new Set(segments.map(s => s.key));

    // DATA JOIN avec clé = service key
    const slices = g.selectAll("path.donut-slice")
      .data(pie(segments), p => p.data.key);

    // EXIT — segments qui disparaissent
    slices.exit()
      .transition().duration(300)
      .attr("opacity", 0)
      .remove();

    // ENTER — nouveaux segments
    const entering = slices.enter()
      .append("path")
      .attr("class", "donut-slice")
      .attr("fill",         p => COLOR_SERVICES[p.data.key] ?? "#888")
      .attr("stroke",       "rgba(235, 234, 233, 0.4)")
      .attr("stroke-width", 0.5)
      .attr("pointer-events", "none")
      .attr("d", arc);

    // Animation uniquement sur les vrais nouveaux segments
    // (ceux qui n'existaient pas au tick précédent)
    if (!skipAnimation) {
      entering
        .filter(p => !prev.has(p.data.key))  // seulement les nouveaux
        .attr("opacity", 0)
        .transition().duration(600).ease(d3.easeCubicOut)
        .attr("opacity", 0.92);

      // Segments déjà présents → opacité directe sans transition
      entering
        .filter(p => prev.has(p.data.key))
        .attr("opacity", 0.92);
    } else {
      entering.attr("opacity", 0.92);
    }

    // UPDATE — segments existants (mise à jour de l'arc si poids change)
    slices.attr("d", arc).attr("opacity", 0.92);

    // Mettre à jour le snapshot
    prevState.set(d.id, currKeys);
  });
}

// --------------------------------------------------
// UTILITAIRE
// --------------------------------------------------

function buildServicesParNode(links) {
  const map = new Map();
  links.forEach(link => {
    [link.source, link.target].forEach(nodeId => {
      if (!map.has(nodeId)) map.set(nodeId, { counts: {}, total: 0 });
      const entry    = map.get(nodeId);
      const svc      = link.service;
      entry.counts[svc] = (entry.counts[svc] ?? 0) + 1;
      entry.total++;
    });
  });
  return map;
}