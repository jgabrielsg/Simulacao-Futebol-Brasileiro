/**
 * Hungarian (Kuhn-Munkres / Jonker-Volgenant) Algorithm in pure JavaScript.
 * Solves the Linear Assignment Problem (LAP) for an N x M cost matrix in O(N^3) time.
 * Returns an array where result[i] is the column index assigned to row i.
 */

export function solveHungarian(costMatrix) {
  if (!costMatrix || costMatrix.length === 0) return [];

  const n = costMatrix.length;
  const m = costMatrix[0].length;

  // Make matrix square if rectangular by padding with 0s
  const size = Math.max(n, m);
  const C = Array.from({ length: size + 1 }, () => new Float64Array(size + 1));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      C[i + 1][j + 1] = costMatrix[i][j];
    }
  }

  const u = new Float64Array(size + 1);
  const v = new Float64Array(size + 1);
  const p = new Int32Array(size + 1);
  const way = new Int32Array(size + 1);

  for (let i = 1; i <= size; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(size + 1).fill(Infinity);
    const used = new Uint8Array(size + 1).fill(0);

    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= size; j++) {
        if (!used[j]) {
          const cur = C[i0][j] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= size; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Int32Array(n);
  for (let j = 1; j <= size; j++) {
    if (p[j] <= n && p[j] > 0) {
      result[p[j] - 1] = j - 1;
    }
  }

  return Array.from(result);
}

/**
 * Assigns a pool of team IDs to regional destination slots using Hungarian Algorithm
 * 
 * @param {Array<string>} teamIds Array of unallocated team IDs
 * @param {Object} targetSlotsPerRegion Map of regionKey -> targetCount (e.g. { macro_0: 20, macro_1: 20, ... })
 * @param {Object} centroids Map of regionKey -> { lat, lon }
 * @param {Object} teamsDb Complete team database
 * @param {Function} haversineFn Distance function
 * @returns {Object} Map of regionKey -> Array of assigned team IDs
 */
export function assignTeamsHungarian(teamIds, targetSlotsPerRegion, centroids, teamsDb, haversineFn) {
  const result = {};
  const regionKeys = Object.keys(targetSlotsPerRegion);
  regionKeys.forEach(k => result[k] = []);

  if (!teamIds || teamIds.length === 0) return result;

  // Build target slots array where each entry has { regionKey, lat, lon }
  const slots = [];
  regionKeys.forEach(rKey => {
    const count = targetSlotsPerRegion[rKey] || 0;
    const c = centroids[rKey] || { lat: -14.235, lon: -51.925 };
    for (let i = 0; i < count; i++) {
      slots.push({ regionKey: rKey, lat: c.lat, lon: c.lon });
    }
  });

  // If number of teams doesn't match total slots, pad slots or teams
  const numTeams = teamIds.length;
  const numSlots = slots.length;
  const maxDim = Math.max(numTeams, numSlots);

  // Build Cost Matrix (Haversine Distance in km)
  const costMatrix = Array.from({ length: maxDim }, () => new Float64Array(maxDim));

  for (let i = 0; i < maxDim; i++) {
    const teamId = teamIds[i];
    const team = teamId ? teamsDb[teamId] : null;

    for (let j = 0; j < maxDim; j++) {
      const slot = slots[j];
      if (team && slot && typeof team.lat === 'number' && typeof team.lon === 'number') {
        costMatrix[i][j] = haversineFn(team.lat, team.lon, slot.lat, slot.lon);
      } else {
        costMatrix[i][j] = 0; // Dummy padding
      }
    }
  }

  // Run Hungarian Algorithm
  const assignment = solveHungarian(costMatrix);

  // Group teams into their assigned regions
  for (let i = 0; i < numTeams; i++) {
    const teamId = teamIds[i];
    const slotIdx = assignment[i];
    if (slotIdx < slots.length) {
      const assignedRegion = slots[slotIdx].regionKey;
      result[assignedRegion].push(teamId);
    } else {
      // Fallback if assigned to dummy slot
      result[regionKeys[0]].push(teamId);
    }
  }

  return result;
}
