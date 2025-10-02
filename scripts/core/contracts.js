import { formatCurrency } from "./format.js";
import { allClubs } from "../data/teams.js";
import { pick, shuffle } from "./random.js";
import { generateLeagueSchedule, generateFreeAgentSchedule } from "./schedule.js";
import { addDays } from "./dates.js";

function wageFor(player, clubRating) {
  const base = 6000 + player.overall * 180;
  const ratingBonus = (clubRating - 70) * 180;
  const reputationBonus = player.reputation * 4000;
  return Math.round(base + ratingBonus + reputationBonus);
}

function contractLength() {
  return pick([1, 2, 3]);
}

function signingBonusFor(player, wage) {
  return Math.round(wage * (1.5 + player.reputation));
}

function appearanceFeeFor(player) {
  return 1500 + Math.round(player.overall * 32);
}

export function createOffer(player) {
  const choices = shuffle(allClubs());
  const pickClub = choices.find((club) => club.rating + player.reputation * 50 > 70) ?? choices[0];
  const wage = wageFor(player, pickClub.rating);
  return {
    id: crypto.randomUUID(),
    club: pickClub.name,
    league: pickClub.league,
    wage,
    signingBonus: signingBonusFor(player, wage),
    appearanceFee: appearanceFeeFor(player),
    length: contractLength(),
    summary: `${pickClub.name} (${pickClub.league}) · ${formatCurrency(wage)}/week`
  };
}

export function generateMarketOffers(player, count = 3) {
  return Array.from({ length: count }, () => createOffer(player));
}

export function acceptContract(state, offer) {
  const now = new Date(state.currentDate);
  state.player.contract = {
    club: offer.club,
    league: offer.league,
    wage: offer.wage,
    length: offer.length,
    expiry: offer.length,
    signingBonus: offer.signingBonus,
    appearanceFee: offer.appearanceFee,
    signedOn: now.getTime()
  };

  state.player.club = offer.club;
  state.player.league = offer.league;
  state.player.salary = offer.wage;
  state.player.balance += offer.signingBonus;
  state.player.value += offer.wage * 10;
  state.player.reputation = Math.min(1, state.player.reputation + 0.15);

  state.eventLog.unshift({
    id: crypto.randomUUID(),
    date: now,
    message: `${state.player.name} signed a ${offer.length}-year deal with ${offer.club} worth ${formatCurrency(offer.wage)} per week.`
  });

  const nextSaturday = addDays(now, 6);
  state.schedule = generateLeagueSchedule(offer.league, nextSaturday);
  state.pendingOffers = [];
}

export function weeklySalaryPayout(state) {
  if (!state.player.contract) return;
  state.player.balance += state.player.contract.wage;
}

export function decayContract(state) {
  if (!state.player.contract) return;
  if (state.week % 4 === 0) {
    state.player.contract.expiry -= 1;
    if (state.player.contract.expiry <= 0) {
      state.eventLog.unshift({
        id: crypto.randomUUID(),
        date: new Date(state.currentDate),
        message: `${state.player.name}'s contract with ${state.player.club} has expired. Back on the market!`
      });
      state.player.contract = null;
      state.player.club = "Free Agent";
      state.player.league = null;
      state.player.salary = 0;
      state.schedule = generateFreeAgentSchedule(new Date(state.currentDate));
    }
  }
}
