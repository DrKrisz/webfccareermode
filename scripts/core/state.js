import { APP_VERSION, STORAGE_KEY, SETUP_KEY } from "./constants.js";
import { today, formatDate } from "./dates.js";
import { createPlayer, applyTraining, recover, shortForm } from "./player.js";
import { generateFreeAgentSchedule } from "./schedule.js";
import { generateMarketOffers, acceptContract, weeklySalaryPayout, decayContract } from "./contracts.js";
import { playMatch } from "./match-engine.js";
import { availableShopItems, purchaseItem } from "./shop.js";
import { chance } from "./random.js";

const STORAGE_VERSION = 1;

export class GameState {
  static createFromSetup(setup) {
    const start = today();
    const player = createPlayer(setup);
    const state = new GameState(player, start);
    state.schedule = generateFreeAgentSchedule(start);
    state.eventLog.push({
      id: crypto.randomUUID(),
      date: new Date(start.getTime()),
      message: `${player.name} begins the professional journey. Scouts will watch trial showcases closely.`
    });
    return state;
  }

  constructor(player, startDate) {
    this.player = player;
    this.season = 1;
    this.week = 1;
    this.currentDate = startDate.getTime();
    this.schedule = [];
    this.eventLog = [];
    this.matchesPlayed = 0;
    this.minutesPlayed = 0;
    this.goals = 0;
    this.assists = 0;
    this.cleanSheets = 0;
    this.pendingOffers = [];
    this.autoAdvance = false;
    this.marketCooldown = 0;
  }

  get version() {
    return APP_VERSION;
  }

  get upcomingEvents() {
    const now = this.currentDate;
    return this.schedule.filter((event) => !event.played && event.date >= now);
  }

  nextEvent() {
    return this.upcomingEvents[0] ?? null;
  }

  advanceToNextEvent() {
    const event = this.nextEvent();
    if (!event) return null;
    const previousWeek = this.week;
    this.currentDate = event.date;
    this.week = Math.max(1, Math.ceil((event.date - this.schedule[0].date + 1) / (1000 * 60 * 60 * 24 * 7)));
    if (this.week < 1) this.week = 1;
    if (this.week !== previousWeek) {
      this.tickWeek();
    }
    return event;
  }

  processTraining(event, intensity = 1) {
    const gains = applyTraining(this.player, intensity);
    recover(this.player, 0.5);
    event.played = true;
    this.eventLog.unshift({
      id: crypto.randomUUID(),
      date: new Date(event.date),
      message: `${this.player.name} completed training (${intensity === 2 ? "intense" : intensity === 1 ? "normal" : "light"}). Overall now ${this.player.overall}.`
    });
    this.player.hype = Math.min(1, this.player.hype + 0.02 * intensity);
    this.maybeRollOffers(event);
    return gains;
  }

  processRest(event) {
    recover(this.player, 1.2);
    this.player.fatigue = Math.max(0, this.player.fatigue - 0.15);
    event.played = true;
    this.eventLog.unshift({
      id: crypto.randomUUID(),
      date: new Date(event.date),
      message: `${this.player.name} took a recovery day to reset both body and mind.`
    });
  }

  processTrial(event) {
    event.played = true;
    const offers = generateMarketOffers(this.player, 3);
    this.pendingOffers = offers;
    this.marketCooldown = 10;
    this.eventLog.unshift({
      id: crypto.randomUUID(),
      date: new Date(event.date),
      message: `Scouts attended the showcase. ${offers.length} contract offers arrived.`
    });
    return offers;
  }

  processMatch(event) {
    if (!this.player.contract && !this.player.alwaysPlay) {
      throw new Error("You need a contract to play official matches.");
    }
    const report = playMatch(this, event);
    weeklySalaryPayout(this);
    event.played = true;
    this.marketCooldown = Math.max(0, this.marketCooldown - 1);
    return report;
  }

  acceptOffer(offer) {
    acceptContract(this, offer);
  }

  purchase(item) {
    purchaseItem(this, item);
  }

  toggleAutoAdvance() {
    this.autoAdvance = !this.autoAdvance;
    return this.autoAdvance;
  }

  maybeRollOffers(event) {
    if (this.player.contract) return;
    if (this.marketCooldown > 0) {
      this.marketCooldown -= 1;
      return;
    }
    if (event.type === "training" && chance(0.08 + this.player.reputation * 0.1)) {
      this.pendingOffers = generateMarketOffers(this.player, 2);
      this.eventLog.unshift({
        id: crypto.randomUUID(),
        date: new Date(event.date),
        message: `Agents reached out with fresh interest after a strong session.`
      });
      this.marketCooldown = 6;
    }
  }

  tickWeek() {
    weeklySalaryPayout(this);
    decayContract(this);
  }

  toJSON() {
    return {
      version: STORAGE_VERSION,
      snapshot: JSON.stringify({
        ...this,
        currentDate: this.currentDate,
        schedule: this.schedule,
        eventLog: this.eventLog
      })
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed.version !== STORAGE_VERSION) return null;
      const snapshot = JSON.parse(parsed.snapshot);
      const state = new GameState(snapshot.player, new Date(snapshot.currentDate));
      Object.assign(state, snapshot);
      return state;
    } catch (error) {
      console.error("Failed to load save", error);
      return null;
    }
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.toJSON()));
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return GameState.fromJSON(JSON.parse(raw));
}

export function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SETUP_KEY);
}

export function loadSetup() {
  const raw = sessionStorage.getItem(SETUP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function storeSetup(setup) {
  sessionStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

export function buildDashboardSummary(state) {
  const next = state.nextEvent();
  if (!next) {
    return {
      headline: "Season complete",
      detail: "Take a breather while we prepare new challenges."
    };
  }

  if (next.type === "match") {
    return {
      headline: `Match vs ${next.opponent}`,
      detail: `${formatDate(new Date(next.date))} · ${next.competition}`
    };
  }

  if (next.type === "training") {
    return {
      headline: "Training day",
      detail: `${formatDate(new Date(next.date))} · Fine tune your attributes.`
    };
  }

  if (next.type === "event") {
    return {
      headline: "Scout showcase",
      detail: `Impress the visitors and attract new offers.`
    };
  }

  return {
    headline: "Recovery day",
    detail: `Reset fatigue before the next challenge.`
  };
}

export function purchaseOptions(state) {
  return availableShopItems(state);
}

export function playerFormLabel(state) {
  return shortForm(state.player);
}
