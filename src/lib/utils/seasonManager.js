import { haversineDistance, calculateCentroid } from './geoUtils.js';
import { assignTeamsHungarian } from './hungarian.js';

/**
 * Season Transition and Re-clustering Manager (Linear Assignment / Hungarian Algorithm)
 */

function formatTeamInfo(teamId, teamsDb, extra = {}) {
  const team = teamsDb[teamId] || {};
  const parts = teamId ? teamId.split('/') : [];
  return {
    teamId,
    name: team.nome || parts[0] || teamId,
    state: team.uf || team.estado || parts[1] || '',
    lat: team.lat,
    lon: team.lon,
    pagerank: team.pagerank || 0,
    ...extra
  };
}

/**
 * Executes a full season transition using Hungarian Algorithm (LAP) for regional re-clustering,
 * returning nextLeagues, transitionSummary (for Modal), and wizardData (for ReclusteringWizard).
 */
export function transitionSeason(currentLeagues, standingsMap, teamsDb, currentSeasonNum = 1) {
  const nextLeagues = JSON.parse(JSON.stringify(currentLeagues));
  const precomputedCentroids = currentLeagues.centroids || {};
  const amadorDb = currentLeagues.amador ? JSON.parse(JSON.stringify(currentLeagues.amador)) : {};

  // -------------------------------------------------------------
  // 1. Serie A <-> Serie B (4 teams swapped)
  // -------------------------------------------------------------
  const standingsA = standingsMap['serie_A'] || [];
  const standingsB = standingsMap['serie_B'] || [];

  const relegatedFromA_Ids = standingsA.slice(-4).map(s => s.teamId);
  const promotedFromB_Ids = standingsB.slice(0, 4).map(s => s.teamId);
  const relegatedFromB_Ids = standingsB.slice(-4).map(s => s.teamId);

  const stayInA = standingsA.slice(0, standingsA.length - 4).map(s => s.teamId);
  nextLeagues.serie_A = [...stayInA, ...promotedFromB_Ids];

  const stayInB = standingsB.slice(4, standingsB.length - 4).map(s => s.teamId);

  // -------------------------------------------------------------
  // 2. Serie B <-> Serie C (4 promoted to B, 12 relegated to D)
  // -------------------------------------------------------------
  const macroKeys = ['macro_0', 'macro_1', 'macro_2', 'macro_3'];
  const oldCentroidsC = {};
  const oldTeamsCByMacro = {};

  macroKeys.forEach(mKey => {
    const teamsInMacro = currentLeagues.serie_C[mKey] || [];
    oldTeamsCByMacro[mKey] = [...teamsInMacro];
    const teamObjs = teamsInMacro.map(id => teamsDb[id]).filter(Boolean);
    oldCentroidsC[mKey] = precomputedCentroids[mKey] || calculateCentroid(teamObjs);
  });

  const promotedFromC_Info = [];  // 4 champions (1 per macro region)
  const relegatedFromC_Info = []; // 12 bottom teams (3 per macro region)
  const lockedInC = { macro_0: [], macro_1: [], macro_2: [], macro_3: [] };

  macroKeys.forEach(mKey => {
    const sC = standingsMap[`serie_C.${mKey}`] || [];
    if (sC.length >= 4) {
      const champId = sC[0].teamId;
      promotedFromC_Info.push(formatTeamInfo(champId, teamsDb, { regionKey: mKey, regionLabel: mKey.replace('macro_', 'Macro ') }));

      const bottom3 = sC.slice(-3);
      bottom3.forEach(b => {
        relegatedFromC_Info.push(formatTeamInfo(b.teamId, teamsDb, { regionKey: mKey, regionLabel: mKey.replace('macro_', 'Macro ') }));
      });

      const stay = sC.slice(1, sC.length - 3).map(s => s.teamId);
      lockedInC[mKey] = stay;
    } else {
      lockedInC[mKey] = currentLeagues.serie_C[mKey] || [];
    }
  });

  const promotedFromC_Ids = promotedFromC_Info.map(t => t.teamId);
  const relegatedFromC_Ids = relegatedFromC_Info.map(t => t.teamId);

  // Assemble new Serie B (20 teams)
  nextLeagues.serie_B = [...stayInB, ...relegatedFromA_Ids, ...promotedFromC_Ids];

  // -------------------------------------------------------------
  // 3. Serie D PRE-TRANSITION: Compute Old Centroids & Identify Promoted/Relegated
  // -------------------------------------------------------------
  const microKeys = Array.from({ length: 12 }, (_, i) => `micro_${i}`);
  const oldCentroidsD = {};
  const oldTeamsDByMicro = {};

  microKeys.forEach(dKey => {
    const teamsInMicro = currentLeagues.serie_D[dKey] || [];
    oldTeamsDByMicro[dKey] = [...teamsInMicro];
    const teamObjs = teamsInMicro.map(id => teamsDb[id]).filter(Boolean);
    oldCentroidsD[dKey] = precomputedCentroids[dKey] || calculateCentroid(teamObjs);
  });

  const promotedFromD_Info = [];  // 12 champions (1 per micro region)
  const relegatedFromD_Info = []; // 36 bottom teams (3 per micro region)
  const relegatedFromDByMicro = {};
  const lockedInD = {};

  microKeys.forEach(dKey => {
    const sD = standingsMap[`serie_D.${dKey}`] || [];
    if (sD.length >= 4) {
      const champId = sD[0].teamId;
      promotedFromD_Info.push(formatTeamInfo(champId, teamsDb, { regionKey: dKey, regionLabel: dKey.replace('micro_', 'Micro ') }));

      const bottom3 = sD.slice(-3);
      bottom3.forEach(b => {
        relegatedFromD_Info.push(formatTeamInfo(b.teamId, teamsDb, { regionKey: dKey, regionLabel: dKey.replace('micro_', 'Macro ') }));
      });
      relegatedFromDByMicro[dKey] = bottom3.map(b => b.teamId);

      const stay = sD.slice(1, sD.length - 3).map(s => s.teamId);
      lockedInD[dKey] = stay;
    } else {
      relegatedFromDByMicro[dKey] = [];
      lockedInD[dKey] = currentLeagues.serie_D[dKey] || [];
    }
  });

  const promotedFromD_Ids = promotedFromD_Info.map(t => t.teamId);

  // Incoming to Serie C = 4 relegated from B + 12 promoted from D = 16 new teams
  const incomingToC = [...relegatedFromB_Ids, ...promotedFromD_Ids];

  // -------------------------------------------------------------
  // 4. HUNGARIAN ALGORITHM RE-CLUSTERING FOR SERIE C
  // Pool of 80 teams = 64 locked in C + 4 from B + 12 from D
  // Target: EXACTLY 20 slots per macro-region (80 total slots)
  // -------------------------------------------------------------
  const poolTeamsC = [
    ...Object.values(lockedInC).flat(),
    ...relegatedFromB_Ids,
    ...promotedFromD_Ids
  ];

  const targetSlotsC = { macro_0: 20, macro_1: 20, macro_2: 20, macro_3: 20 };
  const newLeaguesC = assignTeamsHungarian(poolTeamsC, targetSlotsC, oldCentroidsC, teamsDb, haversineDistance);
  nextLeagues.serie_C = newLeaguesC;

  // Recalculate new real centroids for Serie C
  const newCentroidsC = {};
  macroKeys.forEach(mKey => {
    const teamObjs = (newLeaguesC[mKey] || []).map(id => teamsDb[id]).filter(Boolean);
    newCentroidsC[mKey] = calculateCentroid(teamObjs);
  });

  // -------------------------------------------------------------
  // 5. SERIE D <-> AMATEUR (Yo-Yo Effect Prevented) & HUNGARIAN RE-CLUSTERING
  // Pool of 216 teams = 168 locked in D + 12 from C + 36 from Amateur
  // Target: EXACTLY 18 slots per micro-region (12 * 18 = 216 total slots!)
  // -------------------------------------------------------------
  const activeTeamsSet = new Set([
    ...nextLeagues.serie_A,
    ...nextLeagues.serie_B,
    ...Object.values(nextLeagues.serie_C).flat(),
    ...Object.values(lockedInD).flat()
  ]);

  const promotedFromAmateur_Ids = [];

  microKeys.forEach(dKey => {
    const relegatedFromThisMicro = relegatedFromDByMicro[dKey] || [];
    const pool = amadorDb[dKey] || [];

    const eligibleForPromotion = pool.filter(
      id => !relegatedFromThisMicro.includes(id) && !activeTeamsSet.has(id)
    );

    const top3ToPromote = eligibleForPromotion.slice(0, 3);
    promotedFromAmateur_Ids.push(...top3ToPromote);

    amadorDb[dKey] = pool.filter(id => !top3ToPromote.includes(id));
    amadorDb[dKey].push(...relegatedFromThisMicro);
  });

  const poolTeamsD = [
    ...Object.values(lockedInD).flat(),
    ...relegatedFromC_Ids,
    ...promotedFromAmateur_Ids
  ];

  // EXACTLY 18 slots per micro-region (12 * 18 = 216 teams!)
  const targetSlotsD = {};
  microKeys.forEach(dKey => targetSlotsD[dKey] = 18);

  const newLeaguesD = assignTeamsHungarian(poolTeamsD, targetSlotsD, oldCentroidsD, teamsDb, haversineDistance);
  nextLeagues.serie_D = newLeaguesD;

  // Recalculate new real centroids for Serie D
  const newCentroidsD = {};
  microKeys.forEach(dKey => {
    const teamObjs = (newLeaguesD[dKey] || []).map(id => teamsDb[id]).filter(Boolean);
    newCentroidsD[dKey] = calculateCentroid(teamObjs);
  });

  nextLeagues.amador = amadorDb;
  nextLeagues.centroids = { ...newCentroidsC, ...newCentroidsD };

  // -------------------------------------------------------------
  // 6. BUILD TRANSITION SUMMARY (MODAL) AND WIZARD ANIMATION DATA
  // -------------------------------------------------------------
  const summary = {
    seasonEnded: currentSeasonNum,
    relegatedFromA: relegatedFromA_Ids.map(id => formatTeamInfo(id, teamsDb)),
    promotedFromB: promotedFromB_Ids.map(id => formatTeamInfo(id, teamsDb)),
    relegatedFromB: relegatedFromB_Ids.map(id => formatTeamInfo(id, teamsDb)),
    promotedFromC: promotedFromC_Info,
    relegatedFromC: relegatedFromC_Info,
    promotedFromD: promotedFromD_Info,
    relegatedFromD: relegatedFromD_Info
  };

  const wizardData = {
    seasonNumber: currentSeasonNum,

    // Serie C Wizard Data (80 teams, 4 macros)
    oldTeamsCByMacro,
    oldCentroidsC,
    removedTeamsC: [...promotedFromC_Ids, ...relegatedFromC_Ids],
    incomingTeamsC: [...relegatedFromB_Ids, ...promotedFromD_Ids],
    newLeaguesC,
    newCentroidsC,

    // Serie D Wizard Data (216 teams, 12 micros)
    oldTeamsDByMicro,
    oldCentroidsD,
    removedTeamsD: [...promotedFromD_Ids, ...relegatedFromD_Info.map(t => t.teamId)],
    incomingTeamsD: [...relegatedFromC_Ids, ...promotedFromAmateur_Ids],
    newLeaguesD,
    newCentroidsD
  };

  return { nextLeagues, summary, wizardData };
}
