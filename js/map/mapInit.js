// ==================================================
// js/map/mapInit.js
// Initialise le canvas OSM, le SVG, la hiérarchie
// des couches (g) et la projection géographique Mercator
//
// ⚠️  Ordre d'appel obligatoire dans main.js :
//     1. initMap()      — crée canvas + svg + couches + projection
//     2. initMRCLayer() — correction winding + fitExtent
//     3. initZoom()     — enveloppe les couches dans gRoot
// version 3 mai 2026
// ==================================================

export let svg;
export let canvas;     // <canvas> 2D sous le SVG — tuiles OSM
export let ctx;        // CanvasRenderingContext2D
export let gBasemap;   // Couche 0 : conservé vide (canvas prend le relais)
export let gMap;       // Couche 1 : polygones MRC
export let gLinks;     // Couche 2 : liens réseau
export let gNodes;          // Couche 3 : nodes personnes
export let gBubbleCluster;  // Couche 4 : cercle TAC — suit le zoom
export let gUI;             // Couche 5 : légende, tooltip — hors gRoot (ne zoome pas)

export let projection;

export function initMap() {

  const container = document.getElementById("vis");
  const width  = container.clientWidth;
  const height = container.clientHeight;

  // ── CANVAS OSM ───────────────────────────────────
  // Positionné sous le SVG via CSS (position: absolute).
  // HiDPI : dimensions physiques × devicePixelRatio,
  // taille CSS maintenue à width × height logiques.
  const dpr = window.devicePixelRatio || 1;

  canvas = document.createElement("canvas");
  canvas.id = "osm-canvas";
  canvas.width  = width  * dpr;
  canvas.height = height * dpr;
  canvas.style.width  = width  + "px";
  canvas.style.height = height + "px";
  canvas.style.position = "absolute";
  canvas.style.top  = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "0";
  container.style.position = "relative"; // ancre le canvas dans #vis
  container.insertBefore(canvas, container.firstChild);

  ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr); // scale une fois pour toute la session

  // ── SVG ──────────────────────────────────────────
  svg = d3.select("#vis")
    .append("svg")
    .attr("width",  width)
    .attr("height", height)
    .style("position", "absolute")
    .style("top",  "0")
    .style("left", "0")
    .style("z-index", "1");

  // ── COUCHES G ────────────────────────────────────
  // gBasemap conservé pour ne pas casser les imports existants
  // mais reste vide — le canvas 2D gère les tuiles OSM.
  //
  // gMap, gLinks, gNodes, gBubbleCluster sont créés ici sur svg
  // puis déplacés dans gRoot par initZoom().
  gBasemap       = svg.append("g").attr("class", "basemap-layer"); // vide
  gMap           = svg.append("g").attr("class", "mrc-layer");
  gLinks         = svg.append("g").attr("class", "links-layer");
  gNodes         = svg.append("g").attr("class", "nodes-layer");
  gBubbleCluster = svg.append("g").attr("class", "bubble-cluster-layer");
  gUI            = svg.append("g").attr("class", "ui-layer");

  // ── PROJECTION MERCATOR ───────────────────────────
  // Initialisée sans fitExtent — calibrée dans mrcLayer.js
  // après la correction winding.
  projection = d3.geoMercator()
    .clipExtent([[0, 0], [width, height]]);

  const clipAnti = d3.geoClipAntimeridian();
  const clipRect = d3.geoClipRectangle(-85, 35, -50, 65);
  projection.postclip(d => clipRect(clipAnti(d)));

  console.log("🗺️ mapInit : canvas", width, "×", height, `(dpr=${dpr}) + SVG — projection initialisée`);

  return { width, height };
}