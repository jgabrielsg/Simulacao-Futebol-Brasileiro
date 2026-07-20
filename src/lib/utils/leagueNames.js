export const macroOrder = ["macro_1", "macro_3", "macro_0", "macro_2"];

export const macroNames = {
  "macro_1": "Liga Verde",
  "macro_3": "Liga Nordeste",
  "macro_0": "Liga Centro-Sudeste",
  "macro_2": "Liga Sul-Mato-Grosso"
};

export const microOrder = [
  "micro_4", // Liga Grão-Pará (AM, PA, RR, AP)
  "micro_3", // Liga Araguaia (TO, PA)
  "micro_5", // Liga Madeira-Mamoré (AC, RO, MT)
  "micro_9", // Liga Meio-Norte (CE, MA, PI)
  "micro_11", // Liga dos Guararapes (PB, PE, RN)
  "micro_10", // Liga São Francisco (BA, AL, SE)
  "micro_1", // Liga do Cerrado (GO, MG)
  "micro_0", // Liga Caminho do Ouro (RJ, ES, MG)
  "micro_2", // Liga Mantiqueira (SP, RJ, Sul MG)
  "micro_6", // Liga Paranapanema (MS, Sul GO, Norte PR, SP)
  "micro_8", // Liga Atlântica (SP, Norte SC)
  "micro_7"  // Liga Farroupilha (RS, SC)
];

export const microNames = {
  "micro_4": "Liga Grão-Pará",
  "micro_3": "Liga Araguaia",
  "micro_5": "Liga Madeira-Mamoré",
  "micro_9": "Liga Meio-Norte",
  "micro_11": "Liga dos Guararapes",
  "micro_10": "Liga São Francisco",
  "micro_1": "Liga do Cerrado",
  "micro_0": "Liga Caminho do Ouro",
  "micro_2": "Liga Mantiqueira",
  "micro_6": "Liga Paranapanema",
  "micro_8": "Liga Atlântica",
  "micro_7": "Liga Farroupilha"
};

export const microToMacroMap = {
  "micro_4": "macro_1",
  "micro_3": "macro_1",
  "micro_5": "macro_1",
  "micro_9": "macro_3",
  "micro_11": "macro_3",
  "micro_10": "macro_3",
  "micro_1": "macro_0",
  "micro_0": "macro_0",
  "micro_2": "macro_0",
  "micro_6": "macro_2",
  "micro_8": "macro_2",
  "micro_7": "macro_2"
};

export function getMacroName(key) {
  if (macroNames[key]) return macroNames[key];
  return fallbackFormat(key);
}

export function getMicroName(key) {
  if (microNames[key]) {
    const parentMacroKey = microToMacroMap[key];
    const parentName = parentMacroKey ? (macroNames[parentMacroKey] || '').replace('Liga ', '') : '';
    return parentName ? `${parentName} - ${microNames[key]}` : microNames[key];
  }
  return fallbackFormat(key);
}

export function getLeagueDisplayName(key) {
  if (!key) return '';
  if (key.startsWith('serie_C.')) {
    return getMacroName(key.replace('serie_C.', ''));
  }
  if (key.startsWith('serie_D.')) {
    return getMicroName(key.replace('serie_D.', ''));
  }
  if (key === 'serie_A') return 'Série A';
  if (key === 'serie_B') return 'Série B';
  return fallbackFormat(key);
}

function fallbackFormat(str) {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
