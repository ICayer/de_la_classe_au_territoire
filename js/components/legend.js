// ==================================================
// js/components/legend.js
// Légende B (bas droite, toujours visible)
// + Panneau C (instructions, s'ouvre au clic ?)
// Bilingue via i18n.js
// version 6 mai 2026
// ==================================================

import { t } from "../utils/i18n.js";
import { dataStore } from "../data/dataStore.js";
import { COLOR_NODES, COLOR_LINK_CLUSTER, COLOR_SERVICES } from "../utils/colors.js";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const CATEGORIES = ["beneficiaire", "mandataire", "scientifique"];

const NODE_IMAGES = {
  beneficiaire: "public/data/images/beneficiaire.svg",
  mandataire:   "public/data/images/mandataire.svg",
  scientifique: "public/data/images/scientifique.svg",
  partenaire:   "public/data/images/partenaire.svg"
};

// --------------------------------------------------
// INIT
// --------------------------------------------------

export function initLegend() {
  buildLegend();
  buildInfoPanel();

  document.addEventListener("d3LangueChanged", () => {
    document.getElementById("legend-panel")?.remove();
    document.getElementById("info-panel")?.remove();
    buildLegend();
    buildInfoPanel();
  });
}

// --------------------------------------------------
// LÉGENDE B — bas droite, toujours visible
// --------------------------------------------------

function buildLegend() {

  const legend = document.createElement("div");
  legend.id = "legend-panel";

  // Titre
  const title = document.createElement("p");
  title.className = "legend-title";
  title.textContent = t("legend.title");
  legend.appendChild(title);

  // 4 catégories — cercle coloré + image SVG par-dessus (même rendu que la carte)
  CATEGORIES.forEach(cat => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const color = COLOR_NODES[cat] ?? "#888";
    const size  = 28; // px — taille du node dans la légende

    // Mini SVG : cercle coloré + halo + image
    const svgNS = "http://www.w3.org/2000/svg";
    const svg   = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width",   size);
    svg.setAttribute("height",  size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.flexShrink = "0";

    // Cercle de fond
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx",      size / 2);
    circle.setAttribute("cy",      size / 2);
    circle.setAttribute("r",       size / 2 - 1);
    circle.setAttribute("fill",    color);
    circle.setAttribute("opacity", "0.9");
    svg.appendChild(circle);

    // Halo
    const halo = document.createElementNS(svgNS, "circle");
    halo.setAttribute("cx",           size / 2);
    halo.setAttribute("cy",           size / 2);
    halo.setAttribute("r",            size / 2 - 1);
    halo.setAttribute("fill",         "none");
    halo.setAttribute("stroke",       "rgba(255,255,255,0.25)");
    halo.setAttribute("stroke-width", "1.5");
    svg.appendChild(halo);

    // Image personnage
    const imgEl = document.createElementNS(svgNS, "image");
    imgEl.setAttribute("href",   NODE_IMAGES[cat]);
    imgEl.setAttribute("x",      "0");
    imgEl.setAttribute("y",      "0");
    imgEl.setAttribute("width",  size);
    imgEl.setAttribute("height", size);
    svg.appendChild(imgEl);

    const label = document.createElement("span");
    label.textContent = t(`legend.${cat}`);

    item.appendChild(svg);
    item.appendChild(label);
    legend.appendChild(item);
  });

  // Séparateur + explication des liens
  const sep = document.createElement("div");
  sep.className = "legend-sep";
  legend.appendChild(sep);

  // Titre Relations
  const relationsTitle = document.createElement("p");
  relationsTitle.className = "legend-title";
  relationsTitle.textContent = t("legend.relationsTitle");
  legend.appendChild(relationsTitle);

  // Lien A — Mandataire ↔ Scientifique (pointillé)
  const linkA = document.createElement("div");
  linkA.className = "legend-item";
  linkA.innerHTML = `
    <svg width="28" height="12" style="flex-shrink:0" viewBox="0 0 28 12">
      <line x1="2" y1="6" x2="26" y2="6"
        stroke="rgba(150,150,150,0.8)"
        stroke-width="2"
        stroke-dasharray="5,4"
        stroke-linecap="round"/>
    </svg>
    <span>${t("legend.linkCluster")}</span>`;
  legend.appendChild(linkA);

  // Lien B — Mandataire/Scientifique ↔ Bénéficiaire (plein 50%)
  const linkB = document.createElement("div");
  linkB.className = "legend-item";
  linkB.innerHTML = `
    <svg width="28" height="12" style="flex-shrink:0" viewBox="0 0 28 12">
      <line x1="2" y1="6" x2="26" y2="6"
        stroke="rgba(180,180,180,0.7)"
        stroke-width="2.5"
        stroke-linecap="round"/>
    </svg>
    <span>${t("legend.linkExternal")}</span>`;
  legend.appendChild(linkB);

  // Lien C — Bénéficiaire ↔ Bénéficiaire (plein 100%)
  const linkC = document.createElement("div");
  linkC.className = "legend-item";
  linkC.innerHTML = `
    <svg width="28" height="12" style="flex-shrink:0" viewBox="0 0 28 12">
      <line x1="2" y1="6" x2="26" y2="6"
        stroke="rgba(60,75,90,0.9)"
        stroke-width="3"
        stroke-linecap="round"/>
    </svg>
    <span>${t("legend.linkBB")}</span>`;
  legend.appendChild(linkC);

  // Séparateur + services
  const sep2 = document.createElement("div");
  sep2.className = "legend-sep";
  legend.appendChild(sep2);

  const servicesTitle = document.createElement("p");
  servicesTitle.className = "legend-title";
  servicesTitle.textContent = t("tooltip.services");
  legend.appendChild(servicesTitle);

  // Services groupés : Relations (représentation, réseautage, expertise-conseil)
  // puis Connaissances (documentation, production, formation)
  const SERVICE_GROUPS = [
    {
      cat:  "service.cat.relations",
      keys: ["représentation", "réseautage", "expertise-conseil"]
    },
    {
      cat:  "service.cat.connaissances",
      keys: ["documentation", "production", "formation"]
    }
  ];

  SERVICE_GROUPS.forEach((group, gi) => {

    // Séparateur entre les deux groupes (sauf avant le premier)
    if (gi > 0) {
      const sepG = document.createElement("div");
      sepG.className = "legend-sep";
      legend.appendChild(sepG);
    }

    // Sous-titre de groupe
    const groupTitle = document.createElement("p");
    groupTitle.className = "legend-title legend-title--sub";
    groupTitle.textContent = t(group.cat);
    legend.appendChild(groupTitle);

    group.keys.forEach(key => {
      const color = COLOR_SERVICES[key];
      if (!color) return;

      const item = document.createElement("div");
      item.className = "legend-item";

      // Arc SVG représentant un segment de donut
      const svgNS = "http://www.w3.org/2000/svg";
      const svg   = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width",   "28");
      svg.setAttribute("height",  "28");
      svg.setAttribute("viewBox", "0 0 28 28");
      svg.style.flexShrink = "0";

      const path = document.createElementNS(svgNS, "path");
      const r1 = 7, r2 = 13, cx = 14, cy = 14;
      const startAngle = -Math.PI / 2 - Math.PI / 3;
      const endAngle   = -Math.PI / 2 + Math.PI / 3;
      const x1o = cx + r2 * Math.cos(startAngle);
      const y1o = cy + r2 * Math.sin(startAngle);
      const x2o = cx + r2 * Math.cos(endAngle);
      const y2o = cy + r2 * Math.sin(endAngle);
      const x1i = cx + r1 * Math.cos(endAngle);
      const y1i = cy + r1 * Math.sin(endAngle);
      const x2i = cx + r1 * Math.cos(startAngle);
      const y2i = cy + r1 * Math.sin(startAngle);
      const d = [
        `M ${x1o} ${y1o}`,
        `A ${r2} ${r2} 0 0 1 ${x2o} ${y2o}`,
        `L ${x1i} ${y1i}`,
        `A ${r1} ${r1} 0 0 0 ${x2i} ${y2i}`,
        "Z"
      ].join(" ");
      path.setAttribute("d",    d);
      path.setAttribute("fill", color);
      path.setAttribute("opacity", "0.92");
      svg.appendChild(path);

      const label = document.createElement("span");
      label.textContent = t(`service.${key}`);

      item.appendChild(svg);
      item.appendChild(label);
      legend.appendChild(item);
    });
  });

  // Attacher au viz-wrapper si disponible, sinon au body (fallback)
  const container = document.getElementById("viz-wrapper") || document.body;
  container.appendChild(legend);
}


// --------------------------------------------------
// PANNEAU C — instructions, s'ouvre au clic
// --------------------------------------------------

function buildInfoPanel() {

  const panel = document.createElement("div");
  panel.id = "info-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", t("info.title"));

  panel.innerHTML = `
    <div class="info-header">
      <p class="info-title">${t("info.title")}</p>
      <button class="info-close" aria-label="${t("info.close")}">✕</button>
    </div>

    <p class="info-section-title">${t("info.howToRead")}</p>
    <ul class="info-list">
      <li>${t("info.tip.hover")}</li>
      <li>${t("info.tip.hoverLink")}</li>
      <li>${t("info.tip.zoom")}</li>
      <li>${t("info.tip.pan")}</li>
      <li>${t("info.tip.slider")}</li>
      <li>${t("info.tip.play")}</li>
    </ul>

    <p class="info-section-title">${t("info.linkReading")}</p>
    <ul class="info-list">
      <li>${t("info.link.thickness")}</li>
      <li>${t("info.link.cluster")}</li>
      <li>${t("info.link.external")}</li>
      <li>${t("info.link.bb")}</li>
    </ul>`;

  // Bouton fermer
  panel.querySelector(".info-close").addEventListener("click", () => {
    panel.classList.remove("open");
    document.getElementById("info-btn")
      ?.setAttribute("aria-expanded", "false");
    document.getElementById("info-btn")
      ?.classList.remove("active");
  });

  const container = document.getElementById("viz-wrapper") || document.body;
  container.appendChild(panel);
}
// NOTE CSS à ajouter dans style.css :
// .legend-title--sub {
//   color: rgba(255,255,255,0.25);   /* plus discret que le titre principal */
//   margin-top: 4px;
//   font-size: 0.65rem;
// }