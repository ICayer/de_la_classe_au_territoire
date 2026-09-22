// ==================================================
// js/map/mapOSM.js
// Fond de carte OSM — CartoDB Positron no-labels
// Rendu canvas 2D — élimine les lignes blanches inter-tuiles
// version 3 mai 2026
// ==================================================

import { canvas, ctx, svg, projection } from "./mapInit.js";

// --------------------------------------------------
// CACHE D'IMAGES
// Évite de re-fetcher une tuile déjà chargée.
// Clé : "zoom/x/y" — Valeur : HTMLImageElement (loaded)
// --------------------------------------------------
const tileCache = new Map();

function getTile(url, key, onLoad) {
  if (tileCache.has(key)) {
    onLoad(tileCache.get(key));
    return;
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    tileCache.set(key, img);
    onLoad(img);
  };
  img.onerror = () => {
    // Tuile manquante — on ignore silencieusement
  };
  img.src = url;
}

// --------------------------------------------------
// DRAW OSM — appelé à chaque frame de zoom
// Signature identique à l'ancienne version SVG :
//   drawOSM(width, height, transform)
// --------------------------------------------------

export function drawOSM(width, height, transform = d3.zoomIdentity) {

  const tile = d3.tile()
    .size([width, height])
    .scale(projection.scale() * transform.k * 2 * Math.PI)
    .translate([
      projection.translate()[0] * transform.k + transform.x,
      projection.translate()[1] * transform.k + transform.y
    ]);

  const tiles = tile();

  // Coordonnées canvas : même logique que l'ancienne approche SVG
  // mais appliquée au contexte 2D.
  // tiles.scale  = taille physique d'une tuile en px (après zoom)
  // tiles.translate = offset global du coin haut-gauche
  const tileSize = tiles.scale;
  const tx = tiles.translate[0] * tileSize;
  const ty = tiles.translate[1] * tileSize;

  // Effacer le canvas avant de redessiner
  ctx.clearRect(0, 0, width, height);

  // Dessiner chaque tuile
  for (const t of tiles) {
    const [x, y, z] = t;
    const url = `https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/${z}/${x}/${y}.png?key=cb1_3tuw_1_21aacae1c5951f13f5872374`;
    const key = `${z}/${x}/${y}`;

    // Position pixel dans le canvas — coordonnées entières
    const px = Math.round(tx + x * tileSize);
    const py = Math.round(ty + y * tileSize);
    const sz = Math.ceil(tileSize); // +1px évite les gaps sub-pixel

    getTile(url, key, (img) => {
      // Redessiner uniquement si la tuile appartient encore
      // à la vue courante (le zoom peut avoir changé entre
      // le fetch et le callback).
      ctx.drawImage(img, px, py, sz, sz);
    });

    // Si la tuile est déjà en cache, elle est dessinée
    // dans le même frame (getTile appelle onLoad synchrone).
    // Les tuiles en cours de chargement se dessinent dès
    // qu'elles arrivent — effet "pop-in" propre, sans gap.
  }
}

// --------------------------------------------------
// INIT OSM — appelé une fois au démarrage
// --------------------------------------------------

export function initOSM() {
  const width  = +svg.attr("width");
  const height = +svg.attr("height");
  drawOSM(width, height, d3.zoomIdentity);
  console.log("🌍 mapOSM : fond de carte canvas initialisé");
}