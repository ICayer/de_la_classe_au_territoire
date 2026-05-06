// ==================================================
// js/components/serviceButtons.js
// Boutons pulse "+" pour les 6 services documentés
// Apparaissent sur le node cible (target) quand la
// timeline atteint la date du service.
// Option A : animation pulse ripple/sonar
// Pattern MasterCayer V2 : initServiceButtons() + showServiceButtons()
// version 6 mai 2026
// ==================================================

import { gServiceButtons } from "../map/mapInit.js";
import { currentK } from "../map/mapZoom.js";
import { dataStore } from "../data/dataStore.js";
import { COLOR_SERVICES } from "../utils/colors.js";
import { openServiceModal } from "./serviceModal.js";

// --------------------------------------------------
// DONNÉES DES 6 SERVICES DOCUMENTÉS
// --------------------------------------------------

const SERVICE_EVENTS = [
  {
    id:     "documentation",
    linkId: "link_010",
    target: "node_mrc_01",
    date:   new Date("2024-09-09"),
    page:   "public/data/services/documentation.html"
  },
  {
    id:     "formation",
    linkId: "link_073",
    target: "node_sci_04",
    date:   new Date("2025-11-06"),
    page:   "public/data/services/formation.html"
  },
  {
    id:     "production",
    linkId: "link_066",
    target: "node_mrc_11",
    date:   new Date("2024-10-01"),
    page:   "public/data/services/production.html"
  },
  {
    id:     "représentation",
    linkId: "link_082",
    target: "node_mrc_09",
    date:   new Date("2026-02-03"),
    page:   "public/data/services/representation.html"
  },
  {
    id:     "réseautage",
    linkId: "link_030",
    target: "node_mrc_10",
    date:   new Date("2025-02-07"),
    page:   "public/data/services/reseautage.html"
  },
  {
    id:     "expertise-conseil",
    linkId: "link_032",
    target: "node_mrc_07",
    date:   new Date("2025-03-12"),
    page:   "public/data/services/expertise-conseil.html"
  }
];

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------
 
const BTN_RADIUS = 10;  // rayon px à zoom k=1
const OFFSET_X   =  18; // bas-DROIT du node
const OFFSET_Y   =  18;
 
// --------------------------------------------------
// INIT — crée les groupes SVG, sans positionnement
// (nodePositions pas encore disponible à ce stade)
// --------------------------------------------------
 
export function initServiceButtons() {
 
  SERVICE_EVENTS.forEach(evt => {
    const color = COLOR_SERVICES[evt.id] ?? "#888";
 
    const g = gServiceButtons.append("g")
      .attr("class", `service-btn service-btn--${evt.id}`)
      .attr("data-service", evt.id)
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
 
  console.log("🔘 serviceButtons : 6 boutons initialisés (pulse Option A)");
}
 
// --------------------------------------------------
// UPDATE — appelé par timeSlider à chaque tick
// Gère apparition, contre-scaling et pulse
// --------------------------------------------------
 
export function updateServiceButtons(dateActive) {
 
  // S'assurer que gServiceButtons est le dernier enfant de gRoot
  // → visuellement au-dessus des donuts (qui sont dans gNodes)
  gServiceButtons.raise();

  // Contre-scaling — même formule que counterScaleNodes dans mapZoom.js
  // Les boutons sont dans gRoot (ils zooment avec la carte)
  // → on compense pour garder une taille visuelle constante au zoom
  const k = currentK || 1;
  const scale = Math.pow(1 / k, 0.6);
 
  SERVICE_EVENTS.forEach(evt => {
    const btn = gServiceButtons.select(`.service-btn--${evt.id}`);
    if (btn.empty()) return;
 
    const visible = dateActive >= evt.date;
    const currentDisplay = btn.style("display");
 
    if (visible) {
      const pos = dataStore.nodePositions[evt.target];
      if (!pos) return;
      const tx = pos.px + OFFSET_X;
      const ty = pos.py + OFFSET_Y;
 
      if (currentDisplay === "none") {
        // Première apparition — animation bounce + activation pulse
        btn.style("display", null)
           .classed("pulsing", true)
           .raise() // passe au-dessus des donut-slices dans le DOM SVG
           .attr("transform", `translate(${tx},${ty}) scale(0)`)
           .transition().duration(450).ease(d3.easeBounceOut)
           .attr("transform", `translate(${tx},${ty}) scale(${scale})`);
      } else {
        // Mise à jour silencieuse — recalcul scale pendant le zoom
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