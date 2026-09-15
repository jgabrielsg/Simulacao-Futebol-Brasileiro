<script>
  import {
    showStageExplainerModal,
    stageExplainerData,
    activeDashboardTab
  } from '$lib/stores/gameStore.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    Trophy,
    Layers,
    X,
    ArrowRight,
    CheckCircle2
  } from 'lucide-svelte';

  function closeModal() {
    showStageExplainerModal.set(false);
    activeDashboardTab.set('playoffs');
  }
</script>

{#if $showStageExplainerModal && $stageExplainerData}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
    
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-150 my-auto">
      
      <!-- Close Button -->
      <button
        on:click={closeModal}
        class="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        title="Fechar"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Header Icon & Title -->
      <div class="flex items-center gap-3 pr-6">
        <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
          {#if $stageExplainerData.stage === 1}
            <Layers class="w-4 h-4 text-indigo-400" />
          {:else}
            <Trophy class="w-4 h-4 text-amber-400" />
          {/if}
        </div>

        <div>
          <span class="text-[9px] font-black uppercase tracking-wider text-indigo-400 block">
            Regulamento • Transição de Fase
          </span>
          <h3 class="text-base font-black text-white tracking-tight leading-snug">
            {$stageExplainerData.title}
          </h3>
          <p class="text-[11px] text-slate-400 font-medium">
            {$stageExplainerData.subtitle}
          </p>
        </div>
      </div>

      <!-- Description Body (Academic & Concise) -->
      <p class="text-xs text-slate-300 leading-relaxed text-justify">
        {$stageExplainerData.description}
      </p>

      <!-- Summary Badges (Compact) -->
      {#if $stageExplainerData.stage === 1}
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-amber-300 block uppercase">Série C</span>
            <p class="text-[11px] text-slate-300">
              4 líderes diretos com BYE nas quartas e 16 clubes nos play-ins locais.
            </p>
          </div>
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-indigo-300 block uppercase">Série D</span>
            <p class="text-[11px] text-slate-300">
              64 clubes disputando mata-matas regionais por transporte rodoviário.
            </p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-emerald-300 block uppercase">Série C (Nacional dos 8)</span>
            <p class="text-[11px] text-slate-300">
              4 jogos de quartas de final: vencedores sobem para a Série B.
            </p>
          </div>
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-cyan-300 block uppercase">Série D (Semifinais)</span>
            <p class="text-[11px] text-slate-300">
              8 semifinais regionais: 2 acessos por macrorregião à Série C.
            </p>
          </div>
        </div>
      {/if}

      <!-- Highlight Banner -->
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{$stageExplainerData.highlight}</span>
      </div>

      <!-- Action Button -->
      <div class="pt-1 flex justify-end">
        <button
          on:click={closeModal}
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Acessar Chaveamento</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

    </div>

  </div>
{/if}
