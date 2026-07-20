/**
 * Stochastic Match Engine based on PageRank and Poisson Distribution
 */

/**
 * Generates a random integer from a Poisson distribution with mean lambda.
 * Uses Knuth's algorithm.
 */
export function samplePoisson(lambda) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L && k < 15);
  
  return k - 1;
}

/**
 * Simulates a single match between a home team and an away team.
 * @param {Object} homeTeam Data object for home team (must include pagerank)
 * @param {Object} awayTeam Data object for away team (must include pagerank)
 * @returns {Object} { homeGoals, awayGoals }
 */
export function simulateMatch(homeTeam, awayTeam) {
  const homePR = (homeTeam && homeTeam.pagerank) ? homeTeam.pagerank : 0.001;
  const awayPR = (awayTeam && awayTeam.pagerank) ? awayTeam.pagerank : 0.001;

  // Normalized relative difference in PageRank (-1 to 1)
  const prDiff = (homePR - awayPR) / (homePR + awayPR + 1e-6);

  // Expected goals (lambda)
  // Base expectation ~1.35 goals; Home advantage ~ +0.25
  const lambdaHome = Math.max(0.2, 1.45 + (prDiff * 1.3) + 0.25);
  const lambdaAway = Math.max(0.2, 1.15 - (prDiff * 1.1));

  const homeGoals = samplePoisson(lambdaHome);
  const awayGoals = samplePoisson(lambdaAway);

  return { homeGoals, awayGoals };
}

/**
 * Generates a full double round-robin match schedule for a league of team IDs.
 * @param {Array<string>} teamIds Array of team ID keys
 * @returns {Array<Object>} Array of round objects [{ roundNumber, matches: [{ homeId, awayId }] }]
 */
export function generateSchedule(teamIds) {
  if (!teamIds || teamIds.length < 2) return [];
  const teams = [...teamIds];
  
  // If odd number of teams, add a bye
  const isOdd = teams.length % 2 !== 0;
  if (isOdd) {
    teams.push(null);
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  const rounds = [];

  // First half of season (First leg)
  for (let r = 0; r < numRounds; r++) {
    const matches = [];
    for (let i = 0; i < half; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];
      if (home !== null && away !== null) {
        matches.push({ homeId: home, awayId: away, played: false, homeGoals: null, awayGoals: null });
      }
    }
    rounds.push({ roundNumber: r + 1, matches });

    // Rotate teams array except first item
    teams.splice(1, 0, teams.pop());
  }

  // Second half of season (Return leg - reverse home/away)
  const returnRounds = [];
  for (let r = 0; r < numRounds; r++) {
    const firstLegRound = rounds[r];
    const returnMatches = firstLegRound.matches.map(m => ({
      homeId: m.awayId,
      awayId: m.homeId,
      played: false,
      homeGoals: null,
      awayGoals: null
    }));
    returnRounds.push({ roundNumber: numRounds + r + 1, matches: returnMatches });
  }

  return [...rounds, ...returnRounds];
}

/**
 * Initializes empty standings table for a list of team IDs
 */
export function createInitialStandings(teamIds, teamsDb) {
  const standings = {};
  teamIds.forEach(id => {
    const teamInfo = teamsDb[id] || {};
    standings[id] = {
      teamId: id,
      name: teamInfo.nome || id.split('/')[0],
      state: teamInfo.uf || teamInfo.estado || '',
      pagerank: teamInfo.pagerank || 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    };
  });
  return standings;
}

/**
 * Updates standings map with a match result
 */
export function applyMatchToStandings(standings, homeId, awayId, homeGoals, awayGoals) {
  const home = standings[homeId];
  const away = standings[awayId];

  if (!home || !away) return;

  home.played += 1;
  away.played += 1;

  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  home.goalDifference = home.goalsFor - home.goalsAgainst;

  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (homeGoals > awayGoals) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (homeGoals < awayGoals) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    home.points += 1;
    away.drawn += 1;
    away.points += 1;
  }
}

/**
 * Sorts standings by: Points desc, Wins desc, Goal Difference desc, Goals For desc, PageRank desc
 */
export function sortStandings(standingsObj) {
  return Object.values(standingsObj).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.pagerank - a.pagerank;
  });
}
