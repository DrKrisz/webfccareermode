export const leagues = [
  {
    name: "Premier League",
    weeks: 38,
    teams: [
      { name: "Arsenal", rating: 89 },
      { name: "Aston Villa", rating: 82 },
      { name: "Chelsea", rating: 87 },
      { name: "Liverpool", rating: 91 },
      { name: "Manchester City", rating: 93 },
      { name: "Manchester United", rating: 85 },
      { name: "Newcastle United", rating: 84 },
      { name: "Tottenham Hotspur", rating: 83 },
      { name: "Brighton", rating: 81 },
      { name: "Brentford", rating: 79 },
      { name: "Everton", rating: 78 },
      { name: "West Ham", rating: 80 },
      { name: "Crystal Palace", rating: 77 },
      { name: "Leicester City", rating: 79 },
      { name: "Wolves", rating: 76 },
      { name: "Fulham", rating: 78 },
      { name: "Southampton", rating: 76 },
      { name: "Bournemouth", rating: 75 },
      { name: "Nottingham Forest", rating: 74 },
      { name: "Leeds United", rating: 75 }
    ]
  },
  {
    name: "La Liga",
    weeks: 38,
    teams: [
      { name: "Barcelona", rating: 91 },
      { name: "Real Madrid", rating: 92 },
      { name: "Atletico Madrid", rating: 88 },
      { name: "Real Sociedad", rating: 84 },
      { name: "Athletic Club", rating: 83 },
      { name: "Sevilla", rating: 82 },
      { name: "Villarreal", rating: 82 },
      { name: "Real Betis", rating: 81 },
      { name: "Valencia", rating: 79 },
      { name: "Celta Vigo", rating: 78 },
      { name: "Girona", rating: 79 },
      { name: "Osasuna", rating: 78 },
      { name: "Getafe", rating: 77 },
      { name: "Mallorca", rating: 76 },
      { name: "Cadiz", rating: 74 },
      { name: "Alaves", rating: 75 },
      { name: "Las Palmas", rating: 74 },
      { name: "Granada", rating: 73 },
      { name: "Espanyol", rating: 76 },
      { name: "Rayo Vallecano", rating: 77 }
    ]
  },
  {
    name: "Serie A",
    weeks: 38,
    teams: [
      { name: "Inter", rating: 90 },
      { name: "Milan", rating: 88 },
      { name: "Juventus", rating: 87 },
      { name: "Napoli", rating: 87 },
      { name: "Roma", rating: 85 },
      { name: "Atalanta", rating: 85 },
      { name: "Lazio", rating: 84 },
      { name: "Fiorentina", rating: 82 },
      { name: "Bologna", rating: 81 },
      { name: "Torino", rating: 80 },
      { name: "Sassuolo", rating: 79 },
      { name: "Udinese", rating: 78 },
      { name: "Empoli", rating: 76 },
      { name: "Genoa", rating: 77 },
      { name: "Monza", rating: 78 },
      { name: "Parma", rating: 75 },
      { name: "Cagliari", rating: 75 },
      { name: "Hellas Verona", rating: 75 },
      { name: "Salernitana", rating: 74 },
      { name: "Lecce", rating: 73 }
    ]
  },
  {
    name: "Bundesliga",
    weeks: 34,
    teams: [
      { name: "Bayern Munich", rating: 92 },
      { name: "Borussia Dortmund", rating: 87 },
      { name: "RB Leipzig", rating: 85 },
      { name: "Bayer Leverkusen", rating: 86 },
      { name: "Union Berlin", rating: 82 },
      { name: "Eintracht Frankfurt", rating: 82 },
      { name: "Freiburg", rating: 81 },
      { name: "Stuttgart", rating: 80 },
      { name: "Hoffenheim", rating: 79 },
      { name: "Wolfsburg", rating: 80 },
      { name: "Monchengladbach", rating: 78 },
      { name: "Werder Bremen", rating: 76 },
      { name: "Augsburg", rating: 75 },
      { name: "Bochum", rating: 73 },
      { name: "Heidenheim", rating: 72 },
      { name: "Mainz", rating: 75 },
      { name: "Köln", rating: 76 },
      { name: "Darmstadt", rating: 71 }
    ]
  }
];

export function findLeague(name) {
  return leagues.find((league) => league.name === name);
}

export function findTeam(clubName) {
  for (const league of leagues) {
    const team = league.teams.find((team) => team.name === clubName);
    if (team) {
      return { ...team, league: league.name };
    }
  }
  return null;
}

export function allClubs() {
  return leagues.flatMap((league) => league.teams.map((team) => ({ ...team, league: league.name })));
}
