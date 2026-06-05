// ==================================================
// js/utils/i18n.js
// Source de vérité unique pour tous les textes
// générés dynamiquement par D3/JS
//
// Règle du projet :
//   Texte dans le HTML  → data-lang + setLangue() (index.html)
//   Texte généré par D3 → t("clé") depuis ce fichier
// version 3 mai 2026
// ==================================================

import { state } from "../state.js";

// --------------------------------------------------
// DICTIONNAIRE DE TRADUCTIONS
// Ajouter ici tous les nouveaux labels D3 du projet
// --------------------------------------------------

const translations = {

  fr: {

    // ── Timeline ───────────────────────────────────
    "timeline.play":        "Lecture",
    "timeline.pause":       "Pause",
    "timeline.reset":       "Réinitialiser",
    "zoom.reset": "Réinitialiser le zoom",
    "timeline.aria.slider": "Curseur de la ligne du temps",

    // ── Tooltip ────────────────────────────────────
    "tooltip.firstLink":    "Premier lien",
    "tooltip.services":     "Services",
    "tooltip.link.one":     "lien",
    "tooltip.link.many":    "liens",
    "tooltip.service.one":  "service",
    "tooltip.service.many": "services",

    // ── Légende ────────────────────────────────────
    "legend.title":           "Personnages",
    "legend.mandataire":      "Ah Caramel!",
    "legend.beneficiaire":    "Collaborateur·trice",
    "legend.scientifique":    "Scientifique",
    "legend.partenaire":      "Partenaire",
    "legend.relationsTitle":  "Liens",

    // ── Bubble cluster ─────────────────────────────
    "cluster.label":    "Communauté TAC",
    "cluster.sublabel": "Scientifiques & Ah Caramel!",

    // ── Services ───────────────────────────────────
    "service.documentation":    "Documentation",
    "service.expertise-conseil":"Conseil",
    "service.représentation":   "Représentation",
    "service.réseautage":       "Réseautage",
    "service.production":       "Production",
    "service.formation":        "Scénarisation pédagogique",

    // ── Sous-catégories de services ────────────────
    "service.cat.relations":     "Relations",
    "service.cat.connaissances": "Connaissances",

    // ── Légende — liens ───────────────────────────
    "legend.linkPrimary":   "Ah Caramel! ↔ MRC / partenaire",
    "legend.linkSecondary": "MRC ↔ scientifique",
    "legend.linkCluster":  "Ah Caramel! ↔ Scientifique",
    "legend.linkExternal": "TAC ↔ Collaborateur·trice",
    "legend.linkBB":       "Collaborateur·trice ↔ Collaborateur·trice",

    // ── Panneau info ───────────────────────────────
    "info.btnLabel":       "Aide et légende",
    "info.title":          "Comment explorer cette carte",
    "info.close":          "Fermer",
    "info.howToRead":      "Navigation",
    "info.linkReading":    "Lire les liens",
    "info.tip.hover":      "Survoler un personnage → nom, catégorie et services",
    "info.tip.hoverLink":  "Survoler un lien → détail des services échangés",
    "info.tip.zoom":       "Molette de la souris → zoom avant / arrière",
    "info.tip.pan":        "Cliquer-glisser → déplacer la carte",
    "info.tip.slider":     "Glisser le curseur → explorer dans le temps",
    "info.tip.play":       "Bouton ▶ → animation automatique jan 2024–2030",
   "info.link.thickness": "Épaisseur du lien = nombre de services rendus",
    "info.link.cluster":   "Lien pointillé = relation Ah Caramel! ↔ Scientifique",
    "info.link.external":  "Lien gris pâle = relation TAC ↔ Collaborateur·trice",
    "info.link.bb":        "Lien gris foncé = relation Collaborateur·trice ↔ Collaborateur·trice",

    // ── Mois courts (pour D3 timeFormatLocale) ─────
    "months.short": [
      "jan.","fév.","mars","avr.","mai","juin",
      "juil.","août","sept.","oct.","nov.","déc."
    ],
    "months.long": [
      "janvier","février","mars","avril","mai","juin",
      "juillet","août","septembre","octobre","novembre","décembre"
    ],
    "days.short": ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."],
    "days.long":  [
      "dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"
    ]
  },

  en: {

    // ── Timeline ───────────────────────────────────
    "timeline.play":        "Play",
    "timeline.pause":       "Pause",
    "timeline.reset":       "Reset",
    "zoom.reset": "Reset zoom",
    "timeline.aria.slider": "Timeline slider",

    // ── Tooltip ────────────────────────────────────
    "tooltip.firstLink":    "First link",
    "tooltip.services":     "Services",
    "tooltip.link.one":     "link",
    "tooltip.link.many":    "links",
    "tooltip.service.one":  "service",
    "tooltip.service.many": "services",

    // ── Légende ────────────────────────────────────
    "legend.title":           "Character",
    "legend.mandataire":      "Ah Caramel!",
    "legend.beneficiaire":    "Collaborator",
    "legend.scientifique":    "Scientist",
    "legend.partenaire":      "Partner",
    "legend.relationsTitle":  "Links",

    // ── Bubble cluster ─────────────────────────────
    "cluster.label":    "TCA Community",
    "cluster.sublabel": "Scientists & Ah Caramel!",

    // ── Services ───────────────────────────────────
    "service.documentation":    "Documentation",
    "service.expertise-conseil":"Consulting",
    "service.représentation":   "Representation",
    "service.réseautage":       "Networking",
    "service.production":       "Production",
    "service.formation":        "Educational scripting",

    // ── Service sub-categories ─────────────────────
    "service.cat.relations":     "Relationships",
    "service.cat.connaissances": "Knowledge",

    // ── Légende — liens ───────────────────────────
    "legend.linkPrimary":   "Ah Caramel! ↔ MRC / partner",
    "legend.linkSecondary": "MRC ↔ scientist",
    "legend.linkCluster":  "Ah Caramel! ↔ Scientist",
    "legend.linkExternal": "TAC ↔ Collaborator",
    "legend.linkBB":       "Collaborator ↔ Collaborator",

    // ── Panneau info ───────────────────────────────
    "info.btnLabel":       "Help and legend",
    "info.title":          "How to explore this map",
    "info.close":          "Close",
    "info.howToRead":      "Navigation",
    "info.linkReading":    "Reading links",
    "info.tip.hover":      "Hover a character → name, category and services",
    "info.tip.hoverLink":  "Hover a link → services exchanged",
    "info.tip.zoom":       "Mouse wheel → zoom in / out",
    "info.tip.pan":        "Click and drag → move the map",
    "info.tip.slider":     "Drag the cursor → explore through time",
    "info.tip.play":       "▶ button → auto-play Jan 2024–2030",
    "info.link.thickness": "Link thickness = number of services rendered",
    "info.link.cluster":   "Dashed link = Ah Caramel! ↔ Scientist relationship",
    "info.link.external":  "Light grey link = TAC ↔ Collaborator relationship",
    "info.link.bb":        "Dark grey link = Collaborator ↔ Collaborator relationship",
    "info.link.amber":     "Golden link = MRC ↔ scientist relationship",
    "info.link.white":     "White link = relationship with the Ah Caramel!",

    // ── Mois courts (pour D3 timeFormatLocale) ─────
    "months.short": [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ],
    "months.long": [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ],
    "days.short": ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    "days.long":  [
      "Sunday","Monday","Tuesday","Wednesday",
      "Thursday","Friday","Saturday"
    ]
  }
};

// --------------------------------------------------
// FONCTION PRINCIPALE
// Retourne la traduction d'une clé dans la langue active
// --------------------------------------------------

export function t(key) {
  const lang   = state.langueActive || "fr";
  const dict   = translations[lang] || translations["fr"];
  const result = dict[key];

  if (result === undefined) {
    console.warn(`⚠️ i18n : clé manquante "${key}" pour la langue "${lang}"`);
    // Fallback sur le français si la clé n'existe pas en EN
    return translations["fr"][key] ?? key;
  }

  return result;
}

// --------------------------------------------------
// LOCALE D3 — pour d3.timeFormatLocale()
// Construit la locale D3 à partir du dictionnaire
// Appelée dans timeSlider.js et partout où on formate des dates
// --------------------------------------------------

export function getLocale() {
  const lang = state.langueActive || "fr";

  return d3.timeFormatLocale({
    dateTime:    "%A %e %B %Y",
    date:        lang === "fr" ? "%d/%m/%Y" : "%m/%d/%Y",
    time:        "%H:%M:%S",
    periods:     ["AM", "PM"],
    days:        t("days.long"),
    shortDays:   t("days.short"),
    months:      t("months.long"),
    shortMonths: t("months.short")
  });
}

// --------------------------------------------------
// MISE À JOUR DE LA LANGUE
// Appelée depuis index.html via l'événement langueChanged
// Met à jour state.langueActive puis notifie les modules
// --------------------------------------------------

export function setLangueActive(lang) {
  state.langueActive = lang;
  // Dispatcher un événement custom pour que les modules D3
  // puissent se mettre à jour (timeSlider, tooltip, legend)
  document.dispatchEvent(new CustomEvent("d3LangueChanged", { detail: { lang } }));
}

// --------------------------------------------------
// INITIALISATION
// Écouter l'événement langueChanged dispatché par index.html
// --------------------------------------------------

document.addEventListener("langueChanged", (e) => {
  setLangueActive(e.detail.lang);
});