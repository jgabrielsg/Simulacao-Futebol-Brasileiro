<script>
  import {
    currentSeasonNum,
    currentSeasonSummary,
    seasonsIndex,
    loadSeason,
    loadingSeason,
    unlockedSeasons,
    seasonStage,
    teamsDb
  } from '$lib/stores/gameStore.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    Calendar,
    Trophy,
    TrendingDown,
    DollarSign,
    Bus,
    Plane,
    Loader2,
    Activity,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Lock
  } from 'lucide-svelte';

  $: seasonsList = Array.from({ length: $seasonsIndex?.length || 5 }, (_, i) => i + 1);

  function selectSeason(s) {
    if (s !== $currentSeasonNum && !$loadingSeason && $unlockedSeasons.includes(s)) {
      loadSeason(s);
    }
  }

  function formatMoney(val) {
    if (!val && val !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
  
  <!-- Top Bar: Season Selector & Status -->
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800/80 pb-3.5 sm:pb-5">
    
    <div class="space-y-1">
      <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
        <Activity class="w-3.5 h-3.5 text-indigo-400" />
        Simulação Sequencial do Quinquênio (5 Anos)
      </div>
      <h2 class="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
        Temporada {$currentSeasonNum} de {$seasonsIndex?.length || 5}
        {#if $loadingSeason}
          <Loader2 class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 animate-spin" />
        {/if}
      </h2>
      <p class="text-xs text-slate-400 max-w-2xl leading-relaxed hidden sm:block">
        Os resultados de cada ano são desbloqueados conforme você conclui a temporada anterior. Inicie no Ano 1, avance as rodadas e acompanhe a logística e os acessos dos clubes!
      </p>
    </div>

    <!-- Season Pills Selector with Locks -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
      {#each seasonsList as s}
        {@const isUnlocked = $unlockedSeasons.includes(s)}
        <button
          on:click={() => selectSeason(s)}
          disabled={$loadingSeason || !isUnlocked}
          class={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 flex items-center gap-1.5 ${
            !isUnlocked
              ? 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-60'
              : $currentSeasonNum === s
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/80 ring-2 ring-indigo-400/40 cursor-pointer'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 cursor-pointer'
          }`}
          title={isUnlocked ? `Visualizar Temporada ${s}` : `Complete a Temporada ${s - 1} para desbloquear`}
        >
          {#if !isUnlocked}
            <Lock class="w-3 h-3 text-slate-600" />
          {/if}
          Ano {s}
        </button>
      {/each}
    </div>

  </div>

  <!-- Executive Financial & Champions Banner (2x2 on mobile, 4 columns on desktop) -->
  {#if $currentSeasonSummary}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      
      <!-- Card 1: Dimensão e Jogos da Temporada -->
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-1 min-w-0 overflow-hidden">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span class="flex items-center gap-1 text-indigo-300 font-bold truncate text-[11px] sm:text-xs">
            <Calendar class="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Total Jogos
          </span>
          <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono">T{$currentSeasonNum}</span>
        </div>
        <p class="text-sm sm:text-lg font-black text-white font-mono truncate">
          {((($currentSeasonSummary.financeiro?.total_jogos_c || 0) + ($currentSeasonSummary.financeiro?.total_jogos_d || 0))).toLocaleString('pt-BR')} <span class="text-[10px] sm:text-xs font-normal text-slate-400">partidas</span>
        </p>
        <div class="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 pt-0.5 truncate">
          <span class="font-bold text-slate-300">204 clubes</span>
          <span>C:60 • D:144</span>
        </div>
      </div>

      <!-- Card 2: Custo Total da Pirâmide -->
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-1 min-w-0 overflow-hidden">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span class="text-[11px] sm:text-xs font-bold truncate">Orçamento Pirâmide</span>
          <DollarSign class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        </div>
        <p class="text-sm sm:text-lg font-black text-emerald-300 font-mono truncate" title={formatMoney($currentSeasonSummary.financeiro?.custo_total_piramide_brl)}>
          {formatMoney($currentSeasonSummary.financeiro?.custo_total_piramide_brl)}
        </p>
        <div class="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 pt-0.5 truncate">
          <span>C: {formatMoney($currentSeasonSummary.financeiro?.custo_total_c_brl)}</span>
          <span class="hidden sm:inline">D: {formatMoney($currentSeasonSummary.financeiro?.custo_total_d_brl)}</span>
        </div>
      </div>

      <!-- Card 3: Economia Real gerada por Turnês TTP -->
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-1 min-w-0 overflow-hidden">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span class="text-[11px] sm:text-xs font-bold truncate">Economia Turnês</span>
          <TrendingDown class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        </div>
        <p class="text-sm sm:text-lg font-black text-indigo-300 font-mono truncate" title={formatMoney(($currentSeasonSummary.financeiro?.economia_turnes_c_brl || 0) + ($currentSeasonSummary.financeiro?.economia_turnes_d_brl || 0))}>
          {formatMoney(($currentSeasonSummary.financeiro?.economia_turnes_c_brl || 0) + ($currentSeasonSummary.financeiro?.economia_turnes_d_brl || 0))}
        </p>
        <span class="text-[9px] sm:text-[10px] text-slate-400 block pt-0.5 truncate">
          Economia direta turnês TTP
        </span>
      </div>

      <!-- Card 4: Matriz Modal de Transporte -->
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2 min-w-0 overflow-hidden">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span class="text-[11px] sm:text-xs font-bold truncate">Modais (Ônibus)</span>
          <Bus class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        </div>

        <div class="space-y-1 pt-0.5">
          <div class="flex justify-between text-[10px] sm:text-[11px] font-mono">
            <span class="text-slate-400">Série C:</span>
            <span class="text-cyan-300 font-bold">{$currentSeasonSummary.financeiro?.pct_rodoviario_c || 68.4}%</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-cyan-400 h-full rounded-full" style="width: {$currentSeasonSummary.financeiro?.pct_rodoviario_c || 68.4}%"></div>
          </div>

          <div class="flex justify-between text-[10px] sm:text-[11px] font-mono pt-0.5">
            <span class="text-slate-400">Série D:</span>
            <span class="text-emerald-400 font-bold">{$currentSeasonSummary.financeiro?.pct_rodoviario_d || 75.9}%</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-emerald-400 h-full rounded-full" style="width: {$currentSeasonSummary.financeiro?.pct_rodoviario_d || 75.9}%"></div>
          </div>
        </div>
      </div>

    </div>
  {/if}

</div>
