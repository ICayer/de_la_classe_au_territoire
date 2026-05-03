// ==================================================
// js/layers/mrcLayer.js
// Dessine les polygones des MRC sur gMap
// Pattern MasterCayer : init / show / hide
// version 27 avril 2026
// ==================================================

import { gMap, projection } from "../map/mapInit.js";
import { dataStore } from "../data/dataStore.js";
import {
  COLOR_MRC_FILL, COLOR_MRC_FILL_OPACITY,
  COLOR_MRC_STROKE, COLOR_MRC_STROKE_WIDTH,
  COLOR_MRC_REGIONS
} from "../utils/colors.js";

let pathGenerator;

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initMRCLayer(width, height) {

  const geojson = dataStore.geoMRC;

  // ── CORRECTION WINDING ───────────────────────────
  // Doit avoir lieu AVANT fitExtent (voir étape 3)
  geojson.features.forEach(f => {
    if (f.geometry.type === "Polygon") {
      f.geometry.coordinates.forEach(ring => ring.reverse());
    } else if (f.geometry.type === "MultiPolygon") {
      f.geometry.coordinates.forEach(poly =>
        poly.forEach(ring => ring.reverse())
      );
    }
  });

  // ── RECENTRAGE B : fitExtent sur les nodes ────────
  // Au lieu de caler la projection sur le GeoJSON complet
  // (qui inclut des zones vides au Nord), on la cale sur
  // la bounding box des nodes qui ont des données.
  //
  // Avantage : la carte s'étire horizontalement pour couvrir
  // exactement le territoire actif, donnant plus de respiration
  // entre les nodes du Bas-Saint-Laurent.
  //
  // On filtre les nodes sans coordonnées valides (ex: node_mrc_00)
  // et on construit un GeoJSON de points à la volée.
  const nodesValides = dataStore.nodes.filter(
    d => !isNaN(d.lon) && !isNaN(d.lat)
  );

  const nodesBBox = {
    type: "FeatureCollection",
    features: nodesValides.map(d => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [d.lon, d.lat] }
    }))
  };

  // Marge : px en haut/gauche/droite, plus généreuse en bas
  // pour laisser de la place au timeSlider (120px réservés)
  const PAD_TOP    = 40;
  const PAD_SIDES  = 60;
  const PAD_BOTTOM = 40;  // la viz elle-même est raccourcie dans theme.css

  projection.fitExtent(
    [
      [PAD_SIDES, PAD_TOP],
      [width - PAD_SIDES, height - PAD_BOTTOM]
    ],
    nodesBBox
  );

  // ── GÉNÉRATEUR PATH ──────────────────────────────
  pathGenerator = d3.geoPath().projection(projection);

  // ── DESSIN MRC ───────────────────────────────────
  gMap.selectAll("path.mrc-path")
    .data(geojson.features)
    .join("path")
    .attr("class", "mrc-path")
    .attr("d", pathGenerator)
    .attr("fill", d => COLOR_MRC_REGIONS[d.properties?.MRS_NM_REG] ?? COLOR_MRC_FILL)
    .attr("fill-opacity", COLOR_MRC_FILL_OPACITY)
    .attr("stroke",       COLOR_MRC_STROKE)
    .attr("stroke-width", COLOR_MRC_STROKE_WIDTH);

  console.log(`🗺️ mrcLayer : ${geojson.features.length} polygones · recentré sur ${nodesValides.length} nodes`);
}

// --------------------------------------------------
// SHOW / HIDE
// --------------------------------------------------

export function showMRCs() {
  gMap.transition().duration(400).style("opacity", 1);
}

export function hideMRCs() {
  gMap.transition().duration(400).style("opacity", 0);
}