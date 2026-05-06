// ==================================================
// js/controls/timeSlider.js
// Ligne du temps interactive — jan 2024 → jan 2030
// Interactions : drag · Play/Pause · Reset
// Comportement : cumulatif (les liens restent visibles)
// version 2 mai 2026
// ==================================================

import { dataStore } from "../data/dataStore.js";
import { updateLinks } from "../layers/linksLayer.js";
import { state } from "../state.js";
import { t, getLocale } from "../utils/i18n.js";
import { updateDonutCharts } from "../components/donutChart.js";
import { updateServiceButtons } from "../components/serviceButtons.js";

// --------------------------------------------------
// CONFIGURATION — ajuster ici sans toucher au code
// --------------------------------------------------

// Durée totale d'une lecture Play complète (ms)
// 12 000ms = 12 secondes pour parcourir jan 2024 → jan 2030
const PLAY_DURATION_MS = 12000;

// Fréquence des ticks du timer (ms) — plus petit = plus fluide
const TICK_MS = 50;
const THROTTLE_MS = 100; // mise à jour visuelle max toutes les 100ms
const MARGIN = { left: 120, right: 40, top: 28 };

// --------------------------------------------------
// ÉTAT INTERNE
// --------------------------------------------------

let svg, xScale, handle, trackFill, dateLabel, playBtn;
let isPlaying    = false;
let timer        = null;
let currentDate  = null;
let isThrottled  = false;
let trackFuture  = null;

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initTimeSlider() {

  const container = document.getElementById("timeline-container");
  if (!container) {
    console.warn("⚠️ timeSlider : #timeline-container introuvable");
    return;
  }

  const startDate = new Date("2024-07-01");
  const minDate   = startDate;
  const maxDate   = new Date("2030-01-01");
  const width   = container.clientWidth;
  const height  = container.clientHeight;

  // Démarrer 30 jours avant le premier événement
  // pour que la carte commence vide
  startDate.setDate(startDate.getDate() - 30);
  currentDate      = new Date(startDate);
  state.dateActive = startDate;

  // ── SVG ──────────────────────────────────────────
  svg = d3.select("#timeline-container")
    .append("svg")
    .attr("width",  width)
    .attr("height", height);

  // ── ÉCHELLE ───────────────────────────────────────
  xScale = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([MARGIN.left, width - MARGIN.right]);

  const trackY = MARGIN.top + 12;

  // ── RAIL ─────────────────────────────────────────
  svg.append("line")
    .attr("x1", xScale.range()[0]).attr("x2", xScale.range()[1])
    .attr("y1", trackY).attr("y2", trackY)
    .attr("stroke", "rgba(255,255,255,0.15)")
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round");

  // ── FILL (portion parcourue) ──────────────────────
  trackFill = svg.append("line")
    .attr("x1", xScale.range()[0]).attr("x2", xScale(currentDate))
    .attr("y1", trackY).attr("y2", trackY)
    .attr("stroke", "rgba(255,255,255,0.75)")
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round");

// ── RAIL FUTUR (après dernière donnée réelle) ─────
  trackFuture = svg.append("line")
    .attr("x1", xScale(dataStore.maxDate)).attr("x2", xScale.range()[1])
    .attr("y1", trackY).attr("y2", trackY)
    .attr("stroke", "rgba(255,255,255,0.08)")
    .attr("stroke-width", 4)
    .attr("stroke-dasharray", "4,6")
    .attr("stroke-linecap", "round");

    // ── HIT AREA du rail — pause au clic ─────────────
  svg.append("line")
    .attr("x1", xScale.range()[0]).attr("x2", xScale.range()[1])
    .attr("y1", trackY).attr("y2", trackY)
    .attr("stroke", "transparent")
    .attr("stroke-width", 20)
    .attr("cursor", "pointer")
    .on("click", (event) => {
      pausePlay();
      const x = Math.max(xScale.range()[0], Math.min(xScale.range()[1], event.offsetX));
      moveTo(xScale.invert(x));
    });

  // ── TICKS tous les 6 mois ─────────────────────────
  const ticks = d3.timeMonth.every(6).range(minDate, maxDate);
  const tickG = svg.append("g").attr("class", "time-ticks");

  tickG.selectAll("line")
    .data(ticks).join("line")
    .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
    .attr("y1", trackY - 5).attr("y2", trackY + 5)
    .attr("stroke", "rgba(255,255,255,0.25)")
    .attr("stroke-width", 1);

  tickG.selectAll("text")
    .data(ticks).join("text")
    .attr("x", d => xScale(d))
    .attr("y", trackY + 20)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,0.45)")
    .attr("font-size", "11px")
    .attr("font-family", "var(--font-body, serif)")
    .text(d => formatDate(d));

  // ── CURSEUR draggable ────────────────────────────
  handle = svg.append("circle")
    .attr("cx", xScale(currentDate))
    .attr("cy", trackY)
    .attr("r",  8)
    .attr("fill", "#ffffff")
    .attr("stroke", "rgba(255,255,255,0.4)")
    .attr("stroke-width", 2)
    .attr("cursor", "grab")
    .call(d3.drag()
      .on("start", () => { pausePlay(); handle.attr("cursor", "grabbing"); })
      .on("drag",  (event) => {
        const x = Math.max(xScale.range()[0], Math.min(xScale.range()[1], event.x));
        moveTo(xScale.invert(x));
      })
      .on("end", () => handle.attr("cursor", "grab"))
    );

  // ── LABEL date courante au-dessus du curseur ──────
  dateLabel = svg.append("text")
    .attr("x", xScale(currentDate))
    .attr("y", trackY - 16)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffffff")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("font-family", "var(--font-body, serif)")
    .text(formatDate(currentDate));

  // ── BOUTON PLAY/PAUSE (gauche) ────────────────────
  playBtn = svg.append("g")
    .attr("cursor", "pointer")
    .attr("transform", `translate(30, ${trackY})`)
    .on("click", togglePlay);

  playBtn.append("circle")
    .attr("r", 16)
    .attr("fill", "rgba(255,255,255,0.1)")
    .attr("stroke", "rgba(255,255,255,0.4)")
    .attr("stroke-width", 1.5);

  playBtn.append("path")
    .attr("class", "play-icon")
    .attr("d", iconPlay())
    .attr("fill", "rgba(255,255,255,0.9)");

 // ── BOUTON RESET (à droite de Play) ──────────────
  svg.append("g")
    .attr("cursor", "pointer")
    .attr("transform", `translate(72, ${trackY})`)
    .on("click", resetSlider)
    .call(g => {
      g.append("circle")
        .attr("r", 16)
        .attr("fill", "rgba(255,255,255,0.1)")
        .attr("stroke", "rgba(255,255,255,0.4)")
        .attr("stroke-width", 1.5);
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "rgba(255,255,255,0.9)")
        .attr("font-size", "16px")
        .text("↺");
    });

  // ── PREMIER RENDU ─────────────────────────────────
  updateLinks(currentDate);

  console.log(`⏱️ timeSlider : ${formatDate(minDate)} → jan 2030`);
}

// --------------------------------------------------
// DÉPLACEMENT DU CURSEUR
// --------------------------------------------------

function moveTo(date) {

  const minDate = dataStore.minDate;
  const maxDate = new Date("2030-01-01");

  const clamped = new Date(
    Math.max(minDate.getTime(), Math.min(maxDate.getTime(), date.getTime()))
  );

  currentDate      = clamped;
  state.dateActive = clamped;

  const x = xScale(clamped);

  handle.attr("cx", x);
  trackFill.attr("x2", x);
  dateLabel.attr("x", x).text(formatDate(clamped));

  // Mettre en valeur les ticks de l'année courante
  svg.selectAll(".time-ticks text")
    .attr("fill", d =>
      d3.timeYear.floor(d).getFullYear() === d3.timeYear.floor(clamped).getFullYear()
        ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)"
    )
    .attr("font-weight", d =>
      d3.timeYear.floor(d).getFullYear() === d3.timeYear.floor(clamped).getFullYear()
        ? "600" : "400"
    );

  // Mise à jour cumulative des liens + donuts
  // Mise à jour cumulative — throttlée pendant le Play
  if (!isThrottled) {
    isThrottled = true;
    updateLinks(clamped);
    updateDonutCharts(clamped);
    updateServiceButtons(clamped);
    setTimeout(() => { isThrottled = false; }, THROTTLE_MS);
  }
}

// --------------------------------------------------
// PLAY / PAUSE / RESET
// --------------------------------------------------

function togglePlay() {
  isPlaying ? pausePlay() : startPlay();
}

function startPlay() {

  const minDate  = dataStore.minDate;
  const stopDate = dataStore.maxDate;  // arrêt à la dernière donnée réelle
  const maxDate  = new Date("2030-01-01");

  // Repartir du début si on est à la fin des données
  if (currentDate >= stopDate) moveTo(new Date(minDate));

  isPlaying = true;
  updatePlayIcon();

  const totalMs = stopDate.getTime() - minDate.getTime();
  const stepMs  = (totalMs / PLAY_DURATION_MS) * TICK_MS;

  timer = d3.interval(() => {
    const next = new Date(currentDate.getTime() + stepMs);
    if (next >= stopDate) { moveTo(stopDate); pausePlay(); return; }
    moveTo(next);
  }, TICK_MS);
}

function pausePlay() {
  if (timer) { timer.stop(); timer = null; }
  isPlaying = false;
  updatePlayIcon();
}

function resetSlider() {
  pausePlay();
  moveTo(new Date(dataStore.minDate));
}

function updatePlayIcon() {
  playBtn.select(".play-icon").attr("d", isPlaying ? iconPause() : iconPlay());
}

// --------------------------------------------------
// ICÔNES SVG
// --------------------------------------------------
const iconPlay  = () => "M-4,-7 L9,0 L-4,7 Z";
const iconPause = () => "M-5,-7 L-1,-7 L-1,7 L-5,7 Z M1,-7 L5,-7 L5,7 L1,7 Z";

// --------------------------------------------------
// UTILITAIRE
// --------------------------------------------------

function formatDate(date) {
  return getLocale().format("%b %Y")(date);
}

export function destroyTimeSlider() {
  pausePlay();
  d3.select("#timeline-container").selectAll("*").remove();
}

// --------------------------------------------------
// MISE À JOUR LANGUE
// Quand l'utilisateur bascule FR/EN, on redessine
// les ticks avec la nouvelle locale
// --------------------------------------------------

document.addEventListener("d3LangueChanged", () => {
  if (!svg || !xScale) return;

  // Redessiner les labels des ticks avec la nouvelle locale
  svg.selectAll(".time-ticks text")
    .text(d => formatDate(d));

  // Mettre à jour le label de date courante
  if (currentDate) {
    dateLabel.text(formatDate(currentDate));
  }
});