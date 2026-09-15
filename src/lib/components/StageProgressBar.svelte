<script>
  import {
    seasonStage,
    simulatedRoundsCount,
    totalRounds,
    maxSeasonRounds,
    simulateOneRound,
    simulateCurrentStage,
    simulateNextKnockout,
    advanceToNextStage,
    playinsStep,
    playoffsStep,
    showWizardModal,
    activeDashboardTab,
    currentSeasonNum
  } from '$lib/stores/gameStore.js';
  import {
    Layers,
    Play,
    FastForward,
    Trophy,
    CheckCircle2,
    Shield,
    Shuffle,
    ArrowRight,
    Lock
  } from 'lucide-svelte';

  const stages = [
    { id: 'grupos', name: '1. Grupos Regionais', shortName: 'Grupos' },
    { id: 'playins', name: '2. Play-ins Locais', shortName: 'Play-ins' },
    { id: 'playoffs_finais', name: '3. Playoffs Finais', shortName: 'Playoffs' }
  ];

  function getStageIndex(id) {
    if (id === 'grupos') return 0;
    if (id === 'playins') return 1;
    if (id === 'playoffs_finais') return 2;
    if (id === 'concluida') return 3;
    return 0;
  }

  $: currentStageIdx = getStageIndex($seasonStage);
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
  
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
    
    <!-- Stages Stepper -->
    <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
      {#each stages as st, idx}
        {@const isPast = currentStageIdx > idx}
        {@const isCurrent = currentStageIdx === idx}
        
        <div class="flex items-center gap-2 sm:gap-3">
          <div
            class={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
              isCurrent
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/80 ring-2 ring-indigo-400/40'
                : isPast
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
            }`}
          >
            {#if isPast}
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {:else if isCurrent}
              <span class="w-2 h-2 rounded-full bg-white animate-pulse shrink-0"></span>
            {:else}
              <span class="w-2 h-2 rounded-full bg-slate-700 shrink-0"></span>
            {/if}
            <span class="whitespace-nowrap">{st.name}</span>
          </div>

          {#if idx < stages.length - 1}
            <span class="text-slate-600 font-bold hidden sm:inline">➔</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Action Buttons for Current Stage -->
    <div class="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
      {#if $seasonStage === 'grupos'}
        <span class="text-xs font-mono font-bold text-slate-400 mr-2">
          Rodada <strong class="text-white">{$simulatedRoundsCount}</strong> de {$maxSeasonRounds}
        </span>

        <!-- Step 1 Round -->
        <button
          on:click={simulateOneRound}
          disabled={$simulatedRoundsCount >= $maxSeasonRounds}
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Avançar exatamente 1 rodada"
        >
          <Play class="w-3.5 h-3.5 fill-current text-indigo-400" />
          Avançar 1 Rodada
        </button>

        <!-- Fast Forward Group Stage -->
        {#if $simulatedRoundsCount < $maxSeasonRounds}
          <button
            on:click={simulateCurrentStage}
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-950/80"
            title="Simular todas as rodadas restantes dos grupos"
          >
            <FastForward class="w-4 h-4 fill-current" />
            Simular Fase de Grupos
          </button>
        {/if}

        <!-- Advance to Next Stage Button (Only when all rounds are completed!) -->
        {#if $simulatedRoundsCount >= $maxSeasonRounds}
          <button
            on:click={advanceToNextStage}
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-400/40 animate-pulse"
            title="Avançar para os Play-ins Regionais"
          >
            <span>Passar para Play-ins</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        {/if}

      {:else if $seasonStage === 'playins'}
        <span class="text-xs font-mono font-bold text-slate-400 mr-2">
          Mata-mata <strong class="text-white">{$playinsStep}</strong> de 2
        </span>

        <!-- Step Knockout in Play-ins -->
        <button
          on:click={simulateNextKnockout}
          disabled={$playinsStep >= 2}
          class={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
            $playinsStep >= 2
              ? 'bg-slate-800/60 border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-purple-700 hover:bg-purple-600 border-purple-500 text-white cursor-pointer shadow-purple-950/60'
          }`}
          title={$playinsStep === 0 ? 'Simular Semifinais dos Play-ins' : $playinsStep === 1 ? 'Simular Finais dos Play-ins' : 'Mata-matas de play-ins concluídos'}
        >
          {#if $playinsStep >= 2}
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>Mata-matas Concluídos</span>
          {:else if $playinsStep === 0}
            <Play class="w-3.5 h-3.5 fill-current text-purple-200" />
            <span>Simular Mata-Mata (Semifinais)</span>
          {:else}
            <Play class="w-3.5 h-3.5 fill-current text-purple-200" />
            <span>Simular Mata-Mata (Finais)</span>
          {/if}
        </button>

        <!-- Fast Forward Play-ins if not completed -->
        {#if $playinsStep < 2}
          <button
            on:click={simulateCurrentStage}
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Simular todas as etapas de play-in de uma vez"
          >
            <FastForward class="w-3.5 h-3.5 text-purple-400" />
            <span class="hidden sm:inline">Simular Fase</span>
          </button>
        {/if}

        <!-- Advance to Next Stage Button (Blocked until all knockouts simulated) -->
        <button
          on:click={advanceToNextStage}
          disabled={$playinsStep < 2}
          class={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg ${
            $playinsStep >= 2
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-950/80 ring-2 ring-indigo-400/40 animate-pulse'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
          }`}
          title={$playinsStep >= 2 ? 'Avançar para os Playoffs Finais' : 'Simule todos os mata-matas dos play-ins para liberar a próxima fase'}
        >
          {#if $playinsStep < 2}
            <Lock class="w-3.5 h-3.5 text-slate-500" />
          {:else}
            <ArrowRight class="w-3.5 h-3.5 text-white" />
          {/if}
          <span>Passar de Fase</span>
        </button>

      {:else if $seasonStage === 'playoffs_finais'}
        <span class="text-xs font-mono font-bold text-slate-400 mr-2">
          Mata-mata <strong class="text-white">{$playoffsStep}</strong> de 3
        </span>

        <!-- Step Knockout in Final Playoffs -->
        <button
          on:click={simulateNextKnockout}
          disabled={$playoffsStep >= 3}
          class={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
            $playoffsStep >= 3
              ? 'bg-slate-800/60 border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white cursor-pointer shadow-emerald-950/60'
          }`}
          title={$playoffsStep === 0 ? 'Simular Quartas de Final e Acessos' : $playoffsStep === 1 ? 'Simular Semifinais' : $playoffsStep === 2 ? 'Simular Grande Final' : 'Mata-matas de playoffs concluídos'}
        >
          {#if $playoffsStep >= 3}
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>Mata-matas Concluídos</span>
          {:else if $playoffsStep === 0}
            <Play class="w-3.5 h-3.5 fill-current text-emerald-200" />
            <span>Simular Mata-Mata (Quartas/Acessos)</span>
          {:else if $playoffsStep === 1}
            <Play class="w-3.5 h-3.5 fill-current text-emerald-200" />
            <span>Simular Mata-Mata (Semifinais)</span>
          {:else}
            <Trophy class="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Mata-Mata (Grande Final)</span>
          {/if}
        </button>

        <!-- Fast Forward Playoffs if not completed -->
        {#if $playoffsStep < 3}
          <button
            on:click={simulateCurrentStage}
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Simular todas as etapas de playoffs de uma vez"
          >
            <FastForward class="w-3.5 h-3.5 text-emerald-400" />
            <span class="hidden sm:inline">Simular Fase</span>
          </button>
        {/if}

        <!-- Finalize Season / Advance to Summary (Blocked until Final simulated) -->
        <button
          on:click={advanceToNextStage}
          disabled={$playoffsStep < 3}
          class={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg ${
            $playoffsStep >= 3
              ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-amber-950/80 ring-2 ring-amber-400/50 animate-pulse'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
          }`}
          title={$playoffsStep >= 3 ? 'Encerrar temporada e abrir relatório anual' : 'Simule todos os mata-matas até a grande final antes de encerrar a temporada'}
        >
          {#if $playoffsStep < 3}
            <Lock class="w-3.5 h-3.5 text-slate-500" />
            <span>Finalizar Temporada</span>
          {:else}
            <Trophy class="w-3.5 h-3.5 text-amber-200" />
            <span>Finalizar Temporada {$currentSeasonNum}</span>
          {/if}
        </button>

      {:else if $seasonStage === 'concluida'}
        <button
          on:click={() => showWizardModal.set(true)}
          class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-950/80 ring-2 ring-amber-400/50 animate-pulse"
        >
          <Trophy class="w-4 h-4 text-white" />
          <span>Finalizar Temporada {$currentSeasonNum}</span>
        </button>
      {/if}
    </div>

  </div>

</div>
