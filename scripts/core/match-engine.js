import { formatShort } from "./dates.js";
import { formatCurrency } from "./format.js";
import { findTeam } from "../data/teams.js";
import { addFormEntry, adjustMorale, computeOverall, recover } from "./player.js";
import { between, chance, weightedPick } from "./random.js";

function teamStrength(player, opponentRating) {
  const moraleBoost = 4 * (player.morale - 0.5);
  const fatiguePenalty = player.fatigue * 8;
  return Math.max(40, computeOverall(player.skills, player.position) + moraleBoost - fatiguePenalty - 4) + opponentRating;
}

function playerContribution(player) {
  const base = computeOverall(player.skills, player.position);
  const fatigue = 1 - player.fatigue;
  const morale = 0.6 + player.morale * 0.4;
  return base * fatigue * morale;
}

function simulateScore(strength) {
  const base = Math.max(0.6, strength / 200);
  const expectedGoals = between(base, base + 1.6);
  return Math.max(0, Math.round(expectedGoals + (Math.random() - 0.5)));
}

function describePerformance(player, stats) {
  const parts = [];
  if (player.position === "Goalkeeper") {
    if (stats.cleanSheet) {
      parts.push("kept a clean sheet with commanding saves");
    } else if (stats.saves >= 5) {
      parts.push("produced a flurry of key saves to keep the team alive");
    } else if (stats.conceded >= 3) {
      parts.push("endured a tough night between the sticks");
    } else {
      parts.push("delivered a steady performance in goal");
    }
  } else {
    if (stats.goals >= 2) {
      parts.push("netted a brace");
    } else if (stats.goals === 1) {
      parts.push("found the net");
    }

    if (stats.assists >= 2) {
      parts.push("set up teammates twice");
    } else if (stats.assists === 1) {
      parts.push("added an assist");
    }

    if (!parts.length) {
      parts.push(stats.rating >= 7 ? "worked tirelessly off the ball" : "struggled to influence proceedings");
    }
  }

  return parts.join(" and ");
}

export function playMatch(state, fixture) {
  const { player } = state;
  const opponent = findTeam(fixture.opponent);
  const opponentRating = opponent?.rating ?? 72;

  const strength = teamStrength(player, opponentRating);
  const opponentStrength = opponentRating + between(-4, 4);

  const ourGoals = simulateScore(strength / 2.4);
  const theirGoals = simulateScore(opponentStrength / 2.6);

  const playerImpact = playerContribution(player);

  const stats = {
    goals: 0,
    assists: 0,
    saves: 0,
    conceded: theirGoals,
    cleanSheet: theirGoals === 0,
    rating: 6 + (playerImpact / 100) + between(-1.2, 1.4)
  };

  if (player.position === "Goalkeeper") {
    stats.saves = Math.max(0, Math.round(between(2, 6) * (1 - player.fatigue)));
  } else {
    const finishing = player.skills.shooting / 100;
    const creativity = player.skills.passing / 100;
    if (chance(0.4 * finishing)) stats.goals += 1;
    if (chance(0.2 * finishing)) stats.goals += 1;
    if (chance(0.35 * creativity)) stats.assists += 1;
    if (chance(0.18 * creativity)) stats.assists += 1;
  }

  stats.rating = Math.min(10, Math.max(3, stats.rating + stats.goals * 0.7 + stats.assists * 0.4));

  const outcome = ourGoals === theirGoals ? "D" : ourGoals > theirGoals ? "W" : "L";
  addFormEntry(player, outcome);

  if (outcome === "W") adjustMorale(player, 0.08);
  else if (outcome === "L") adjustMorale(player, -0.12);
  else adjustMorale(player, 0.01);

  recover(player, 0.5);
  player.fatigue = Math.min(1, player.fatigue + 0.25);

  const appearanceFee = player.contract?.appearanceFee ?? 2500;
  player.balance += appearanceFee;

  const summary = {
    opponent: fixture.opponent,
    competition: fixture.competition,
    score: `${ourGoals}-${theirGoals}`,
    result: outcome,
    stats,
    payday: formatCurrency(appearanceFee),
    narrative: describePerformance(player, stats)
  };

  state.matchesPlayed += 1;
  state.minutesPlayed += 90;
  state.goals += stats.goals;
  state.assists += stats.assists;
  if (player.position === "Goalkeeper" && stats.cleanSheet) {
    state.cleanSheets += 1;
  }

  state.eventLog.unshift({
    id: crypto.randomUUID(),
    date: new Date(fixture.date),
    message: `${player.name} ${outcome === "W" ? "won" : outcome === "D" ? "drew" : "lost"} ${summary.score} against ${fixture.opponent}. ${summary.narrative}.`
  });

  fixture.played = true;
  fixture.result = outcome;
  fixture.scoreline = summary.score;
  fixture.stats = stats;

  const matchReport = {
    title: `${fixture.competition} vs ${fixture.opponent}`,
    sections: [
      { label: "Score", value: summary.score },
      { label: "Result", value: outcome === "W" ? "Win" : outcome === "D" ? "Draw" : "Defeat" },
      { label: "Performance", value: describePerformance(player, stats) },
      { label: "Appearance fee", value: summary.payday }
    ],
    footer: `Matchday ${formatShort(new Date(fixture.date))}`
  };

  if (!player.contract) {
    const valueBump = weightedPick([
      { weight: 2, value: between(8000, 15000) },
      { weight: 3, value: between(15000, 25000) },
      { weight: 1, value: between(30000, 45000) }
    ]);
    player.value += valueBump;
    player.reputation = Math.min(1, player.reputation + 0.06);
  }

  return matchReport;
}
