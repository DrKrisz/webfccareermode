import { addDays, formatDate, startOfWeek } from "./dates.js";
import { leagues, findLeague } from "../data/teams.js";
import { pick, shuffle } from "./random.js";

function makeEvent(date, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    date: date.getTime(),
    type: "training",
    played: false,
    ...overrides
  };
}

export function generateFreeAgentSchedule(startDate, weeks = 6) {
  const events = [];
  let cursor = startOfWeek(startDate);
  if (cursor.getTime() < startDate.getTime()) {
    cursor = addDays(startDate, 0);
  }

  for (let week = 0; week < weeks; week += 1) {
    const trainingDays = [1, 3, 5];
    trainingDays.forEach((offset) => {
      const day = addDays(cursor, offset);
      events.push(
        makeEvent(day, {
          type: "training",
          label: `Training session ${week + 1}-${offset}`,
          week: week + 1
        })
      );
    });

    const trialDay = addDays(cursor, 6);
    events.push(
      makeEvent(trialDay, {
        type: "event",
        label: "Trial showcase",
        week: week + 1,
        description: "Invite scouts to witness your development in an open training scrimmage."
      })
    );

    const restDay = addDays(cursor, 0);
    events.push(
      makeEvent(restDay, {
        type: "rest",
        label: "Recovery",
        week: week + 1
      })
    );

    cursor = addDays(cursor, 7);
  }

  return events.sort((a, b) => a.date - b.date);
}

function opponentsFor(leagueName) {
  const league = findLeague(leagueName) ?? leagues[0];
  return shuffle(league.teams.map((team) => team.name));
}

export function generateLeagueSchedule(leagueName, startDate) {
  const league = findLeague(leagueName) ?? leagues[0];
  const events = [];
  let cursor = startOfWeek(startDate);
  const opponents = opponentsFor(league.name);
  const totalWeeks = league.weeks;

  for (let week = 0; week < totalWeeks; week += 1) {
    const matchDay = addDays(cursor, pick([5, 6]));
    events.push(
      makeEvent(matchDay, {
        type: "match",
        competition: league.name,
        opponent: opponents[week % opponents.length],
        week: week + 1
      })
    );

    const training = addDays(cursor, 2);
    events.push(
      makeEvent(training, {
        type: "training",
        label: `Club training week ${week + 1}`,
        week: week + 1
      })
    );

    const rest = addDays(cursor, 0);
    events.push(
      makeEvent(rest, {
        type: "rest",
        label: "Recovery",
        week: week + 1
      })
    );

    cursor = addDays(cursor, 7);
  }

  return events.sort((a, b) => a.date - b.date);
}

export function describeEvent(event) {
  const date = new Date(event.date);
  if (event.type === "match") {
    return `${formatDate(date)} · vs ${event.opponent}`;
  }
  if (event.type === "training") {
    return `${formatDate(date)} · Training`; 
  }
  if (event.type === "rest") {
    return `${formatDate(date)} · Recovery day`;
  }
  return `${formatDate(date)} · Event`;
}
