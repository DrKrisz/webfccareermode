import { APP_VERSION } from "./core/constants.js";
import {
  GameState,
  loadState,
  saveState,
  clearSave,
  loadSetup,
  buildDashboardSummary,
  purchaseOptions,
  playerFormLabel
} from "./core/state.js";
import { formatCurrency, formatNumber } from "./core/format.js";
import { formatDate, formatShort } from "./core/dates.js";
import { qs, qsa, setText, clearChildren, toggleHidden } from "./ui/dom.js";

let state = null;
let autoTimer = null;

function ensureState() {
  if (state) return;
  const existing = loadState();
  if (existing) {
    state = existing;
    return;
  }
  const setup = loadSetup();
  if (!setup) {
    window.location.href = "index.html";
    return;
  }
  state = GameState.createFromSetup(setup);
}

function updatePlayerOverview() {
  const overview = qs("[data-player-overview]");
  overview.querySelector('[data-field="name"]').textContent = state.player.name;
  overview.querySelector('[data-field="age"]').textContent = String(state.player.age);
  overview.querySelector('[data-field="pos"]').textContent = state.player.position;
  overview.querySelector('[data-field="club"]').textContent = state.player.club;
  overview.querySelector('[data-field="league"]').textContent = state.player.league ?? "—";
  overview.querySelector('[data-field="overall"]').textContent = String(state.player.overall);
  overview.querySelector('[data-field="salary"]').textContent = state.player.salary
    ? `${formatCurrency(state.player.salary)}/wk`
    : "£0 /wk";
  overview.querySelector('[data-field="value"]').textContent = formatCurrency(state.player.value);
  overview.querySelector('[data-field="balance"]').textContent = formatCurrency(state.player.balance);
}

function updateSeasonOverview() {
  const season = qs("[data-season-overview]");
  season.querySelector('[data-field="season"]').textContent = String(state.season);
  season.querySelector('[data-field="week"]').textContent = `${state.week} / 38`;
  season.querySelector('[data-field="form"]').textContent = playerFormLabel(state);
  season.querySelector('[data-field="minutes"]').textContent = formatNumber(state.minutesPlayed);
  season.querySelector('[data-field="goals"]').textContent = formatNumber(state.goals);
  season.querySelector('[data-field="assists"]').textContent = formatNumber(state.assists);
  season.querySelector('[data-field="cleanSheets"]').textContent = formatNumber(state.cleanSheets);
}

function updateDashboard() {
  const summary = buildDashboardSummary(state);
  const view = qs('[data-view="dashboard"]');
  view.querySelector('[data-field="date"]').textContent = formatDate(new Date(state.currentDate));
  view.querySelector('[data-field="summary"]').textContent = summary.detail;
  view.querySelector(".card-title").textContent = summary.headline;
  renderWeekActions();
  renderLog();
}

function renderWeekActions() {
  const container = qs('[data-week-actions]');
  clearChildren(container);
  const event = state.nextEvent();
  if (!event) {
    const span = document.createElement("p");
    span.textContent = "No scheduled events.";
    span.className = "muted";
    container.appendChild(span);
    return;
  }

  if (event.type === "training") {
    const light = createActionButton("Light session", () => handleTraining(0.6));
    const normal = createActionButton("Normal training", () => handleTraining(1));
    const intense = createActionButton("Intense grind", () => handleTraining(1.4));
    container.append(light, normal, intense);
  } else if (event.type === "rest") {
    container.append(createActionButton("Recover", handleRest));
  } else if (event.type === "event") {
    container.append(createActionButton("Host showcase", handleTrial));
  } else if (event.type === "match") {
    container.append(createActionButton("Play match", handleMatch));
  }
}

function createActionButton(label, handler) {
  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.type = "button";
  btn.textContent = label;
  btn.addEventListener("click", handler);
  return btn;
}

function renderLog() {
  const list = qs("[data-log]");
  clearChildren(list);
  if (!state.eventLog.length) {
    const empty = document.createElement("li");
    empty.textContent = "No events logged yet.";
    empty.className = "muted";
    list.appendChild(empty);
    return;
  }
  state.eventLog.slice(0, 25).forEach((entry) => {
    const li = document.createElement("li");
    const time = document.createElement("time");
    time.textContent = formatDate(new Date(entry.date));
    const p = document.createElement("p");
    p.textContent = entry.message;
    li.append(time, p);
    list.appendChild(li);
  });
}

function renderCalendar() {
  const container = qs("[data-calendar]");
  clearChildren(container);
  const wrapper = document.createElement("div");
  wrapper.className = "calendar-grid";
  state.upcomingEvents.slice(0, 18).forEach((event) => {
    const card = document.createElement("article");
    card.className = "calendar-day";
    card.dataset.kind = event.type;
    const header = document.createElement("header");
    const label = document.createElement("span");
    label.textContent = formatShort(new Date(event.date));
    const kind = document.createElement("span");
    kind.textContent = event.type === "match" ? "Match" : event.type === "training" ? "Training" : event.type === "rest" ? "Rest" : "Event";
    header.append(label, kind);
    const body = document.createElement("p");
    body.textContent = event.type === "match" ? `vs ${event.opponent}` : event.label ?? kind.textContent;
    card.append(header, body);
    if (event.scoreline) {
      const score = document.createElement("p");
      score.textContent = `Result: ${event.scoreline}`;
      card.appendChild(score);
    }
    wrapper.appendChild(card);
  });
  container.appendChild(wrapper);
}

function renderOffers() {
  const container = qs("[data-market]");
  clearChildren(container);
  if (!state.pendingOffers?.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No active offers. Keep performing to attract interest.";
    container.appendChild(p);
    return;
  }

  state.pendingOffers.forEach((offer) => {
    const card = document.createElement("article");
    card.className = "card";
    const title = document.createElement("h3");
    title.textContent = offer.club;
    const detail = document.createElement("p");
    detail.className = "muted";
    detail.textContent = `${offer.league} · ${formatCurrency(offer.wage)}/week`;

    const bonus = document.createElement("p");
    bonus.textContent = `Signing bonus: ${formatCurrency(offer.signingBonus)} · Appearance fee: ${formatCurrency(offer.appearanceFee)}`;

    const actions = document.createElement("div");
    actions.className = "cta-group";
    const accept = document.createElement("button");
    accept.className = "btn primary";
    accept.type = "button";
    accept.textContent = "Sign contract";
    accept.addEventListener("click", () => handleAcceptOffer(offer));

    const skip = document.createElement("button");
    skip.className = "btn ghost";
    skip.type = "button";
    skip.textContent = "Dismiss";
    skip.addEventListener("click", () => dismissOffer(offer.id));

    actions.append(accept, skip);
    card.append(title, detail, bonus, actions);
    container.appendChild(card);
  });
}

function dismissOffer(id) {
  state.pendingOffers = state.pendingOffers.filter((offer) => offer.id !== id);
  saveState(state);
  renderOffers();
}

function renderShop() {
  const container = qs("[data-shop]");
  clearChildren(container);
  const items = purchaseOptions(state);
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    const title = document.createElement("h3");
    title.textContent = item.name;
    const description = document.createElement("p");
    description.className = "muted";
    description.textContent = item.description;
    const footer = document.createElement("div");
    footer.className = "cta-group";
    const price = document.createElement("span");
    price.className = "badge";
    price.textContent = item.priceLabel;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn primary";
    button.textContent = item.owned ? "Owned" : "Purchase";
    button.disabled = item.owned;
    button.addEventListener("click", () => {
      try {
        state.purchase(item);
        saveState(state);
        renderApp();
      } catch (error) {
        alert(error.message);
      }
    });
    footer.append(price, button);
    card.append(title, description, footer);
    container.appendChild(card);
  });
}

function renderLeague() {
  const tableWrapper = qs("[data-league]");
  const tbody = tableWrapper.querySelector("tbody");
  clearChildren(tbody);
  if (!state.player.league) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "Sign a contract to reveal the league table.";
    cell.className = "muted";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }
  const clubs = state.schedule
    .filter((event) => event.type === "match")
    .slice(0, 12)
    .map((event) => event.opponent);
  const unique = Array.from(new Set(clubs));
  unique.unshift(state.player.club);
  unique.slice(0, 12).forEach((club, index) => {
    const row = document.createElement("tr");
    const points = 40 - index * 3 + Math.round(Math.random() * 4);
    const wins = Math.max(0, Math.round(points / 3));
    const draws = Math.max(0, Math.round((points - wins * 3) / 1.5));
    const losses = Math.max(0, 24 - wins - draws);
    const goalDiff = Math.round((wins - losses) * 1.5);
    const data = [index + 1, club, points, wins, draws, losses, goalDiff];
    data.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
}

function renderSkills() {
  const list = qs("[data-skill-breakdown]");
  clearChildren(list);
  Object.entries(state.player.skills).forEach(([key, value]) => {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    const dd = document.createElement("dd");
    dd.textContent = value.toFixed(0);
    wrapper.append(dt, dd);
    list.appendChild(wrapper);
  });
}

function renderAutoButton() {
  const button = qs('[data-action="toggle-auto"]');
  button.textContent = state.autoAdvance ? "Turn off" : "Turn on";
}

function renderApp() {
  if (!state) return;
  updatePlayerOverview();
  updateSeasonOverview();
  updateDashboard();
  renderCalendar();
  renderOffers();
  renderShop();
  renderLeague();
  renderAutoButton();
  setText(qs("[data-app-version]"), `v${APP_VERSION}`);
  toggleHidden(qs("#app"), false);
  saveState(state);
}

function handleTraining(intensity) {
  const event = state.advanceToNextEvent();
  if (!event) return;
  state.processTraining(event, intensity);
  saveState(state);
  renderApp();
}

function handleRest() {
  const event = state.advanceToNextEvent();
  if (!event) return;
  state.processRest(event);
  saveState(state);
  renderApp();
}

function handleTrial() {
  const event = state.advanceToNextEvent();
  if (!event) return;
  state.processTrial(event);
  saveState(state);
  renderApp();
}

function handleMatch() {
  const event = state.advanceToNextEvent();
  if (!event) return;
  const report = state.processMatch(event);
  renderMatchModal(report);
  saveState(state);
  renderApp();
}

function renderMatchModal(report) {
  const modal = qs('[data-modal="match"]');
  modal.querySelector('[data-field="match-title"]').textContent = report.title;
  const body = modal.querySelector('[data-match-summary]');
  clearChildren(body);
  report.sections.forEach((section) => {
    const row = document.createElement("p");
    row.innerHTML = `<strong>${section.label}:</strong> ${section.value}`;
    body.appendChild(row);
  });
  const footer = document.createElement("p");
  footer.className = "muted";
  footer.textContent = report.footer;
  body.appendChild(footer);
  modal.showModal();
}

function handleAcceptOffer(offer) {
  state.acceptOffer(offer);
  saveState(state);
  renderApp();
}

function handleToggleAuto() {
  const enabled = state.toggleAutoAdvance();
  renderAutoButton();
  if (enabled) {
    runAutoStep();
  } else if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

function runAutoStep() {
  if (!state.autoAdvance) return;
  const event = state.advanceToNextEvent();
  if (!event) {
    state.autoAdvance = false;
    renderAutoButton();
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    return;
  }

  try {
    if (event.type === "training") {
      state.processTraining(event, 1);
    } else if (event.type === "rest") {
      state.processRest(event);
    } else if (event.type === "event") {
      state.processTrial(event);
    } else if (event.type === "match") {
      state.processMatch(event);
    }
  } catch (error) {
    console.error(error);
    state.autoAdvance = false;
  }

  saveState(state);
  renderApp();
  autoTimer = setTimeout(runAutoStep, 350);
}

function showView(name) {
  qsa("[data-view]").forEach((btn) => {
    btn.classList.toggle("primary", btn.dataset.view === name);
  });
  qsa(".view").forEach((panel) => {
    toggleHidden(panel, panel.dataset.view !== name);
  });
}

function handleNavigation(event) {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  showView(button.dataset.view);
}

function handleClearLog() {
  state.eventLog = [];
  saveState(state);
  renderLog();
}

function handleReset() {
  if (!confirm("This will remove your current save. Continue?")) return;
  clearSave();
  window.location.href = "index.html";
}

function bindEvents() {
  qs('[data-action="toggle-auto"]').addEventListener("click", handleToggleAuto);
  qs('[data-action="clear-log"]').addEventListener("click", handleClearLog);
  qs('[data-action="reset"]').addEventListener("click", handleReset);
  qs(".nav").addEventListener("click", handleNavigation);
  qs('[data-dialog="skills"]').addEventListener("click", () => {
    renderSkills();
    qs('[data-modal="skills"]').showModal();
  });
}

function init() {
  ensureState();
  if (!state) return;
  bindEvents();
  showView("dashboard");
  renderApp();
}

document.addEventListener("DOMContentLoaded", init);
