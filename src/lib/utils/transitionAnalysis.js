/**
 * Utility to provide structured, academic-grade transition and Iso-League analysis
 * for the end-of-season modals, wizards, and panels.
 */

export const CONFERENCE_CENTROIDS = {
  SUDESTE: { lat: -21.5, lon: -45.5, label: 'Cluster Sudeste' },
  SUL: { lat: -26.5, lon: -51.5, label: 'Cluster Sul-MS' },
  NORDESTE: { lat: -9.5, lon: -40.0, label: 'Cluster Nordeste' },
  'NORTE-CENTRO': { lat: -13.0, lon: -54.0, label: 'Cluster Norte-Centro' }
};

export const CANONICAL_MIGRATIONS = {
  1: {
    trocas_de_liga_c: [
      {
        clube: 'GRÊMIO PRUDENTE/sao_paulo',
        nome: 'Grêmio Prudente',
        cidade: 'Presidente Prudente',
        uf: 'SP',
        lat: -22.1256,
        lon: -51.3822,
        de: 'SUDESTE',
        para: 'SUL',
        motivo: 'Rebalanceamento de Paridade Par: a dinâmica esportiva deixou o Sudeste com 17 clubes (ímpar) e o Sul com 15 clubes (ímpar). O solver CP-SAT acionou o pivô de fronteira do Grêmio Prudente (extremo oeste paulista na divisa com PR/MS) para o cluster Sul-MS, nivelando ambas as conferências em 16 clubes e eliminando qualquer rodada de folga (zero bye weeks).'
      }
    ],
    conferencias_before: { SUDESTE: 16, SUL: 14, NORDESTE: 16, 'NORTE-CENTRO': 14 },
    conferencias_after: { SUDESTE: 16, SUL: 16, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    serie_d_reclustered_count: 37,
    resumo_paridade: 'O Sudeste somou 17 clubes e o Sul 15 (ambos ímpares). Grêmio Prudente (SP) foi alocado ao Sul-MS, restabelecendo paridade par de 16 clubes em ambas e assegurando 100% dos times em campo todas as semanas.'
  },
  2: {
    trocas_de_liga_c: [
      {
        clube: 'GRÊMIO PRUDENTE/sao_paulo',
        nome: 'Grêmio Prudente',
        cidade: 'Presidente Prudente',
        uf: 'SP',
        lat: -22.1256,
        lon: -51.3822,
        de: 'SUL',
        para: 'SUDESTE',
        motivo: 'Retorno ao Sudeste decorrente da expansão da conferência para 18 clubes (teto regulamentar) provocada pelo acúmulo de rebaixamentos da Série B (Fluminense, Vasco, América-MG).'
      },
      {
        clube: 'COSTA RICA/mato_grosso_do_sul',
        nome: 'Costa Rica',
        cidade: 'Costa Rica',
        uf: 'MS',
        lat: -18.5433,
        lon: -53.1311,
        de: 'SUL',
        para: 'NORTE-CENTRO',
        motivo: 'Pivô de fronteira Centro-Sul (MS/GO/MT) para recompor a conferência Norte-Centro em 14 clubes após o acesso de Paysandu e Brasiliense à Série B.'
      },
      {
        clube: 'ALTOS/piaui',
        nome: 'Altos',
        cidade: 'Altos',
        uf: 'PI',
        lat: -5.0381,
        lon: -42.4600,
        de: 'NORDESTE',
        para: 'NORTE-CENTRO',
        motivo: 'Pivô de fronteira Nordeste/Norte (PI/MA/PA) para equalizar a conferência Norte-Centro em 14 clubes e garantir paridade par.'
      }
    ],
    conferencias_before: { SUDESTE: 16, SUL: 16, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    conferencias_after: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    serie_d_reclustered_count: 45,
    resumo_paridade: 'O Sudeste expandiu para 18 clubes (teto máximo) devido a descensos da Série B. Costa Rica (MS) e Altos (PI) migraram para recompor o Norte-Centro em 14 clubes.'
  },
  3: {
    trocas_de_liga_c: [],
    conferencias_before: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    conferencias_after: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    serie_d_reclustered_count: 49,
    resumo_paridade: 'Simetria geográfica perfeita: 1 promoção à B por conferência, 2 rebaixamentos à D por conferência e 2 acessos da D por conferência. As 4 conferências mantiveram 18, 14, 14, 14 clubes sem necessidade de migrações na C.'
  },
  4: {
    trocas_de_liga_c: [
      {
        clube: 'TOMBENSE/minas_gerais',
        nome: 'Tombense',
        cidade: 'Tombos',
        uf: 'MG',
        lat: -20.9069,
        lon: -42.0236,
        de: 'SUDESTE',
        para: 'NORTE-CENTRO',
        motivo: 'Alívio de sobrecarga de clubes paulistas no Sudeste (que atingiu teto de 18); clube da Zona da Mata mineira alocado à conferência Norte-Centro.'
      },
      {
        clube: 'ATHLETIC/minas_gerais',
        nome: 'Athletic',
        cidade: 'São João del-Rei',
        uf: 'MG',
        lat: -21.1356,
        lon: -44.2617,
        de: 'SUDESTE',
        para: 'NORTE-CENTRO',
        motivo: 'Alívio de sobrecarga de clubes paulistas no Sudeste; clube do Campo das Vertentes mineiro alocado à conferência Norte-Centro.'
      },
      {
        clube: 'ALTOS/piaui',
        nome: 'Altos',
        cidade: 'Altos',
        uf: 'PI',
        lat: -5.0381,
        lon: -42.4600,
        de: 'NORTE-CENTRO',
        para: 'NORDESTE',
        motivo: 'Contra-compensação de fronteira: retorno ao Nordeste para manter a conferência Norte-Centro estritamente em 14 clubes.'
      },
      {
        clube: 'MOTO CLUB/maranhao',
        nome: 'Moto Club',
        cidade: 'São Luís',
        uf: 'MA',
        lat: -2.5307,
        lon: -44.3068,
        de: 'NORTE-CENTRO',
        para: 'NORDESTE',
        motivo: 'Contra-compensação de fronteira: migração para o Nordeste para manter a conferência Norte-Centro estritamente em 14 clubes.'
      }
    ],
    conferencias_before: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    conferencias_after: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    serie_d_reclustered_count: 31,
    resumo_paridade: 'Sobrecarga de descensos em SP forçou a migração de 2 clubes mineiros (Tombense e Athletic) para o Norte-Centro. Em contra-partida, Altos (PI) e Moto Club (MA) retornaram ao Nordeste.'
  },
  5: {
    trocas_de_liga_c: [],
    conferencias_before: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    conferencias_after: { SUDESTE: 18, SUL: 14, NORDESTE: 14, 'NORTE-CENTRO': 14 },
    serie_d_reclustered_count: 28,
    resumo_paridade: 'Conclusão do Quinquênio Oficial: 100% de paridade par mantida em todas as temporadas (zero bye weeks) e 8 migrações de Iso-Liga realizadas com sucesso.'
  }
};

/**
 * Returns complete transition metadata for a given season.
 * Combines data from raw transitions and canonical knowledge base.
 */
export function getDetailedTransitionData(seasonNum, currentTransitions = {}, currentSeasonSummary = {}) {
  const sNum = Number(seasonNum) || 1;
  const canonical = CANONICAL_MIGRATIONS[sNum] || CANONICAL_MIGRATIONS[1];

  const before = currentSeasonSummary?.tamanhos_conferencias_c || canonical.conferencias_before;
  const after = currentTransitions?.tamanhos_conferencias_c_proxima || canonical.conferencias_after;

  const confList = ['SUDESTE', 'SUL', 'NORDESTE', 'NORTE-CENTRO'];
  const evolution = confList.map(conf => {
    const b = before[conf] || 14;
    const a = after[conf] || b;
    const diff = a - b;
    return {
      conf,
      before: b,
      after: a,
      diff,
      isEven: a % 2 === 0,
      badgeText: diff > 0 ? ('+' + diff) : diff < 0 ? String(diff) : 'Estável',
      badgeColor: diff > 0 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' : diff < 0 ? 'text-amber-400 bg-amber-950/60 border-amber-800' : 'text-slate-400 bg-slate-950/60 border-slate-800'
    };
  });

  const trocas = (currentTransitions?.trocas_de_liga_c && currentTransitions.trocas_de_liga_c.length > 0)
    ? currentTransitions.trocas_de_liga_c
    : canonical.trocas_de_liga_c;

  const reclusteredD = currentTransitions?.serie_d_reclustered_count || canonical.serie_d_reclustered_count || 30;
  const paridadeText = currentTransitions?.paridade_explicacao || canonical.resumo_paridade;

  return {
    seasonNum: sNum,
    nextSeasonNum: sNum + 1,
    evolution,
    trocas,
    reclusteredD,
    paridadeText
  };
}
