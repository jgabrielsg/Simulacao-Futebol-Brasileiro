/**
 * Constants and helpers for Conferences (Serie C) and Regional Leagues (Serie D)
 */

export const CONFERENCES_C = ['SUDESTE', 'SUL', 'NORDESTE', 'NORTE-CENTRO'];

export const MACRO_REGIONS_D = ['SUDESTE', 'SUL-MS', 'NORDESTE', 'NORTE-CENTRO'];

export const LEAGUES_BY_MACRO_D = {
  'SUDESTE': [
    'SUDESTE_LIGA_1',
    'SUDESTE_LIGA_2',
    'SUDESTE_LIGA_3',
    'SUDESTE_LIGA_4'
  ],
  'SUL-MS': [
    'SUL-MS_LIGA_1',
    'SUL-MS_LIGA_2',
    'SUL-MS_LIGA_3',
    'SUL-MS_LIGA_4'
  ],
  'NORDESTE': [
    'NORDESTE_LIGA_1',
    'NORDESTE_LIGA_2',
    'NORDESTE_LIGA_3',
    'NORDESTE_LIGA_4'
  ],
  'NORTE-CENTRO': [
    'NORTE-CENTRO_LIGA_1',
    'NORTE-CENTRO_LIGA_2',
    'NORTE-CENTRO_LIGA_3',
    'NORTE-CENTRO_LIGA_4',
    'NORTE-CENTRO_LIGA_5',
    'NORTE-CENTRO_LIGA_6'
  ]
};

export const CONFERENCE_COLORS = {
  'SUDESTE': {
    name: 'Sudeste',
    primary: '#3b82f6', // blue-500
    border: '#1d4ed8',  // blue-700
    bg: 'rgba(59, 130, 246, 0.15)',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-700/50'
  },
  'SUL': {
    name: 'Sul',
    primary: '#10b981', // emerald-500
    border: '#047857',  // emerald-700
    bg: 'rgba(16, 185, 129, 0.15)',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700/50'
  },
  'SUL-MS': {
    name: 'Sul & MS',
    primary: '#10b981',
    border: '#047857',
    bg: 'rgba(16, 185, 129, 0.15)',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700/50'
  },
  'NORDESTE': {
    name: 'Nordeste',
    primary: '#f59e0b', // amber-500
    border: '#b45309',  // amber-700
    bg: 'rgba(245, 158, 11, 0.15)',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700/50'
  },
  'NORTE-CENTRO': {
    name: 'Liga Verde',
    primary: '#a855f7', // purple-500
    border: '#6d28d9',  // purple-700
    bg: 'rgba(168, 85, 247, 0.15)',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-700/50'
  }
};

/**
 * Returns user-friendly name for any league/conference key
 */
export function getFriendlyGroupName(key) {
  if (!key) return '';
  if (key === 'NORTE-CENTRO') {
    return 'Liga Verde';
  }
  if (CONFERENCE_COLORS[key]) {
    return `Conferência ${CONFERENCE_COLORS[key].name}`;
  }

  // Serie D leagues: e.g. "SUDESTE_LIGA_1" -> "Sudeste — Liga 1", "NORTE-CENTRO_LIGA_1" -> "Liga Verde — Liga 1"
  const parts = key.split('_');
  if (parts.length >= 3) {
    const macro = parts[0] + (parts[1] === 'MS' ? '-MS' : '');
    const num = parts[parts.length - 1];
    const confObj = CONFERENCE_COLORS[macro] || { name: macro };
    return `${confObj.name} — Liga ${num}`;
  }

  return key.replace(/_/g, ' ');
}

/**
 * Returns conference/macro key for any league key
 */
export function getConferenceFromLeague(leagueKey) {
  if (!leagueKey) return 'SUDESTE';
  if (leagueKey.startsWith('SUDESTE')) return 'SUDESTE';
  if (leagueKey.startsWith('SUL')) return 'SUL-MS';
  if (leagueKey.startsWith('NORDESTE')) return 'NORDESTE';
  if (leagueKey.startsWith('NORTE-CENTRO')) return 'NORTE-CENTRO';
  return 'SUDESTE';
}

/**
 * Returns how many teams qualify for playoffs in a given league/conference
 */
export function getQualificationCutoff(division, groupKey) {
  if (division === 'serie_c') return 5; // 1st BYE + 4 in play-ins
  // Serie D Norte-Centro: Liga 3 (AM/RR) and Liga 4 (DF/GO) have 8 clubs -> G-4
  if (groupKey === 'NORTE-CENTRO_LIGA_3' || groupKey === 'NORTE-CENTRO_LIGA_4') {
    return 4;
  }
  // Serie D Norte-Centro: Ligas 1, 2, 5, 6 have 6 clubs -> G-2
  if (groupKey && groupKey.startsWith('NORTE-CENTRO_')) {
    return 2;
  }
  // All other Serie D leagues (Sudeste, Sul-MS, Nordeste) -> G-4
  return 4;
}

/**
 * Checks if all matches in a league's rounds use road transport (zero flights)
 */
export function isLeague100Road(rounds) {
  if (!rounds || !Array.isArray(rounds) || rounds.length === 0) return true;
  for (const r of rounds) {
    for (const j of (r.jogos || [])) {
      if (j.deslocamento && j.deslocamento.modal === 'AIR') {
        return false;
      }
    }
  }
  return true;
}

/**
 * Returns the TTP (Traveling Tournament Problem) k-limit for a league/conference
 * - TTP-6: Norte-Centro (Serie C)
 * - TTP-5: Nordeste and Sul (Serie C)
 * - TTP-4: Sudeste (Serie C) and Serie D leagues with > 7 clubs (8 or 10 clubs)
 * - TTP-3: Serie D leagues with 6 or 7 clubs (e.g. Norte-Centro Ligas 1, 2, 5, 6)
 */
export function getLeagueTTP(division, groupKey, teamCount = 0) {
  if (division === 'serie_c') {
    if (groupKey === 'NORTE-CENTRO') return 6;
    if (groupKey === 'NORDESTE' || groupKey === 'SUL') return 5;
    if (groupKey === 'SUDESTE') return 4;
    return 5;
  } else {
    // Serie D
    if (teamCount > 7) return 4;
    // Norte-Centro Liga 3 and 4 have 8 clubs
    if (groupKey === 'NORTE-CENTRO_LIGA_3' || groupKey === 'NORTE-CENTRO_LIGA_4') return 4;
    // Leagues with 6 or 7 clubs
    if (groupKey && groupKey.startsWith('NORTE-CENTRO_')) return 3;
    if (teamCount > 0 && teamCount <= 7) return 3;
    return 4;
  }
}


