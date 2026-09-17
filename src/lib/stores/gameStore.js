import { writable, derived, get } from 'svelte/store';
import { base } from '$app/paths';
import { CONFERENCES_C, LEAGUES_BY_MACRO_D, getConferenceFromLeague } from '../utils/leagueNames.js';

// Global immutable caches
export const teamsDb = writable({});
export const seasonsIndex = writable([]);
export const loading = writable(true);
export const loadingSeason = writable(false);
export const error = writable(null);

// Unlocked seasons progression (Persisted in localStorage)
function getInitialUnlockedSeasons() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('unlockedSeasons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read unlockedSeasons from localStorage', e);
    }
  }
  return [1];
}

export const unlockedSeasons = writable(getInitialUnlockedSeasons());

export function saveUnlockedSeasons(seasons) {
  unlockedSeasons.set(seasons);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('unlockedSeasons', JSON.stringify(seasons));
    } catch (e) {
      console.warn('Could not save unlockedSeasons to localStorage', e);
    }
  }
}

export function unlockNextSeason() {
  const current = get(currentSeasonNum);
  const next = current + 1;
  const list = get(unlockedSeasons);
  if (!list.includes(next)) {
    const updated = [...list, next].sort((a, b) => a - b);
    saveUnlockedSeasons(updated);
  }
}

export function resetAllProgression() {
  saveUnlockedSeasons([1]);
  loadSeason(1, true);
}

// Active Progression State
export const currentSeasonNum = writable(1); // 1 to 5
export const seasonDataStore = writable(null); // lazy-loaded season_{t}.json

// 3 Sporting Stages: 'grupos' -> 'playins' -> 'playoffs_finais' -> 'concluida'
export const seasonStage = writable('grupos');
export const simulatedRoundsCount = writable(0); // 0 at season start!

// Multi-step Knockout phase progression
export const playinsStep = writable(0); // 0: unplayed, 1: semis C & oitavas D, 2: final C & quartas D (complete)
export const playoffsStep = writable(0); // 0: unplayed, 1: quartas C & semis D, 2: semis C, 3: final C (complete)

// Backward compatibility derived stores
export const playinsSimulated = derived(playinsStep, $s => $s >= 2);
export const playoffsSimulated = derived(playoffsStep, $s => $s >= 3);

// Navigation selections
export const activeDivision = writable('serie_c'); // 'serie_c' | 'serie_d'
export const activeGroup = writable('SUDESTE'); // conference key (C) or league key (D)
export const currentRound = writable(1);

// Active UI Tab
export const activeDashboardTab = writable('classificacao_rodadas');

// Team Focus for Map & Itinerary Detail
export const focusedTeamId = writable(null);

// Explainer Modal for Stage Transitions (Popups 1 & 2)
export const showStageExplainerModal = writable(false);
export const stageExplainerData = writable(null);

// End-of-Season Reclustering Wizard Modal (Popup 3)
export const showWizardModal = writable(false);

// 5-Year Quinquennium Summary Modal
export const showQuinquenniumSummaryModal = writable(false);

// Social Share Card Modal for Focused Club
export const showSocialShareModal = writable(false);
export function openSocialShareModal() {
  showSocialShareModal.set(true);
}

/**
 * Initializes global stores: teams_db.json & seasons_index.json, then loads season 1
 */
export async function loadInitialData() {
  loading.set(true);
  error.set(null);

  try {
    const basePath = base ? base.replace(/\/$/, '') : '';
    const [teamsRes, indexRes] = await Promise.all([
      fetch(`${basePath}/json/teams_db.json`),
      fetch(`${basePath}/json/seasons_index.json`)
    ]);

    if (!teamsRes.ok || !indexRes.ok) {
      throw new Error('Falha ao carregar banco global de clubes ou índice de temporadas.');
    }

    const tDb = await teamsRes.json();
    const sIndex = await indexRes.json();

    teamsDb.set(tDb);
    seasonsIndex.set(sIndex);

    // If unlocked seasons was stored, ensure current is valid
    const unlocked = get(unlockedSeasons);
    const initialSeason = unlocked.length > 0 ? unlocked[0] : 1;

    // Load initial season in clean zeroed state (0 rounds simulated)
    await loadSeason(initialSeason, true);

    loading.set(false);
  } catch (err) {
    console.error('Error loading initial game data:', err);
    error.set(err.message || 'Erro inesperado ao inicializar a base de dados.');
    loading.set(false);
  }
}

/**
 * Lazy loads a specific season (1 to 5) on demand
 * @param {number} seasonNum 
 * @param {boolean} resetProgression - if true, resets simulatedRounds to 0 and stage to 'grupos'
 */
export async function loadSeason(seasonNum, resetProgression = true) {
  const maxSeasons = get(seasonsIndex)?.length || 5;
  if (seasonNum < 1 || seasonNum > maxSeasons) return;
  loadingSeason.set(true);

  try {
    const basePath = base ? base.replace(/\/$/, '') : '';
    const res = await fetch(`${basePath}/json/seasons/season_${seasonNum}.json`);
    if (!res.ok) {
      throw new Error(`Falha ao carregar dados da Temporada ${seasonNum}.`);
    }

    const sData = await res.json();
    seasonDataStore.set(sData);
    currentSeasonNum.set(seasonNum);

    if (resetProgression) {
      seasonStage.set('grupos');
      simulatedRoundsCount.set(0);
      currentRound.set(1);
      playinsStep.set(0);
      playoffsStep.set(0);
      activeDashboardTab.set('classificacao_rodadas');
    }

    // Keep activeGroup valid
    const div = get(activeDivision);
    const grp = get(activeGroup);

    if (div === 'serie_c') {
      if (!CONFERENCES_C.includes(grp)) {
        activeGroup.set('SUDESTE');
      }
    } else {
      const allDLeagues = Object.values(LEAGUES_BY_MACRO_D).flat();
      if (!allDLeagues.includes(grp)) {
        activeGroup.set('SUDESTE_LIGA_1');
      }
    }

    focusedTeamId.set(null);
    loadingSeason.set(false);
  } catch (err) {
    console.error(`Error loading season ${seasonNum}:`, err);
    error.set(err.message);
    loadingSeason.set(false);
  }
}

/**
 * Changes division ('serie_c' or 'serie_d')
 */
export function setDivision(div) {
  activeDivision.set(div);
  if (div === 'serie_c') {
    activeGroup.set('SUDESTE');
  } else {
    activeGroup.set('SUDESTE_LIGA_1');
  }
  focusedTeamId.set(null);
}

/**
 * Sets active group (conference or regional league)
 */
export function setActiveGroup(grp) {
  activeGroup.set(grp);
  focusedTeamId.set(null);
}

/**
 * Focuses on a team for detailed itinerary analysis
 */
export function focusTeam(teamId) {
  if (get(focusedTeamId) === teamId) {
    focusedTeamId.set(null);
  } else {
    focusedTeamId.set(teamId);
  }
}

export function clearFocusedTeam() {
  focusedTeamId.set(null);
}

// -------------------------------------------------------------
// Interactive Simulation Controls (The 3 Stages Engine)
// -------------------------------------------------------------

/**
 * Simulates next knockout step in play-ins or playoffs without premature stage advancement
 */
export function simulateNextKnockout() {
  const stage = get(seasonStage);
  if (stage === 'playins') {
    const current = get(playinsStep);
    if (current < 2) {
      playinsStep.set(current + 1);
    }
  } else if (stage === 'playoffs_finais') {
    const current = get(playoffsStep);
    if (current < 3) {
      playoffsStep.set(current + 1);
    }
  }
}

/**
 * Advances to the next stage if all matches of the current stage have been simulated.
 */
export function advanceToNextStage() {
  const stage = get(seasonStage);
  if (stage === 'grupos') {
    if (get(simulatedRoundsCount) >= get(maxSeasonRounds)) {
      transitionToPlayins();
    }
  } else if (stage === 'playins') {
    if (get(playinsStep) >= 2) {
      transitionToPlayoffs();
    }
  } else if (stage === 'playoffs_finais') {
    if (get(playoffsStep) >= 3) {
      seasonStage.set('concluida');
      showWizardModal.set(true);
    }
  }
}

/**
 * Simulates 1 round in the group stage or advances 1 knockout step
 */
export function simulateOneRound() {
  const stage = get(seasonStage);
  if (stage === 'grupos') {
    const currentCount = get(simulatedRoundsCount);
    const maxR = get(maxSeasonRounds);

    if (currentCount < maxR) {
      const nextCount = currentCount + 1;
      simulatedRoundsCount.set(nextCount);
      currentRound.set(nextCount);
      // Explicit advancement: user reviews rounds and clicks "Passar de Fase"
    }
  } else {
    simulateNextKnockout();
  }
}

/**
 * Fast-forwards the current stage (simulating remaining matches)
 */
export function simulateCurrentStage() {
  const stage = get(seasonStage);

  if (stage === 'grupos') {
    const maxR = get(maxSeasonRounds);
    simulatedRoundsCount.set(maxR);
    currentRound.set(maxR);
  } else if (stage === 'playins') {
    playinsStep.set(2);
  } else if (stage === 'playoffs_finais') {
    playoffsStep.set(3);
  } else if (stage === 'concluida') {
    showWizardModal.set(true);
  }
}

/**
 * Triggered when regular group stage ends -> prepares Phase 2 (Play-ins)
 */
function transitionToPlayins() {
  seasonStage.set('playins');
  playinsStep.set(0); // Starts at step 0 (unsimulated)
  activeDashboardTab.set('playoffs');

  // Build classified clubs data for Popup 1
  const sData = get(seasonDataStore);
  const cClassificacao = sData?.serie_c?.classificacao || {};
  
  // Extract 4 BYE champions and 16 play-in clubs for Serie C
  const cByeChampions = [];
  const cPlayinClubs = [];
  for (const conf of ['SUDESTE', 'SUL', 'NORDESTE', 'NORTE-CENTRO']) {
    const confTable = cClassificacao[conf] || [];
    if (confTable.length > 0) {
      cByeChampions.push({
        clube: confTable[0].clube,
        conf,
        pts: confTable[0].pts,
        v: confTable[0].v
      });
      for (let i = 1; i <= Math.min(4, confTable.length - 1); i++) {
        cPlayinClubs.push({
          clube: confTable[i].clube,
          pos: i + 1,
          conf,
          pts: confTable[i].pts,
          v: confTable[i].v
        });
      }
    }
  }

  // Trigger Explainer Popup 1 (sober, academic tone)
  stageExplainerData.set({
    stage: 1, // End of stage 1
    title: 'Fase Regular Concluída',
    subtitle: 'Classificados para os Play-ins Regionais',
    description: 'A fase regular de grupos foi finalizada. Conforme o regulamento do modelo, os 4 líderes de conferência da Série C garantem vaga direta nas Quartas de Final Nacionais (BYE). Do 2º ao 5º colocado de cada região disputam play-ins locais em jogo único para definição da segunda vaga regional. Na Série D, os 64 classificados avançam para o mata-mata regional estruturado por proximidade territorial. A paridade estritamente par das conferências garantiu que 100% dos clubes jogassem todas as rodadas sem folgas forçadas (zero bye weeks).',
    highlight: 'Série C: 4 líderes com BYE + 16 clubes em play-ins locais (100% das rodadas ativas). Série D: 64 clubes no mata-mata regional.',
    cByeChampions,
    cPlayinClubs,
    dClassifiedCount: 64
  });
  showStageExplainerModal.set(true);
}

/**
 * Triggered when play-ins are simulated -> prepares Phase 3 (Playoffs Finais)
 */
function transitionToPlayoffs() {
  seasonStage.set('playoffs_finais');
  playoffsStep.set(0); // Starts at step 0 (unsimulated)
  activeDashboardTab.set('playoffs');

  // Trigger Explainer Popup 2 (sober, academic tone, without spoilers)
  stageExplainerData.set({
    stage: 2, // End of stage 2
    title: 'Play-ins Regionais Concluídos',
    subtitle: 'Definição dos Confrontos Decisivos de Acesso',
    description: 'Os play-ins locais foram concluídos. A competição atinge a fase decisiva de acessos. Na Série C, os 4 confrontos de ida e volta do Nacional dos 8 definem as 4 vagas de promoção para a Série B. Na Série D, as 8 semifinais regionais determinam os 8 acessos para a Série C (2 por macrorregião).',
    highlight: 'Série C: vencedores das quartas sobem para a Série B. Série D: vencedores das semifinais sobem para a Série C.'
  });
  showStageExplainerModal.set(true);
}

/**
 * Finishes transition and starts the next season
 */
export function advanceToNextSeason() {
  showWizardModal.set(false);
  const maxSeasons = get(seasonsIndex)?.length || 5;
  const current = get(currentSeasonNum);
  const nextSeason = current + 1;
  unlockNextSeason();

  if (nextSeason <= maxSeasons) {
    loadSeason(nextSeason, true);
  } else {
    // Reached end of Quinquennium!
    showQuinquenniumSummaryModal.set(true);
  }
}

// -------------------------------------------------------------
// Derived Stores
// -------------------------------------------------------------

export const currentSeasonSummary = derived(
  [seasonsIndex, currentSeasonNum],
  ([$index, $seasonNum]) => {
    if (!$index || !$index.length) return null;
    return $index.find(item => item.temporada === $seasonNum) || null;
  }
);

export const currentGroupTeams = derived(
  [seasonDataStore, activeDivision, activeGroup],
  ([$season, $div, $grp]) => {
    if (!$season) return [];
    if ($div === 'serie_c') {
      const conf = CONFERENCES_C.includes($grp) ? $grp : 'SUDESTE';
      return $season.serie_c?.conferencias?.[conf] || [];
    } else {
      const allDLeagues = Object.values(LEAGUES_BY_MACRO_D).flat();
      const lg = allDLeagues.includes($grp) ? $grp : 'SUDESTE_LIGA_1';
      return $season.serie_d?.ligas?.[lg] || [];
    }
  }
);

export const currentRoundsList = derived(
  [seasonDataStore, activeDivision, activeGroup],
  ([$season, $div, $grp]) => {
    if (!$season) return [];
    if ($div === 'serie_c') {
      const conf = CONFERENCES_C.includes($grp) ? $grp : 'SUDESTE';
      return $season.serie_c?.rodadas?.[conf] || [];
    } else {
      const allDLeagues = Object.values(LEAGUES_BY_MACRO_D).flat();
      const lg = allDLeagues.includes($grp) ? $grp : 'SUDESTE_LIGA_1';
      return $season.serie_d?.rodadas?.[lg] || [];
    }
  }
);

export const totalRounds = derived(
  [currentRoundsList],
  ([$rounds]) => {
    return $rounds.length || 1;
  }
);

/**
 * Maximum rounds across all conferences/leagues for the active season (e.g. 30, 34)
 */
export const maxSeasonRounds = derived([seasonDataStore], ([$season]) => {
  if (!$season) return 30;
  let maxR = 0;
  if ($season.serie_c?.rodadas) {
    for (const rList of Object.values($season.serie_c.rodadas)) {
      if (Array.isArray(rList) && rList.length > maxR) {
        maxR = rList.length;
      }
    }
  }
  if ($season.serie_d?.rodadas) {
    for (const rList of Object.values($season.serie_d.rodadas)) {
      if (Array.isArray(rList) && rList.length > maxR) {
        maxR = rList.length;
      }
    }
  }
  return maxR || 30;
});

/**
 * Matches of the current round viewed (clamped safely to available league rounds)
 */
export const currentRoundMatches = derived(
  [currentRoundsList, currentRound],
  ([$rounds, $r]) => {
    if (!$rounds || !$rounds.length) return [];
    const effectiveRound = Math.min(Math.max(1, $r), $rounds.length);
    const found = $rounds.find(item => item.rodada === effectiveRound);
    return found ? (found.jogos || []) : [];
  }
);

/**
 * Matches of the LAST SIMULATED round in the groups
 */
export const lastSimulatedRoundMatches = derived(
  [currentRoundsList, simulatedRoundsCount],
  ([$rounds, $count]) => {
    if (!$rounds || !$rounds.length || $count === 0) return [];
    const effectiveRound = Math.min($count, $rounds.length);
    const found = $rounds.find(item => item.rodada === effectiveRound);
    return found ? (found.jogos || []) : [];
  }
);

/**
 * Progressive Standings Table
 * Recalculated dynamically based on rounds 1..simulatedRoundsCount.
 * When in playins/playoffs, always evaluates full regular season standings.
 */
export const progressiveStandings = derived(
  [currentGroupTeams, currentRoundsList, simulatedRoundsCount, seasonStage, teamsDb],
  ([$teams, $rounds, $count, $stage, $db]) => {
    if (!$teams || !$teams.length) return [];

    // Initialize blank table
    const tableMap = {};
    $teams.forEach(id => {
      const teamObj = $db[id] || {};
      const parts = id.split('/');
      tableMap[id] = {
        clube: id,
        nome: teamObj.nome || parts[0],
        j: 0,
        pts: 0,
        v: 0,
        e: 0,
        d: 0,
        gp: 0,
        gc: 0,
        sg: 0,
        pagerank: teamObj.pagerank || 0
      };
    });

    // Determine how many rounds of this group to accumulate
    const isPostGroups = $stage !== 'grupos';
    const effectiveMaxRound = isPostGroups ? ($rounds?.length || 0) : Math.min($count, $rounds?.length || 0);

    if (effectiveMaxRound > 0 && $rounds && $rounds.length) {
      for (let r = 1; r <= effectiveMaxRound; r++) {
        const roundObj = $rounds.find(item => item.rodada === r);
        if (roundObj && roundObj.jogos) {
          roundObj.jogos.forEach(m => {
            const home = tableMap[m.mandante];
            const away = tableMap[m.visitante];
            if (!home || !away) return;

            const gm = m.gols_mandante;
            const gv = m.gols_visitante;

            home.j += 1;
            away.j += 1;
            home.gp += gm;
            home.gc += gv;
            home.sg = home.gp - home.gc;

            away.gp += gv;
            away.gc += gm;
            away.sg = away.gp - away.gc;

            if (gm > gv) {
              home.v += 1;
              home.pts += 3;
              away.d += 1;
            } else if (gm < gv) {
              away.v += 1;
              away.pts += 3;
              home.d += 1;
            } else {
              home.e += 1;
              home.pts += 1;
              away.e += 1;
              away.pts += 1;
            }
          });
        }
      }
    }

    // Sort standings by: 1. PTS -> 2. V -> 3. SG -> 4. GP -> 5. PageRank
    const sorted = Object.values(tableMap).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.v !== a.v) return b.v - a.v;
      if (b.sg !== a.sg) return b.sg - a.sg;
      if (b.gp !== a.gp) return b.gp - a.gp;
      return (b.pagerank || 0) - (a.pagerank || 0);
    });

    sorted.forEach((row, idx) => {
      row.pos = idx + 1;
    });

    return sorted;
  }
);

/**
 * Focused Team Detailed Logistics Stats & Completed Itinerary
 */
export const focusedTeamStats = derived(
  [focusedTeamId, currentRoundsList, simulatedRoundsCount, teamsDb],
  ([$teamId, $rounds, $count, $db]) => {
    if (!$teamId || !$rounds || !$rounds.length) return null;

    const teamObj = $db[$teamId] || {};
    const homeMatches = [];
    const localAwayMatches = [];
    const awayTrips = [];
    let totalKm = 0;
    let totalCostBrl = 0;
    let busTrips = 0;
    let airTrips = 0;
    let ttpTourTrips = 0;

    const maxR = Math.min($count || $rounds.length, $rounds.length);

    for (let r = 1; r <= maxR; r++) {
      const roundObj = $rounds.find(item => item.rodada === r);
      if (roundObj && roundObj.jogos) {
        roundObj.jogos.forEach(m => {
          // 1. HOME MATCH (Mandante na Sede)
          if (m.mandante === $teamId) {
            const oppObj = $db[m.visitante] || {};
            const isLocalDerby = Boolean(oppObj.cidade && teamObj.cidade && oppObj.cidade === teamObj.cidade);
            homeMatches.push({
              rodada: r,
              adversario: m.visitante,
              adversarioNome: oppObj.nome || m.visitante.split('/')[0],
              adversarioCidade: oppObj.cidade || '',
              adversarioUf: oppObj.uf || '',
              placar: `${m.gols_mandante} x ${m.gols_visitante}`,
              golsMandante: m.gols_mandante,
              golsVisitante: m.gols_visitante,
              isLocalDerby
            });
          }

          // 2. AWAY MATCH (Visitante)
          if (m.visitante === $teamId) {
            const oppObj = $db[m.mandante] || {};
            const d = m.deslocamento;
            const isLocalDerby = Boolean(
              (oppObj.cidade && teamObj.cidade && oppObj.cidade === teamObj.cidade) ||
              (d && d.destino_cidade && teamObj.cidade && d.destino_cidade === teamObj.cidade)
            );

            if (isLocalDerby) {
              // Local Derby in the home city as visitor (no intermunicipal travel)
              localAwayMatches.push({
                rodada: r,
                adversario: m.mandante,
                adversarioNome: oppObj.nome || m.mandante.split('/')[0],
                adversarioCidade: oppObj.cidade || teamObj.cidade || '',
                adversarioUf: oppObj.uf || teamObj.uf || '',
                placar: `${m.gols_mandante} x ${m.gols_visitante}`,
                golsMandante: m.gols_mandante,
                golsVisitante: m.gols_visitante,
                deslocamento: d,
                isLocalDerby: true
              });
            } else if (d) {
              // Intercity travel to another city
              awayTrips.push({
                rodada: r,
                adversario: m.mandante,
                adversarioNome: oppObj.nome || m.mandante.split('/')[0],
                adversarioCidade: oppObj.cidade || d.destino_cidade || '',
                adversarioUf: oppObj.uf || d.destino_uf || '',
                placar: `${m.gols_mandante} x ${m.gols_visitante}`,
                golsMandante: m.gols_mandante,
                golsVisitante: m.gols_visitante,
                deslocamento: d,
                isLocalDerby: false
              });

              totalKm += (d.distancia_km || 0);
              totalCostBrl += (d.custo_brl || 0);

              if (d.modal === 'AIR') airTrips += 1;
              else busTrips += 1;

              if (d.origem_tipo === 'CIDADE_ADVERSARIO_ANTERIOR') ttpTourTrips += 1;
            }
          }
        });
      }
    }

    return {
      teamId: $teamId,
      teamObj,
      homeMatches,
      localAwayMatches,
      awayTrips,
      totalKm,
      totalCostBrl,
      busTrips,
      airTrips,
      ttpTourTrips,
      matchesPlayed: homeMatches.length + localAwayMatches.length + awayTrips.length
    };
  }
);

export const currentPlayoffs = derived(
  [seasonDataStore, activeDivision],
  ([$season, $div]) => {
    if (!$season) return null;
    return $div === 'serie_c' ? $season.serie_c?.playoffs : $season.serie_d?.playoffs;
  }
);

export const currentTransitions = derived(
  [seasonDataStore],
  ([$season]) => {
    if (!$season) return null;
    return $season.transicoes || null;
  }
);
