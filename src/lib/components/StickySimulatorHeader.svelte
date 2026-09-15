<script>
  import {
    currentSeasonNum,
    seasonsIndex,
    seasonStage,
    simulatedRoundsCount,
    totalRounds,
    maxSeasonRounds,
    activeDivision,
    activeGroup,
    setDivision,
    setActiveGroup,
    simulateOneRound,
    simulateCurrentStage,
    simulateNextKnockout,
    advanceToNextStage,
    playinsStep,
    playoffsStep,
    showWizardModal
  } from '$lib/stores/gameStore.js';
  import {
    CONFERENCES_C,
    MACRO_REGIONS_D,
    LEAGUES_BY_MACRO_D,
    CONFERENCE_COLORS,
    getConferenceFromLeague,
    getFriendlyGroupName
  } from '$lib/utils/leagueNames.js';
  import {
    Play,
    FastForward,
    Trophy,
    Layers,
    CheckCircle2,
    ChevronDown,
    Shield,
    Lock,
    ArrowRight
  } from 'lucide-svelte';

  const stages = [
    { id: 'grupos', name: '1. Grupos', shortName: 'Grupos' },
    { id: 'playins', name: '2. Play-ins', shortName: 'Play-ins' },
    { id: 'playoffs_finais', name: '3. Decisão', shortName: 'Decisão' }
  ];

  function getStageIdx(st) {
    if (st === 'grupos') return 0;
    if (st === 'playins') return 1;
    if (st === 'playoffs_finais') return 2;
    if (st === 'concluida') return 3;
    return 0;
  }

  $: currentStageIdx = getStageIdx($seasonStage);
  $: allDLeagues = Object.entries(LEAGUES_BY_MACRO_D);
</script>

<div class="sticky top-16 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
      
      <!-- Left: Season & Division / Group Controls -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        
        <!-- Season Badge -->
        <div class="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
          <Trophy class="w-3.5 h-3.5 text-amber-400" />
          <span>T{$currentSeasonNum}</span>
        </div>

        <!-- Division Toggle Pill -->
        <div class="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
          <button
            on:click={() => setDivision('serie_c')}
            class={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              $activeDivision === 'serie_c'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Série C
          </button>
          <button
            on:click={() => setDivision('serie_d')}
            class={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              $activeDivision === 'serie_d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Série D
          </button>
        </div>

        <!-- Group / Conference Selector -->
        {#if $activeDivision === 'serie_c'}
          <div class="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
            {#if $seasonStage === 'playoffs_finais' || $seasonStage === 'concluida'}
              <span class="text-[10px] font-black uppercase text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/60">
                Fase Nacional
              </span>
            {:else}
              {#each CONFERENCES_C as conf}
                {@const isConfSelected = $activeGroup === conf}
                <button
                  on:click={() => setActiveGroup(conf)}
                  class={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isConfSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
                  }`}
                >
                  {CONFERENCE_COLORS[conf]?.name || conf}
                </button>
              {/each}
            {/if}
          </div>
        {:else}
          {#if $seasonStage !== 'grupos'}
            <!-- In Playoffs, only show the 4 Macrorregiões -->
            <div class="flex items-center gap-1 overflow-x-auto max-w-[320px] sm:max-w-none scrollbar-none">
              {#each MACRO_REGIONS_D as macro}
                {@const isSelected = getConferenceFromLeague($activeGroup) === macro}
                <button
                  on:click={() => {
                    const firstLg = LEAGUES_BY_MACRO_D[macro]?.[0];
                    if (firstLg) setActiveGroup(firstLg);
                  }}
                  class={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
                  }`}
                >
                  {CONFERENCE_COLORS[macro]?.name || macro}
                </button>
              {/each}
            </div>
          {:else}
            <!-- In Serie D Groups: Macro pills + League dropdown -->
            {@const currentMacro = getConferenceFromLeague($activeGroup)}
            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <div class="flex items-center gap-1">
                {#each MACRO_REGIONS_D as macro}
                  {@const isMacroSelected = currentMacro === macro}
                  <button
                    on:click={() => {
                      const firstLg = LEAGUES_BY_MACRO_D[macro]?.[0];
                      if (firstLg) setActiveGroup(firstLg);
                    }}
                    class={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isMacroSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300 bg-slate-950/40 border border-slate-800'
                    }`}
                  >
                    {CONFERENCE_COLORS[macro]?.name || macro}
                  </button>
                {/each}
              </div>

              <select
                value={$activeGroup}
                on:change={(e) => setActiveGroup(e.target.value)}
                class="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {#each (LEAGUES_BY_MACRO_D[currentMacro] || []) as lg}
                  <option value={lg}>{lg.replace(`${currentMacro}_`, '').replace('_', ' ')}</option>
                {/each}
              </select>
            </div>
          {/if}
        {/if}

      </div>

      <!-- Center: 3-Stage Mini Stepper -->
      <div class="hidden md:flex items-center gap-2">
        {#each stages as st, idx}
          {@const isPast = currentStageIdx > idx}
          {@const isCurrent = currentStageIdx === idx}
          
          <div class="flex items-center gap-1.5">
            <div
              class={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                isCurrent
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                  : isPast
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              {#if isPast}
                <CheckCircle2 class="w-3 h-3 text-emerald-400" />
              {:else if isCurrent}
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              {/if}
              <span>{st.shortName}</span>
            </div>

            {#if idx < stages.length - 1}
              <span class="text-slate-600 text-[10px] font-bold">➔</span>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Right: Simulation Controls -->
      <div class="flex items-center gap-2 shrink-0">
        {#if $seasonStage === 'grupos'}
          <span class="text-xs font-mono font-bold text-slate-400 mr-1 hidden sm:inline">
            R<strong class="text-white">{$simulatedRoundsCount}</strong>/{$maxSeasonRounds}
          </span>

          <button
            on:click={simulateOneRound}
            disabled={$simulatedRoundsCount >= $maxSeasonRounds}
            class="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Avançar 1 Rodada"
          >
            <Play class="w-3 h-3 fill-current text-indigo-400" />
            <span class="hidden sm:inline">1 Rodada</span>
          </button>

          {#if $simulatedRoundsCount < $maxSeasonRounds}
            <button
              on:click={simulateCurrentStage}
              class="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-950/80"
              title="Simular toda a fase de grupos"
            >
              <FastForward class="w-3.5 h-3.5 fill-current" />
              <span>Simular Fase</span>
            </button>
          {:else}
            <button
              on:click={advanceToNextStage}
              class="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/80 ring-2 ring-emerald-400/40 animate-pulse"
              title="Avançar para os Play-ins"
            >
              <span>Passar para Play-ins</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          {/if}

        {:else if $seasonStage === 'playins'}
          <span class="text-xs font-mono font-bold text-slate-400 mr-1 hidden sm:inline">
            Mata-mata <strong class="text-white">{$playinsStep}</strong>/2
          </span>

          <button
            on:click={simulateNextKnockout}
            disabled={$playinsStep >= 2}
            class={`px-2.5 py-1 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all shadow-sm ${
              $playinsStep >= 2
                ? 'bg-slate-800/60 border-slate-700/50 text-slate-500 cursor-not-allowed'
                : 'bg-purple-700 hover:bg-purple-600 border-purple-500 text-white cursor-pointer'
            }`}
            title="Simular próximo mata-mata de play-in"
          >
            {#if $playinsStep >= 2}
              <CheckCircle2 class="w-3 h-3 text-emerald-400" />
              <span>Concluído</span>
            {:else}
              <Play class="w-3 h-3 fill-current text-purple-200" />
              <span>{$playinsStep === 0 ? 'Semifinais' : 'Finais'}</span>
            {/if}
          </button>

          <button
            on:click={advanceToNextStage}
            disabled={$playinsStep < 2}
            class={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
              $playinsStep >= 2
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-950/80 ring-2 ring-indigo-400/40 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
            }`}
            title={$playinsStep >= 2 ? 'Avançar para Decisão' : 'Simule todos os mata-matas para avançar'}
          >
            {#if $playinsStep < 2}
              <Lock class="w-3 h-3 text-slate-500" />
            {:else}
              <ArrowRight class="w-3 h-3 text-white" />
            {/if}
            <span>Passar Fase</span>
          </button>

        {:else if $seasonStage === 'playoffs_finais'}
          <span class="text-xs font-mono font-bold text-slate-400 mr-1 hidden sm:inline">
            Mata-mata <strong class="text-white">{$playoffsStep}</strong>/3
          </span>

          <button
            on:click={simulateNextKnockout}
            disabled={$playoffsStep >= 3}
            class={`px-2.5 py-1 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all shadow-sm ${
              $playoffsStep >= 3
                ? 'bg-slate-800/60 border-slate-700/50 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white cursor-pointer'
            }`}
            title="Simular próximo mata-mata decisivo"
          >
            {#if $playoffsStep >= 3}
              <CheckCircle2 class="w-3 h-3 text-emerald-400" />
              <span>Concluído</span>
            {:else if $playoffsStep === 0}
              <Play class="w-3 h-3 fill-current text-emerald-200" />
              <span>Quartas</span>
            {:else if $playoffsStep === 1}
              <Play class="w-3 h-3 fill-current text-emerald-200" />
              <span>Semis</span>
            {:else}
              <Trophy class="w-3 h-3 text-amber-400" />
              <span>Final</span>
            {/if}
          </button>

          <button
            on:click={advanceToNextStage}
            disabled={$playoffsStep < 3}
            class={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
              $playoffsStep >= 3
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-amber-950/80 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
            }`}
            title={$playoffsStep >= 3 ? 'Finalizar Temporada' : 'Simule até a final para encerrar'}
          >
            {#if $playoffsStep < 3}
              <Lock class="w-3 h-3 text-slate-500" />
            {:else}
              <Trophy class="w-3 h-3 text-amber-200" />
            {/if}
            <span>Finalizar</span>
          </button>

        {:else if $seasonStage === 'concluida'}
          <button
            on:click={() => showWizardModal.set(true)}
            class="px-3.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/80 animate-pulse"
          >
            <Trophy class="w-3.5 h-3.5" />
            <span>Finalizar T{$currentSeasonNum}</span>
          </button>
        {/if}
      </div>

    </div>
  </div>
