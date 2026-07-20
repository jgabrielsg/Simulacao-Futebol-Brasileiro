import { writable, derived } from 'svelte/store';
import { generateSchedule, createInitialStandings, simulateMatch, applyMatchToStandings, sortStandings } from '../utils/matchEngine.js';
import { transitionSeason } from '../utils/seasonManager.js';
import { buildTransportRoute } from '../utils/geoUtils.js';

// Base raw data stores
export const teamsDb = writable({});
export const leaguesInit = writable({});
export const airportsDb = writable({});
export const cityHubs = writable({});

export const loading = writable(true);
export const error = writable(null);

// Game progression state
export const currentSeason = writable(1);
export const currentLeagues = writable(null);

// UI Navigation selections
export const selectedDivision = writable('serie_A'); // 'serie_A', 'serie_B', 'serie_C', 'serie_D'
export const selectedRegion = writable('macro_0'); // 'macro_0'..'macro_3' or 'micro_0'..'micro_11'

// Schedules & Standings State
export const schedulesStore = writable({});
export const standingsStore = writable({});
export const roundProgressStore = writable({});

// Focused team for Map visualization
export const focusedTeamId = writable(null);

/**
 * Initializes and loads all static JSON databases
 */
export async function loadGameData() {
  loading.set(true);
  error.set(null);

  try {
    const [teamsRes, leaguesRes, airportsRes, hubsRes] = await Promise.all([
      fetch('/json/teams_db.json'),
      fetch('/json/leagues_init.json'),
      fetch('/json/airports_db.json'),
      fetch('/json/city_hubs.json')
    ]);

    if (!teamsRes.ok || !leaguesRes.ok || !airportsRes.ok || !hubsRes.ok) {
      throw new Error('Falha ao carregar os dados JSON estáticos da aplicação.');
    }

    const tDb = await teamsRes.json();
    const lInit = await leaguesRes.json();
    const aDb = await airportsRes.json();
    const cHubs = await hubsRes.json();

    teamsDb.set(tDb);
    leaguesInit.set(lInit);
    airportsDb.set(aDb);
    cityHubs.set(cHubs);

    currentLeagues.set(lInit);

    // Initialize schedules and standings for Season 1
    initializeSeasonState(lInit, tDb);

    loading.set(false);
  } catch (err) {
    console.error('Error loading game data:', err);
    error.set(err.message || 'Erro inesperado ao inicializar a base de dados.');
    loading.set(false);
  }
}

/**
 * Builds schedule and initial standings for all divisions/regions
 */
export function initializeSeasonState(leagues, tDb) {
  const newSchedules = {};
  const newStandings = {};
  const newProgress = {};

  // Serie A
  if (leagues.serie_A) {
    const key = 'serie_A';
    newSchedules[key] = generateSchedule(leagues.serie_A);
    newStandings[key] = createInitialStandings(leagues.serie_A, tDb);
    newProgress[key] = 0;
  }

  // Serie B
  if (leagues.serie_B) {
    const key = 'serie_B';
    newSchedules[key] = generateSchedule(leagues.serie_B);
    newStandings[key] = createInitialStandings(leagues.serie_B, tDb);
    newProgress[key] = 0;
  }

  // Serie C (macro_0..3)
  if (leagues.serie_C) {
    Object.keys(leagues.serie_C).forEach(mKey => {
      const key = `serie_C.${mKey}`;
      const teamIds = leagues.serie_C[mKey];
      newSchedules[key] = generateSchedule(teamIds);
      newStandings[key] = createInitialStandings(teamIds, tDb);
      newProgress[key] = 0;
    });
  }

  // Serie D (micro_0..11)
  if (leagues.serie_D) {
    Object.keys(leagues.serie_D).forEach(dKey => {
      const key = `serie_D.${dKey}`;
      const teamIds = leagues.serie_D[dKey];
      newSchedules[key] = generateSchedule(teamIds);
      newStandings[key] = createInitialStandings(teamIds, tDb);
      newProgress[key] = 0;
    });
  }

  schedulesStore.set(newSchedules);
  standingsStore.set(newStandings);
  roundProgressStore.set(newProgress);
}

/**
 * Derived store checking if ALL leagues across ALL divisions in the current season are 100% complete
 */
export const isSeasonComplete = derived(
  [schedulesStore, roundProgressStore],
  ([$schedules, $progress]) => {
    const keys = Object.keys($schedules);
    if (keys.length === 0) return false;

    return keys.every(key => {
      const schedule = $schedules[key] || [];
      const prog = $progress[key] || 0;
      return schedule.length > 0 && prog >= schedule.length;
    });
  }
);

/**
 * Derived store for current active league key
 */
export const activeLeagueKey = derived(
  [selectedDivision, selectedRegion],
  ([$div, $reg]) => {
    if ($div === 'serie_A' || $div === 'serie_B') return $div;
    if ($div === 'serie_C') return `serie_C.${$reg || 'macro_0'}`;
    if ($div === 'serie_D') return `serie_D.${$reg || 'micro_0'}`;
    return 'serie_A';
  }
);

/**
 * Derived store for list of team IDs in active league/region
 */
export const activeTeamIds = derived(
  [currentLeagues, selectedDivision, selectedRegion],
  ([$leagues, $div, $reg]) => {
    if (!$leagues) return [];
    if ($div === 'serie_A') return $leagues.serie_A || [];
    if ($div === 'serie_B') return $leagues.serie_B || [];
    if ($div === 'serie_C') return $leagues.serie_C?.[$reg || 'macro_0'] || [];
    if ($div === 'serie_D') return $leagues.serie_D?.[$reg || 'micro_0'] || [];
    return [];
  }
);

/**
 * Derived store for sorted standings array of active league
 */
export const activeStandings = derived(
  [standingsStore, activeLeagueKey],
  ([$standingsMap, $key]) => {
    const standingsObj = $standingsMap[$key] || {};
    return sortStandings(standingsObj);
  }
);

/**
 * Derived store for schedule rounds of active league
 */
export const activeSchedule = derived(
  [schedulesStore, activeLeagueKey],
  ([$schedules, $key]) => $schedules[$key] || []
);

/**
 * Derived store for current round index of active league
 */
export const activeRoundIndex = derived(
  [roundProgressStore, activeLeagueKey],
  ([$progress, $key]) => $progress[$key] || 0
);

/**
 * Derived store for active team objects
 */
export const activeTeamObjects = derived(
  [activeTeamIds, teamsDb],
  ([$ids, $db]) => $ids.map(id => ({ id, ...($db[id] || {}) }))
);

/**
 * Derived store computing transport route for focused team
 */
export const focusedRouteData = derived(
  [focusedTeamId, activeTeamObjects, activeSchedule, activeRoundIndex, teamsDb, cityHubs],
  ([$focusedId, $teams, $schedule, $roundIdx, $teamsDb, $cHubs]) => {
    if (!$focusedId || !$schedule || $schedule.length === 0) return null;

    let nextMatch = null;
    let isHome = true;

    for (let r = $roundIdx; r < $schedule.length; r++) {
      const round = $schedule[r];
      const match = round.matches.find(m => m.homeId === $focusedId || m.awayId === $focusedId);
      if (match) {
        nextMatch = match;
        isHome = match.homeId === $focusedId;
        break;
      }
    }

    if (!nextMatch) return null;

    const homeTeam = $teamsDb[nextMatch.homeId];
    const awayTeam = $teamsDb[nextMatch.awayId];
    const homeHub = $cHubs[nextMatch.homeId];
    const awayHub = $cHubs[nextMatch.awayId];

    if (!homeTeam || !awayTeam) return null;

    const route = buildTransportRoute(awayTeam, homeTeam, awayHub, homeHub);
    return {
      focusedTeamId: $focusedId,
      isHome,
      opponentId: isHome ? nextMatch.awayId : nextMatch.homeId,
      homeTeam,
      awayTeam,
      route
    };
  }
);

/**
 * GLOBAL SIMULATION: Simulates 1 round for ALL divisions and leagues in Brazil simultaneously
 */
export function simulateOneRound() {
  let allSchedules = {};
  let allProgress = {};
  let tDb = {};

  schedulesStore.subscribe(v => allSchedules = v)();
  roundProgressStore.subscribe(v => allProgress = v)();
  teamsDb.subscribe(v => tDb = v)();

  const leagueKeys = Object.keys(allSchedules);
  if (leagueKeys.length === 0) return;

  standingsStore.update(standingsMap => {
    leagueKeys.forEach(key => {
      const schedule = allSchedules[key] || [];
      const roundIdx = allProgress[key] || 0;

      if (roundIdx < schedule.length) {
        const roundToSimulate = schedule[roundIdx];
        const currentStandings = standingsMap[key] ? { ...standingsMap[key] } : {};

        roundToSimulate.matches.forEach(m => {
          if (!m.played) {
            const homeTeam = tDb[m.homeId];
            const awayTeam = tDb[m.awayId];
            const { homeGoals, awayGoals } = simulateMatch(homeTeam, awayTeam);
            m.played = true;
            m.homeGoals = homeGoals;
            m.awayGoals = awayGoals;
            applyMatchToStandings(currentStandings, m.homeId, m.awayId, homeGoals, awayGoals);
          }
        });

        standingsMap[key] = currentStandings;
      }
    });

    return standingsMap;
  });

  // Advance progress for all leagues that had remaining rounds
  roundProgressStore.update(p => {
    leagueKeys.forEach(key => {
      const schedule = allSchedules[key] || [];
      const roundIdx = p[key] || 0;
      if (roundIdx < schedule.length) {
        p[key] = roundIdx + 1;
      }
    });
    return p;
  });
}

/**
 * GLOBAL SIMULATION: Simulates all remaining rounds for ALL leagues until season completes
 */
export function simulateFullSeasonActive() {
  let complete = false;
  isSeasonComplete.subscribe(v => complete = v)();

  let maxSafetyCounter = 100;
  while (!complete && maxSafetyCounter > 0) {
    simulateOneRound();
    isSeasonComplete.subscribe(v => complete = v)();
    maxSafetyCounter--;
  }
}

/**
 * Advances to next season with promotion, relegation, and greedy re-clustering
 */
export function advanceToNextSeason() {
  let cLeagues = null;
  let sMap = {};
  let tDb = {};

  currentLeagues.subscribe(v => cLeagues = v)();
  standingsStore.subscribe(map => {
    Object.keys(map).forEach(k => {
      sMap[k] = sortStandings(map[k]);
    });
  })();
  teamsDb.subscribe(v => tDb = v)();

  if (!cLeagues || !sMap) return;

  const nextLeagues = transitionSeason(cLeagues, sMap, tDb);
  currentLeagues.set(nextLeagues);
  currentSeason.update(s => s + 1);

  // Re-initialize schedules and standings for the new season
  initializeSeasonState(nextLeagues, tDb);
}
