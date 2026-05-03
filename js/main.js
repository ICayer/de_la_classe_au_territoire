// ==================================================
// js/main.js — ÉTAPE 6 : timeSlider
// version 3 mai 2026
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
import { initUIControls } from "./controls/uiControls.js";

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

  // ── AFFICHAGE ────────────────────────────────────
  showMRCs();
  showNodes();
  showLinks();

  // ── TIMELINE ─────────────────────────────────────
  // initTimeSlider() doit être appelé APRÈS initLinksLayer()
  // car il appelle updateLinks() dès l'initialisation
  initTimeSlider();

  console.log("🟢 Étape 6 terminée — timeSlider actif");
}

init();