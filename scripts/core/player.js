import { TRAINING_POSITIONS } from "./constants.js";
import { intBetween } from "./random.js";

export const SKILL_KEYS = ["shooting", "passing", "dribbling", "defending", "pace", "physical", "goalkeeping"];

function baseSkillValue(position, skill) {
  const defaults = {
    Forward: { shooting: 68, passing: 62, dribbling: 66, defending: 40, pace: 70, physical: 62, goalkeeping: 15 },
    Midfielder: { shooting: 58, passing: 68, dribbling: 64, defending: 58, pace: 64, physical: 62, goalkeeping: 12 },
    Defender: { shooting: 48, passing: 60, dribbling: 52, defending: 70, pace: 60, physical: 68, goalkeeping: 10 },
    Goalkeeper: { shooting: 20, passing: 44, dribbling: 32, defending: 38, pace: 46, physical: 68, goalkeeping: 70 }
  };

  const config = defaults[position] ?? defaults.Forward;
  return config[skill];
}

export function createPlayer({ name, age, continent, country, pos, alwaysPlay }) {
  if (!TRAINING_POSITIONS.includes(pos)) {
    throw new Error(`Unsupported position: ${pos}`);
  }

  const skills = {};
  for (const key of SKILL_KEYS) {
    const base = baseSkillValue(pos, key);
    const variance = Math.max(2, Math.round(base * 0.08));
    skills[key] = base + intBetween(-variance, variance);
  }

  const overall = computeOverall(skills, pos);

  return {
    name,
    age: Number(age),
    continent,
    country,
    position: pos,
    alwaysPlay: Boolean(alwaysPlay),
    club: "Free Agent",
    league: null,
    salary: 0,
    value: 250000,
    balance: 0,
    contract: null,
    morale: 0.6,
    fatigue: 0.2,
    reputation: 0.2,
    hype: 0.1,
    form: [],
    skills,
    overall,
    perks: {
      recoveryBonus: 0,
      trainingBonus: 0,
      reputationBonus: 0,
      fatigueReduction: 0
    },
    inventory: {}
  };
}

export function computeOverall(skills, position) {
  const weights = {
    Forward: { shooting: 0.28, passing: 0.12, dribbling: 0.2, defending: 0.08, pace: 0.18, physical: 0.1, goalkeeping: 0.04 },
    Midfielder: { shooting: 0.16, passing: 0.24, dribbling: 0.18, defending: 0.12, pace: 0.14, physical: 0.12, goalkeeping: 0.04 },
    Defender: { shooting: 0.08, passing: 0.16, dribbling: 0.1, defending: 0.28, pace: 0.14, physical: 0.2, goalkeeping: 0.04 },
    Goalkeeper: { shooting: 0.02, passing: 0.14, dribbling: 0.06, defending: 0.12, pace: 0.1, physical: 0.16, goalkeeping: 0.4 }
  };

  const weight = weights[position] ?? weights.Forward;
  let sum = 0;
  for (const key of SKILL_KEYS) {
    sum += (skills[key] ?? 0) * (weight[key] ?? 0);
  }
  return Math.round(sum);
}

export function applyTraining(player, intensity) {
  const growthFactor = 0.5 + intensity * (1 + player.perks.trainingBonus);
  const fatigueGain = 0.12 + intensity * 0.2;
  const keyGrowth = {};

  for (const key of SKILL_KEYS) {
    const multiplier = key === "goalkeeping" && player.position !== "Goalkeeper" ? 0.25 : 1;
    const bump = multiplier * growthFactor * (Math.random() * 0.8 + 0.2);
    player.skills[key] = Math.min(99, player.skills[key] + bump);
    keyGrowth[key] = bump;
  }

  player.fatigue = Math.min(1, player.fatigue + fatigueGain * (1 - player.perks.fatigueReduction));
  player.reputation = Math.min(1, player.reputation + 0.01 * intensity);
  player.overall = computeOverall(player.skills, player.position);

  return keyGrowth;
}

export function recover(player, days = 1) {
  const recoveryRate = 0.18 + player.perks.recoveryBonus;
  player.fatigue = Math.max(0, player.fatigue - recoveryRate * days);
}

export function adjustMorale(player, delta) {
  player.morale = Math.max(0, Math.min(1, player.morale + delta));
}

export function addFormEntry(player, result) {
  player.form.push(result);
  if (player.form.length > 5) {
    player.form.shift();
  }
}

export function shortForm(player) {
  if (!player.form.length) return "—";
  return player.form.slice(-5).join(" ");
}
