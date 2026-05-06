// ==================================================
// js/main.js
// version 6 mai 2026
// ==================================================

import { loadAllData }               from "./data/dataLoader.js";
import { initMap }                   from "./map/mapInit.js";
import { initZoom }                  from "./map/mapZoom.js";
import { initMRCLayer, showMRCs }    from "./layers/mrcLayer.js";
import { initNodesLayer, showNodes } from "./layers/nodesLayer.js";
import { initLinksLayer, showLinks } from "./layers/linksLayer.js";
import { initTimeSlider }            from "./controls/timeSlider.js";
import { initTooltip }               from "./components/tooltip.js";
import { initLegend }                from "./components/legend.js";
import { initDonutCharts }           from "./components/donutChart.js";
import { initBubbleCluster }         from "./components/bubbleCluster.js";
import { initUIControls }            from "./controls/uiControls.js";
import { initServiceButtons }        from "./components/serviceButtons.js";
import { initServiceModal }          from "./components/serviceModal.js";

async function init() {

  // ── DONNÉES ──────────────────────────────────────
  await loadAllData();

  // ── CARTE ────────────────────────────────────────
  // Ordre impératif — ne jamais modifier
  const { width, height } = initMap();
  initMRCLayer(width, height);
  initZoom();

  // ── TOOLTIP + LÉGENDE ────────────────────────────
  // Doivent être initialisés AVANT les layers qui les utilisent
  initTooltip();
  initLegend();
  initUIControls();

  // ── RÉSEAU ───────────────────────────────────────
  initBubbleCluster();
  initNodesLayer();
  initLinksLayer();

  // ── DONUTS ───────────────────────────────────────
  // Doit être appelé APRÈS initNodesLayer() (les g.node-group existent)
  // et APRÈS initLinksLayer() (les données de services sont disponibles)
  initDonutCharts();

  // ── SERVICES ─────────────────────────────────────
  // initServiceModal() AVANT initServiceButtons()
  // car serviceButtons importe openServiceModal depuis serviceModal
  // initServiceButtons() APRÈS initNodesLayer() — nodePositions doit être rempli
  initServiceModal();
  initServiceButtons();

  // ── AFFICHAGE ────────────────────────────────────
  showMRCs();
  showNodes();
  showLinks();

  // ── TIMELINE ─────────────────────────────────────
  // initTimeSlider() doit être appelé APRÈS initLinksLayer()
  // car il appelle updateLinks() dès l'initialisation
  initTimeSlider();

  console.log("🟢 main : initialisation complète — services actifs");
}

init();