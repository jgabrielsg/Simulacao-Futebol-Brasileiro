import { haversineDistance, calculateCentroid } from './geoUtils.js';

/**
 * Season Transition and Re-clustering Manager
 */

/**
 * Executes a full season transition with strict Brazilian Football Logistics rules:
 * 
 * - Serie A <-> Serie B: 4 teams swapped (Bottom 4 A <-> Top 4 B).
 * - Serie B <-> Serie C: 
 *   - 4 bottom teams of B fall to Serie C.
 *   - Exactly 1 team (champion) from EACH of the 4 Serie C macro-regions (macro_0..3) ascends to Serie B (4 total).
 *   - Exactly 3 teams (bottom 3) from EACH of the 4 Serie C macro-regions fall to Serie D (12 total).
 * - Serie C <-> Serie D:
 *   - Exactly 1 team (champion) from EACH of the 12 Serie D micro-regions (micro_0..11) ascends to Serie C (12 total).
 *   - Exactly 3 teams (bottom 3) from EACH of the 12 Serie D micro-regions fall to Amateur (36 total).
 * - Serie D <-> Amateur (YO-YO EFFECT PREVENTED):
 *   - Step 1: Identify 3 relegated teams from each micro_K of Serie D and isolate them.
 *   - Step 2: Select 3 promoted teams from amador[micro_K] that ARE NOT the relegated teams.
 *   - Step 3: Remove promoted teams from amador[micro_K] and insert into Serie D.
 *   - Step 4: Insert relegated teams into amador[micro_K] pool ONLY AFTER promotions are finalized.
 */
export function transitionSeason(currentLeagues, standingsMap, teamsDb) {
  // Deep clone current leagues structure
  const nextLeagues = JSON.parse(JSON.stringify(currentLeagues));
  const centroids = currentLeagues.centroids || {};
  
  // Clone amador dictionary so we can update it in place without side effects
  const amadorDb = currentLeagues.amador ? JSON.parse(JSON.stringify(currentLeagues.amador)) : {};

  // -------------------------------------------------------------
  // 1. Serie A <-> Serie B
  // -------------------------------------------------------------
  const standingsA = standingsMap['serie_A'] || [];
  const standingsB = standingsMap['serie_B'] || [];

  const relegatedFromA = standingsA.slice(-4).map(s => s.teamId);
  const promotedFromB = standingsB.slice(0, 4).map(s => s.teamId);
  const relegatedFromB = standingsB.slice(-4).map(s => s.teamId);

  const stayInA = standingsA.slice(0, standingsA.length - 4).map(s => s.teamId);
  nextLeagues.serie_A = [...stayInA, ...promotedFromB];

  const stayInB = standingsB.slice(4, standingsB.length - 4).map(s => s.teamId);

  // -------------------------------------------------------------
  // 2. Serie B <-> Serie C (4 promoted to B, 12 relegated to D)
  // -------------------------------------------------------------
  const promotedFromC = [];  // 4 champions (1 per macro region)
  const relegatedFromC = []; // 12 bottom teams (3 per macro region)
  const lockedInC = { macro_0: [], macro_1: [], macro_2: [], macro_3: [] };

  ['macro_0', 'macro_1', 'macro_2', 'macro_3'].forEach(mKey => {
    const sC = standingsMap[`serie_C.${mKey}`] || [];
    if (sC.length >= 4) {
      promotedFromC.push(sC[0].teamId); // Top 1 team promoted to Serie B
      const bottom3 = sC.slice(-3).map(s => s.teamId); // Bottom 3 teams relegated to Serie D
      relegatedFromC.push(...bottom3);

      // Remaining 16 teams stay LOCKED in this macro-region
      const stay = sC.slice(1, sC.length - 3).map(s => s.teamId);
      lockedInC[mKey] = stay;
    } else {
      lockedInC[mKey] = currentLeagues.serie_C[mKey] || [];
    }
  });

  // Assemble new Serie B (20 teams)
  nextLeagues.serie_B = [...stayInB, ...relegatedFromA, ...promotedFromC];

  // -------------------------------------------------------------
  // 3. Serie C <-> Serie D (12 promoted to C, 36 relegated to Amateur)
  // -------------------------------------------------------------
  const promotedFromD = [];  // 12 champions (1 per micro region)
  const relegatedFromDByMicro = {}; // Store 3 relegated teams per micro-region
  const lockedInD = {};

  const microKeys = Array.from({ length: 12 }, (_, i) => `micro_${i}`);

  microKeys.forEach(dKey => {
    const sD = standingsMap[`serie_D.${dKey}`] || [];
    if (sD.length >= 4) {
      promotedFromD.push(sD[0].teamId); // Top 1 team promoted to Serie C

      // STEP 1: Identify the 3 relegated teams from micro_K of Serie D
      const bottom3 = sD.slice(-3).map(s => s.teamId);
      relegatedFromDByMicro[dKey] = bottom3;

      // Remaining teams stay LOCKED in this micro-region
      const stay = sD.slice(1, sD.length - 3).map(s => s.teamId);
      lockedInD[dKey] = stay;
    } else {
      relegatedFromDByMicro[dKey] = [];
      lockedInD[dKey] = currentLeagues.serie_D[dKey] || [];
    }
  });

  // Incoming to Serie C = 4 relegated from B + 12 promoted from D = 16 new teams
  const incomingToC = [...relegatedFromB, ...promotedFromD];

  // Re-cluster incoming teams into Serie C macro-regions (target 20 teams per macro-region)
  nextLeagues.serie_C = assignTeamsGreedy(lockedInC, incomingToC, 20, teamsDb, centroids);

  // -------------------------------------------------------------
  // 4. Serie D <-> Amateur (YO-YO EFFECT PREVENTED)
  // -------------------------------------------------------------
  const activeTeamsSet = new Set([
    ...nextLeagues.serie_A,
    ...nextLeagues.serie_B,
    ...Object.values(nextLeagues.serie_C).flat(),
    ...Object.values(lockedInD).flat()
  ]);

  const promotedFromAmateur = [];

  microKeys.forEach(dKey => {
    const relegatedFromThisMicro = relegatedFromDByMicro[dKey] || [];
    const pool = amadorDb[dKey] || [];

    // STEP 2: Filter out any team that was just relegated from this micro-region or is active
    const eligibleForPromotion = pool.filter(
      id => !relegatedFromThisMicro.includes(id) && !activeTeamsSet.has(id)
    );

    // Take top 3 eligible amateur teams
    const top3ToPromote = eligibleForPromotion.slice(0, 3);
    promotedFromAmateur.push(...top3ToPromote);

    // STEP 3: Remove promoted teams from amadorDb[dKey]
    amadorDb[dKey] = pool.filter(id => !top3ToPromote.includes(id));

    // STEP 4: ONLY NOW add the 3 relegated teams into amadorDb[dKey]
    amadorDb[dKey].push(...relegatedFromThisMicro);
  });

  // Incoming to Serie D = 12 relegated from C + 36 promoted from Amateur = 48 new teams
  const incomingToD = [...relegatedFromC, ...promotedFromAmateur];

  const targetPerMicro = Math.ceil(
    (Object.values(lockedInD).flat().length + incomingToD.length) / microKeys.length
  );

  // Re-cluster incoming teams into Serie D micro-regions
  nextLeagues.serie_D = assignTeamsGreedy(lockedInD, incomingToD, targetPerMicro, teamsDb, centroids);

  // Preserve updated amador database and centroids in nextLeagues object
  nextLeagues.amador = amadorDb;
  nextLeagues.centroids = centroids;

  return nextLeagues;
}

/**
 * Greedy Centroid Assignment Algorithm
 */
export function assignTeamsGreedy(lockedRegions, incomingTeamIds, targetCapacity, teamsDb, precomputedCentroids = {}) {
  const resultRegions = {};
  const regionCentroids = {};
  const unassigned = [...incomingTeamIds];

  Object.keys(lockedRegions).forEach(rKey => {
    resultRegions[rKey] = [...lockedRegions[rKey]];

    if (precomputedCentroids[rKey] && typeof precomputedCentroids[rKey].lat === 'number') {
      regionCentroids[rKey] = precomputedCentroids[rKey];
    } else {
      const regionTeams = resultRegions[rKey].map(id => teamsDb[id]).filter(Boolean);
      regionCentroids[rKey] = calculateCentroid(regionTeams);
    }
  });

  while (unassigned.length > 0) {
    let bestDist = Infinity;
    let bestTeamIdx = -1;
    let bestRegionKey = null;

    unassigned.forEach((teamId, tIdx) => {
      const team = teamsDb[teamId];
      if (!team || typeof team.lat !== 'number' || typeof team.lon !== 'number') return;

      Object.keys(resultRegions).forEach(rKey => {
        if (resultRegions[rKey].length < targetCapacity) {
          const c = regionCentroids[rKey];
          const dist = haversineDistance(team.lat, team.lon, c.lat, c.lon);
          if (dist < bestDist) {
            bestDist = dist;
            bestTeamIdx = tIdx;
            bestRegionKey = rKey;
          }
        }
      });
    });

    if (bestTeamIdx !== -1 && bestRegionKey) {
      const assignedId = unassigned.splice(bestTeamIdx, 1)[0];
      resultRegions[bestRegionKey].push(assignedId);
    } else {
      const fallbackTeamId = unassigned.pop();
      const minRegionKey = Object.keys(resultRegions).reduce((minKey, k) => 
        resultRegions[k].length < resultRegions[minKey].length ? k : minKey, Object.keys(resultRegions)[0]
      );
      resultRegions[minRegionKey].push(fallbackTeamId);
    }
  }

  return resultRegions;
}
