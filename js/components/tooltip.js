// ==================================================
// js/components/tooltip.js
// version 2 mai 2026
// ==================================================

import { t, getLocale } from "../utils/i18n.js";
import { dataStore } from "../data/dataStore.js";
import { COLOR_SERVICES } from "../utils/colors.js";
import { state } from "../state.js";

let tooltipEl = null;

export function initTooltip() {
  tooltipEl = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position",       "absolute")
    .style("pointer-events", "none")
    .style("opacity",        0)
    .style("z-index",        1000);

  console.log("💬 tooltip initialisé");
}

export function showTooltip(event, html) {
  if (!tooltipEl) return;
  tooltipEl.html(html).style("opacity", 1);
  moveTooltip(event);
}

export function moveTooltip(event) {
  if (!tooltipEl) return;

  const W   = window.innerWidth;
  const H   = window.innerHeight;
  const box = tooltipEl.node().getBoundingClientRect();

  let x = event.pageX + 14;
  let y = event.pageY - 28;

  if (x + box.width  > W - 16) x = event.pageX - box.width  - 14;
  if (y + box.height > H - 16) y = event.pageY - box.height - 14;
  if (y < 8) y = event.pageY + 14;

  tooltipEl.style("left", x + "px").style("top", y + "px");
}

export function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.style("opacity", 0);
}

// --------------------------------------------------
// HTML — NODE
// --------------------------------------------------

export function buildNodeTooltip(node) {

  const formatDate  = getLocale().format("%d %b %Y");
  const activeDate  = state.dateActive ?? new Date();
  const linksOfNode = dataStore.links.filter(
    d => (d.source === node.id || d.target === node.id) &&
         d.date <= activeDate
  );
  const firstDate    = d3.min(linksOfNode, d => d.date);
  const serviceCount = d3.rollup(linksOfNode, v => v.length, d => d.service);
  const catLabel     = t(`legend.${node.categorie}`) || node.categorie;

  let html = `
    <div class="tt-header">
      <span class="tt-name">${node.label}</span>
      <span class="tt-cat">${catLabel}</span>
    </div>`;

  if (linksOfNode.length > 0) {
    const svcCount = serviceCount.size;
    html += `<div class="tt-section-title">${svcCount} ${svcCount === 1 ? t("tooltip.service.one") : t("tooltip.service.many")}</div>
    <div class="tt-services">`;

    serviceCount.forEach((count, service) => {
      const color = COLOR_SERVICES[service] ?? "#888";
      html += `
      <div class="tt-service-row">
        <span class="tt-service-dot" style="background:${color}"></span>
        <span class="tt-service-label">${t(`service.${service}`) || service}</span>
        <span class="tt-service-count" style="background:${color}22;color:${color}">${count}</span>
      </div>`;
    });

    html += `</div>`;

    if (firstDate) {
      html += `
      <div class="tt-footer">
        ${t("tooltip.firstLink")} : <strong>${formatDate(firstDate)}</strong>
      </div>`;
    }
  }

  return html;
}

// --------------------------------------------------
// HTML — LIEN
// --------------------------------------------------

export function buildLinkTooltip(link) {

  const sourceNode  = dataStore.nodes.find(n => n.id === link.source);
  const targetNode  = dataStore.nodes.find(n => n.id === link.target);
  const sourceLabel = sourceNode?.label || link.source;
  const targetLabel = targetNode?.label || link.target;

  const activeDate = state.dateActive ?? new Date();
  const events = dataStore.links.filter(
    d => ((d.source === link.source && d.target === link.target) ||
          (d.source === link.target && d.target === link.source)) &&
         d.date <= activeDate
  );
  const serviceCount = d3.rollup(events, v => v.length, d => d.service);

  let html = `
    <div class="tt-header">
      <span class="tt-name">${sourceLabel}</span>
      <span class="tt-arrow"> → </span>
      <span class="tt-name">${targetLabel}</span>
    </div>
    <div class="tt-section-title">
      ${events.length} ${events.length === 1 ? t("tooltip.link.one") : t("tooltip.link.many")}
    </div>
    <div class="tt-services">`;

  serviceCount.forEach((count, service) => {
    const color = COLOR_SERVICES[service] ?? "#888";
    html += `
      <div class="tt-service-row">
        <span class="tt-service-dot" style="background:${color}"></span>
        <span class="tt-service-label">${t(`service.${service}`) || service}</span>
        <span class="tt-service-count" style="background:${color}22;color:${color}">${count}</span>
      </div>`;
  });

  html += `</div>`;
  return html;
}