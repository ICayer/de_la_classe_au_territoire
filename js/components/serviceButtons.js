// ==================================================
// js/components/serviceButtons.js
// Boutons pulse "+" pour les services documentés
// Apparaissent sur le node cible (target) quand la
// timeline atteint la date du service.
// Option A : animation pulse ripple/sonar
// Pattern MasterCayer V2 : initServiceButtons() + showServiceButtons()
// version 5 juin 2026 — support boutons multiples par node
// ==================================================

import { gServiceButtons } from "../map/mapInit.js";
import { currentK } from "../map/mapZoom.js";
import { dataStore } from "../data/dataStore.js";
import { COLOR_SERVICES } from "../utils/colors.js";
import { openServiceModal } from "./serviceModal.js";

// --------------------------------------------------
// DONNÉES DES SERVICES DOCUMENTÉS
// NB : un node peut porter plusieurs boutons (production sur
// 2 MRC ; node_mrc_09 porte production + représentation).
// → chaque entrée a un uid unique (basé sur linkId) qui sert
//   de classe SVG ; evt.id ne sert qu'à la couleur + data-service.
// --------------------------------------------------

const SERVICE_EVENTS = [
  {
    id:     "documentation",
    linkId: "link_001",
    target: "node_mandataire",
    date:   new Date("2024-06-19"),
    page:   "public/data/services/documentation.html"
  },
  {
    id:     "formation",
    linkId: "link_065",
    target: "node_mrc_14",
    date:   new Date("2026-01-19"),
    page:   "public/data/services/scenarisation.html"
  },
  {
    id:     "production",
    linkId: "link_016",
    target: "node_mrc_11",
    date:   new Date("2024-10-01"),
    page:   "public/data/services/production.html"
  },
  {
    id:     "production",
    linkId: "link_017",
    target: "node_mrc_09",
    date:   new Date("2024-10-01"),
    page:   "public/data/services/production.html"
  },
  {
    id:     "représentation",
    linkId: "link_066",
    target: "node_mrc_09",
    date:   new Date("2026-02-03"),
    page:   "public/data/services/representation.html"
  },
  {
    id:     "réseautage",
    linkId: "link_024",
    target: "node_mrc_10",
    date:   new Date("2025-02-07"),
    page:   "public/data/services/reseautage.html"
  },
  {
    id:     "expertise-conseil",
    linkId: "link_028",
    target: "node_mrc_07",
    date:   new Date("2025-03-12"),
    page:   "public/data/services/conseil.html"
  }
];

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const BTN_RADIUS = 10;  // rayon px à zoom k=1
const OFFSET_X   =  18; // bas-DROIT du node
const OFFSET_Y   =  18;
const STACK_STEP =  26; // décalage entre 2 boutons sur le même node

// uid unique par entrée — sert de classe SVG (linkId toujours unique)
function _uid(evt) {
  return evt.linkId;
}

// Pré-calcul : index d'empilement pour chaque entrée qui partage un node.
// La 1re entrée d'un node garde l'offset de base ; les suivantes sont
// décalées vers le bas pour éviter le chevauchement.
const _stackIndex = {};
(function computeStacks() {
  const seen = {};
  SERVICE_EVENTS.forEach(evt => {
    const n = seen[evt.target] ?? 0;
    _stackIndex[_uid(evt)] = n;
    seen[evt.target] = n + 1;
  });
})();

// --------------------------------------------------
// INIT — crée les groupes SVG, sans positionnement
// --------------------------------------------------

export function initServiceButtons() {

  SERVICE_EVENTS.forEach(evt => {
    const color = COLOR_SERVICES[evt.id] ?? "#888";
    const uid   = _uid(evt);

    const g = gServiceButtons.append("g")
      .attr("class", `service-btn service-btn--${uid} service-btn--svc-${evt.id}`)
      .attr("data-service", evt.id)
      .attr("data-link",    evt.linkId)
      .attr("data-target",  evt.target)
      .style("display", "none")
      .style("cursor", "pointer");

    // ── Anneau pulse 1 (ripple externe)
    g.append("circle")
      .attr("class",        "pulse-ring pulse-ring-1")
      .attr("r",            BTN_RADIUS + 8)
      .attr("fill",         "none")
      .attr("stroke",       color)
      .attr("stroke-width", "1.5")
      .attr("opacity",      "0");

    // ── Anneau pulse 2 (décalé — effet sonar double)
    g.append("circle")
      .attr("class",        "pulse-ring pulse-ring-2")
      .attr("r",            BTN_RADIUS + 8)
      .attr("fill",         "none")
      .attr("stroke",       color)
      .attr("stroke-width", "1")
      .attr("opacity",      "0");

    // ── Cercle de fond
    g.append("circle")
      .attr("class",   "pulse-bg")
      .attr("r",       BTN_RADIUS)
      .attr("fill",    color)
      .attr("opacity", "0.92");

    // ── Icône "+"
    g.append("text")
      .attr("class",             "pulse-icon")
      .attr("text-anchor",       "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size",         "14px")
      .attr("font-weight",       "700")
      .attr("fill",              "#ffffff")
      .attr("pointer-events",    "none")
      .text("+");

    // ── Clic → ouvre la modal
    g.on("click", (event) => {
      event.stopPropagation();
      openServiceModal(evt);
    });

    // ── Survol — grossissement léger
    g.on("mouseenter", function() {
      d3.select(this).select(".pulse-bg")
        .transition().duration(150)
        .attr("r", BTN_RADIUS * 1.3);
    });
    g.on("mouseleave", function() {
      d3.select(this).select(".pulse-bg")
        .transition().duration(150)
        .attr("r", BTN_RADIUS);
    });
  });

  console.log(`🔘 serviceButtons : ${SERVICE_EVENTS.length} boutons initialisés (pulse Option A)`);
}

// --------------------------------------------------
// UPDATE — appelé par timeSlider à chaque tick
// --------------------------------------------------

export function updateServiceButtons(dateActive) {
  gServiceButtons.raise();

  const k = currentK || 1;
  const scale = Math.pow(1 / k, 0.6);

  SERVICE_EVENTS.forEach(evt => {
    const uid = _uid(evt);
    const btn = gServiceButtons.select(`.service-btn--${uid}`);
    if (btn.empty()) return;

    const visible = dateActive >= evt.date;
    const currentDisplay = btn.style("display");

    if (visible) {
      const pos = dataStore.nodePositions[evt.target];
      if (!pos) return;
      // décalage vertical si plusieurs boutons sur le même node
      const stack = _stackIndex[uid] || 0;
      const tx = pos.px + OFFSET_X;
      const ty = pos.py + OFFSET_Y + stack * STACK_STEP;

      if (currentDisplay === "none") {
        btn.style("display", null)
           .classed("pulsing", true)
           .raise()
           .attr("transform", `translate(${tx},${ty}) scale(0)`)
           .transition().duration(450).ease(d3.easeBounceOut)
           .attr("transform", `translate(${tx},${ty}) scale(${scale})`);
      } else {
        btn.attr("transform", `translate(${tx},${ty}) scale(${scale})`);
      }

    } else if (currentDisplay !== "none") {
      btn.style("display", "none").classed("pulsing", false);
    }
  });
}

// --------------------------------------------------
// SHOW / HIDE — pattern MasterCayer
// --------------------------------------------------

export function showServiceButtons() {
  gServiceButtons.style("display", null);
}

export function hideServiceButtons() {
  gServiceButtons.style("display", "none");
}
