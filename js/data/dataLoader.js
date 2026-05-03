// ==================================================
// js/data/dataLoader.js
// Charge tous les fichiers de données en parallèle
// et stocke le résultat dans dataStore
// version 27 avril 2026
// ==================================================

import { dataStore } from "./dataStore.js";

export async function loadAllData() {
  try {

    // --------------------------------------------------
    // 1. CHARGEMENT PARALLÈLE
    // Tous les fichiers sont chargés en même temps
    // pour minimiser le temps d'attente
    // --------------------------------------------------

    const [geoMRC, nodesRaw, linksRaw] = await Promise.all([

      d3.json("public/data/mrc_est_quebec.json"),

      d3.csv("public/data/nodes.csv", d => ({
        id:        d.id,
        label:     d.label,
        categorie: d.categorie,
        cluster:   d.cluster || null,
        mrc_code:  d.mrc_code,
        mrc_nom:   d.mrc_nom,
        region:    d.region,
        lon:       +d.lon,
        lat:       +d.lat
      })),

      d3.csv("public/data/links.csv", d => ({
        id:           d.id,
        source:       d.source,           // id du node source
        target:       d.target,           // id du node cible
        source_label: d.source_label,
        target_label: d.target_label,
        date:         new Date(d.date),   // string → objet Date
        service:      d.service,
        poids:        +d.poids
      }))

    ]);

    // --------------------------------------------------
    // 2. NETTOYAGE
    // On filtre les lignes problématiques avant stockage
    // --------------------------------------------------

    // Nodes : écarter ceux sans coordonnées valides
    const nodesClean = nodesRaw.filter(d => {
      const ok = !isNaN(d.lon) && !isNaN(d.lat);
      if (!ok) console.warn("⚠️ Node ignoré (coordonnées invalides) :", d);
      return ok;
    });

    // Links : écarter les dates invalides
    const linksClean = linksRaw.filter(d => {
      const ok = d.date instanceof Date && !isNaN(d.date);
      if (!ok) console.warn("⚠️ Lien ignoré (date invalide) :", d);
      return ok;
    });

    // --------------------------------------------------
    // 3. AGRÉGATION DES LIENS
    // On groupe les événements par paire source–target
    // pour calculer le poids (= épaisseur du lien dans D3)
    // --------------------------------------------------

    // d3.rollup crée une Map : source → target → nb occurrences
    const grouped = d3.rollup(
      linksClean,
      v => v.length,     // fonction de réduction : on compte les événements
      d => d.source,     // clé 1 : source
      d => d.target      // clé 2 : target
    );

    // On aplatit la Map imbriquée en tableau d'objets
    const linksAggregated = [];
    grouped.forEach((targets, source) => {
      targets.forEach((poids, target) => {
        linksAggregated.push({ source, target, poids });
      });
    });

    // --------------------------------------------------
    // 4. PLAGE TEMPORELLE
    // Utilisée par timeSlider.js pour les bornes du slider
    // --------------------------------------------------

    const minDate = d3.min(linksClean, d => d.date);
    const maxDate = d3.max(linksClean, d => d.date);

    // --------------------------------------------------
    // 5. STOCKAGE CENTRALISÉ
    // Un seul endroit où les données vivent
    // --------------------------------------------------

    Object.assign(dataStore, {
      geoMRC,
      nodes:   nodesClean,
      links:   linksClean,
      linksAggregated,
      minDate,
      maxDate
    });

    // --------------------------------------------------
    // 6. VÉRIFICATIONS CONSOLE
    // À garder pendant le développement,
    // commenter/supprimer avant la mise en production
    // --------------------------------------------------

    console.group("✅ dataStore chargé");

    console.log(
      `📍 GeoJSON MRC : ${geoMRC.features.length} polygones`
    );

    console.log(
      `👤 Nodes : ${nodesClean.length} nodes`,
      "\n  Catégories :",
      [...new Set(nodesClean.map(d => d.categorie))]
    );

    console.log(
      `🔗 Links bruts : ${linksClean.length} événements`,
      "\n  Types de services :",
      [...new Set(linksClean.map(d => d.service))]
    );

    console.log(
      `🔗 Links agrégés : ${linksAggregated.length} liens uniques`,
      "\n  Poids min/max :",
      d3.min(linksAggregated, d => d.poids),
      "/",
      d3.max(linksAggregated, d => d.poids)
    );

    console.log(
      `📅 Plage temporelle : ${minDate.toLocaleDateString("fr-CA")} → ${maxDate.toLocaleDateString("fr-CA")}`
    );

    console.groupEnd();

  } catch (error) {
    console.error("❌ Erreur loadAllData :", error);
    // On relance l'erreur pour que main.js puisse réagir
    throw error;
  }
}