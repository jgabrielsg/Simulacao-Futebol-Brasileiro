<script>
  import {
    activeDivision,
    activeGroup,
    currentGroupTeams,
    currentRoundsList,
    simulatedRoundsCount,
    totalRounds,
    seasonStage
  } from '$lib/stores/gameStore.js';
  import {
    getFriendlyGroupName,
    getLeagueTTP,
    isLeague100Road
  } from '$lib/utils/leagueNames.js';
  import {
    BarChart3,
    DollarSign,
    Milestone,
    Navigation,
    Bus,
    Plane,
    TrendingDown,
    Activity,
    Shield,
    CheckCircle2
  } from 'lucide-svelte';

  function formatMoney(val) {
    if (!val && val !== 0) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }

  function formatKm(km) {
    if (!km && km !== 0) return '0 km';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(km) + ' km';
  }

  // Reactive calculations for the active group
  $: stats = (() => {
    const rounds = $currentRoundsList || [];
    let totalKm = 0;
    let totalCost = 0;
    let matchCount = 0;
    let airCount = 0;
    let roadCount = 0;

    for (const r of rounds) {
      for (const j of (r.jogos || [])) {
        matchCount++;
        if (j.deslocamento) {
          totalKm += (j.deslocamento.distancia_km || 0);
          totalCost += (j.deslocamento.custo_brl || 0);
          if (j.deslocamento.modal === 'AIR') {
            airCount++;
          } else {
            roadCount++;
          }
          if (j.deslocamento.retorno_sede) {
            totalKm += (j.deslocamento.retorno_sede.distancia_km || 0);
            totalCost += (j.deslocamento.retorno_sede.custo_brl || 0);
          }
        }
      }
    }

    const avgKm = matchCount > 0 ? Math.round(totalKm / matchCount) : 0;
    const avgCost = matchCount > 0 ? Math.round(totalCost / matchCount) : 0;
    const roadPct = matchCount > 0 ? Math.round((roadCount / matchCount) * 100) : 100;
    const airPct = matchCount > 0 ? 100 - roadPct : 0;

    return {
      matchCount,
      totalKm: Math.round(totalKm),
      totalCost: Math.round(totalCost),
      avgKm,
      avgCost,
      airCount,
      roadCount,
      roadPct,
      airPct
    };
  })();

  $: leagueTTP = getLeagueTTP($activeDivision, $activeGroup, $currentGroupTeams.length);
  $: is100Road = isLeague100Road($currentRoundsList);
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
  
  <!-- Header: League Identity & TTP Badge -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
        <BarChart3 class="w-5 h-5" />
      </div>
      <div>
        <h3 class="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
          Métricas da Liga: {getFriendlyGroupName($activeGroup)}
        </h3>
        <p class="text-[11px] text-slate-400 font-medium">
          Parâmetros operacionais e limites fisiológicos da Pesquisa Operacional (CP-SAT)
        </p>
      </div>
    </div>

    <!-- TTP Badge -->
    <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
      <div class="px-3.5 py-1.5 rounded-xl bg-purple-950/90 border border-purple-700/70 shadow-inner flex items-center gap-2.5 whitespace-nowrap">
        <Activity class="w-4 h-4 text-purple-400 shrink-0" />
        <div class="text-left">
          <span class="text-[9px] font-bold uppercase tracking-wider text-purple-300 block leading-tight">Parâmetro TTP</span>
          <span class="text-xs font-black text-white font-mono leading-tight">TTP-{leagueTTP}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 4 Main KPI Cards Grid -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    
    <!-- 1. Custo Total -->
    <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 min-w-0 overflow-hidden space-y-1">
      <div class="flex items-center justify-between text-slate-400">
        <span class="text-[10px] font-bold uppercase tracking-wider truncate">Custo Total</span>
        <DollarSign class="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
      </div>
      <div class="text-sm sm:text-base xl:text-lg font-black text-emerald-400 font-mono tracking-tight truncate" title={formatMoney(stats.totalCost)}>
        {formatMoney(stats.totalCost)}
      </div>
      <p class="text-[9px] text-slate-500 font-medium truncate">Deslocamentos da fase regular</p>
    </div>

    <!-- 2. Custo Médio por Partida -->
    <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 min-w-0 overflow-hidden space-y-1">
      <div class="flex items-center justify-between text-slate-400">
        <span class="text-[10px] font-bold uppercase tracking-wider truncate">Custo Médio</span>
        <TrendingDown class="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
      </div>
      <div class="text-sm sm:text-base xl:text-lg font-black text-indigo-300 font-mono tracking-tight truncate" title={formatMoney(stats.avgCost)}>
        {formatMoney(stats.avgCost)}
      </div>
      <p class="text-[9px] text-slate-500 font-medium truncate">Por partida realizada</p>
    </div>

    <!-- 3. Km Total -->
    <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 min-w-0 overflow-hidden space-y-1">
      <div class="flex items-center justify-between text-slate-400">
        <span class="text-[10px] font-bold uppercase tracking-wider truncate">Km Total</span>
        <Milestone class="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
      </div>
      <div class="text-sm sm:text-base xl:text-lg font-black text-cyan-300 font-mono tracking-tight truncate" title={formatKm(stats.totalKm)}>
        {formatKm(stats.totalKm)}
      </div>
      <p class="text-[9px] text-slate-500 font-medium truncate">{stats.matchCount} jogos no total</p>
    </div>

    <!-- 4. Km Médio por Partida -->
    <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 min-w-0 overflow-hidden space-y-1">
      <div class="flex items-center justify-between text-slate-400">
        <span class="text-[10px] font-bold uppercase tracking-wider truncate">Km Médio</span>
        <Navigation class="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
      </div>
      <div class="text-sm sm:text-base xl:text-lg font-black text-amber-300 font-mono tracking-tight truncate" title={formatKm(stats.avgKm)}>
        {formatKm(stats.avgKm)}
      </div>
      <p class="text-[9px] text-slate-500 font-medium truncate">Raio médio por jogo</p>
    </div>

  </div>

  <!-- Modal Distribution & Academic Note -->
  <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
    
    <div class="space-y-1.5 flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        {#if is100Road}
          <span class="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
            <Bus class="w-3 h-3" /> 100% Malha Rodoviária Regional
          </span>
        {:else}
          <span class="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
            <Plane class="w-3 h-3" /> Logística Bimodal Otimizada
          </span>
        {/if}
        <span class="text-[11px] text-slate-400 font-medium">
          {stats.roadCount} jogos por ônibus ({stats.roadPct}%) • {stats.airCount} jogos por voo ({stats.airPct}%)
        </span>
      </div>
      <p class="text-[11px] text-slate-400 leading-relaxed">
        <strong class="text-slate-300">TTP-{leagueTTP} (Traveling Tournament Problem):</strong> Limite fisiológico da CBF de no máximo {leagueTTP} partidas consecutivas como visitante em turnê TTP antes de retornar obrigatoriamente à sede.
      </p>
    </div>

    <div class="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
      <span class="text-[10px] text-slate-500 font-mono block">Dimensão da Liga</span>
      <span class="text-xs font-bold text-white whitespace-nowrap">{$currentGroupTeams.length} clubes • {$totalRounds} rodadas</span>
    </div>

  </div>

</div>
