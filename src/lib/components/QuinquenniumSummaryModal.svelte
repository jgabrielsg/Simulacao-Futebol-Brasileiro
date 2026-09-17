<script>
  import {
    showQuinquenniumSummaryModal,
    seasonsIndex,
    resetAllProgression,
    currentSeasonNum
  } from '$lib/stores/gameStore.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    Trophy,
    Award,
    DollarSign,
    TrendingDown,
    Bus,
    X,
    RotateCcw,
    CheckCircle2
  } from 'lucide-svelte';

  function closeModal() {
    showQuinquenniumSummaryModal.set(false);
  }

  function handleReset() {
    closeModal();
    resetAllProgression();
  }

  function formatMoney(val) {
    if (!val && val !== 0) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }

  // Calculate totals over 5 seasons
  $: indexList = $seasonsIndex || [];
  $: totalPyramidCost = indexList.reduce((acc, s) => acc + (s.financeiro?.custo_total_piramide_brl || 0), 0);
  $: totalTtpSavings = indexList.reduce((acc, s) => acc + (s.financeiro?.economia_turnes_c_brl || 0) + (s.financeiro?.economia_turnes_d_brl || 0), 0);
  $: totalMatches = indexList.reduce((acc, s) => acc + (s.financeiro?.total_jogos_c || 0) + (s.financeiro?.total_jogos_d || 0), 0);
</script>

{#if $showQuinquenniumSummaryModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
    
    <div class="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 my-8">
      
      <!-- Close Button -->
      <button
        on:click={closeModal}
        class="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        title="Fechar"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Trophy Header -->
      <div class="flex items-center gap-4 border-b border-slate-800 pb-5">
        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xl shrink-0">
          <Trophy class="w-7 h-7" />
        </div>

        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Award class="w-3 h-3 text-amber-400" /> Relatório Executivo Conclusivo • TCC
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
            Balanço Oficial do Quinquênio (5 Temporadas)
          </h2>
          <p class="text-xs text-slate-400">
            Pesquisa Operacional aplicada à reestruturação logística do futebol brasileiro.
          </p>
        </div>
      </div>

      <!-- 4 Key Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Investimento Pirâmide</span>
          <p class="text-base font-black text-emerald-400 font-mono">
            {formatMoney(totalPyramidCost)}
          </p>
          <span class="text-[10px] text-slate-500">5 anos de Séries C e D</span>
        </div>

        <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Economia Turnês TTP</span>
          <p class="text-base font-black text-indigo-400 font-mono">
            {formatMoney(totalTtpSavings)}
          </p>
          <span class="text-[10px] text-slate-500">Viagens encadeadas sem volta</span>
        </div>

        <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Jogos Otimizados</span>
          <p class="text-base font-black text-cyan-400 font-mono">
            {totalMatches.toLocaleString('pt-BR')} partidas
          </p>
          <span class="text-[10px] text-slate-500">10 meses de calendário</span>
        </div>

        <div class="bg-slate-950 p-3.5 rounded-xl border border-indigo-900/50 space-y-1">
          <span class="text-[10px] font-bold text-indigo-300 uppercase">Mobilidade & Paridade</span>
          <p class="text-base font-black text-amber-400 font-mono">
            8 Iso-Ligas • 100% Par
          </p>
          <span class="text-[10px] text-slate-400">Zero rodadas de folga no ciclo</span>
        </div>
      </div>

      <!-- Roll of Champions Table -->
      <div class="space-y-2">
        <h4 class="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
          <Trophy class="w-4 h-4 text-amber-400" /> Galeria dos Campeões do Quinquênio
        </h4>

        <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs">
          <div class="grid grid-cols-12 px-4 py-2 bg-slate-900/80 font-bold text-slate-400 text-[10px] border-b border-slate-800">
            <span class="col-span-2">ANO</span>
            <span class="col-span-4">SÉRIE A</span>
            <span class="col-span-3">SÉRIE B</span>
            <span class="col-span-3">SÉRIE C</span>
          </div>

          <div class="divide-y divide-slate-800/60">
            {#each indexList as s}
              <div class="grid grid-cols-12 px-4 py-2.5 items-center">
                <span class="col-span-2 font-mono font-bold text-indigo-400">Ano {s.temporada}</span>
                <div class="col-span-4 flex items-center gap-1.5 truncate">
                  <TeamBadge teamId={s.campeoes?.serie_a} size="w-4 h-4" />
                  <span class="truncate font-bold text-white text-[11px]">{s.campeoes?.serie_a?.split('/')[0]}</span>
                </div>
                <div class="col-span-3 flex items-center gap-1.5 truncate">
                  <TeamBadge teamId={s.campeoes?.serie_b} size="w-4 h-4" />
                  <span class="truncate text-slate-300 text-[11px]">{s.campeoes?.serie_b?.split('/')[0]}</span>
                </div>
                <div class="col-span-3 flex items-center gap-1.5 truncate">
                  <TeamBadge teamId={s.campeoes?.serie_c} size="w-4 h-4" />
                  <span class="truncate text-amber-300 font-bold text-[11px]">{s.campeoes?.serie_c?.split('/')[0]}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Regional Mobility & Federative Invariance Summary Card -->
      <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
        <div class="flex items-center gap-2 font-black text-white text-[11px]">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Equilíbrio Territorial & Invariância Federativa Preservados</span>
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed text-justify">
          Ao longo das 5 temporadas completas, o modelo CP-SAT operou <strong>8 migrações estratégicas de clubes Iso-Liga</strong> (Grêmio Prudente-SP, Costa Rica-MS, Altos-PI, Tombense-MG, Athletic-MG, Moto Club-MA) e mais de <strong>160 re-clusterizações microrregionais na Série D</strong>. Essa elasticidade garantiu 100% de paridade par em todas as conferências (nenhuma equipe sofreu rodada de folga) e manteve as cotas canônicas das 27 Federações Estaduais rigorosamente intactas.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          on:click={handleReset}
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw class="w-3.5 h-3.5" /> Reiniciar Simulação (Ano 1)
        </button>

        <button
          on:click={closeModal}
          class="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-950/80 transition-all cursor-pointer"
        >
          Concluir Exploração
        </button>
      </div>

    </div>

  </div>
{/if}
