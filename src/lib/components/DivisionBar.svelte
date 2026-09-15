<script>
  import {
    activeDivision,
    activeGroup,
    setActiveGroup,
    currentGroupTeams,
    seasonDataStore,
    seasonStage
  } from '$lib/stores/gameStore.js';
  import {
    MACRO_REGIONS_D,
    LEAGUES_BY_MACRO_D,
    CONFERENCE_COLORS,
    getConferenceFromLeague,
    isLeague100Road
  } from '$lib/utils/leagueNames.js';
  import { Shield } from 'lucide-svelte';

  // Active macro tab for Serie D filtering
  let activeMacroD = 'SUDESTE';

  $: if ($activeDivision === 'serie_d') {
    activeMacroD = getConferenceFromLeague($activeGroup);
  }

  function handleSelectMacroD(macro) {
    activeMacroD = macro;
    const firstLeague = LEAGUES_BY_MACRO_D[macro]?.[0];
    if (firstLeague) {
      setActiveGroup(firstLeague);
    }
  }
</script>

{#if $activeDivision === 'serie_d' && $seasonStage === 'grupos'}
  <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
    
    <!-- Macro-region & Active League Header -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span class="text-[11px] font-bold text-slate-400 shrink-0">Macrorregião:</span>
        {#each MACRO_REGIONS_D as macro}
          {@const color = CONFERENCE_COLORS[macro]}
          {@const isMacroSelected = activeMacroD === macro}
          <button
            on:click={() => handleSelectMacroD(macro)}
            class={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              isMacroSelected
                ? `${color.badgeBg} ${color.badgeText} border ${color.badgeBorder} shadow-md`
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {color.name}
          </button>
        {/each}
      </div>

      <div class="flex items-center gap-1.5 text-xs text-slate-400">
        <Shield class="w-3.5 h-3.5 text-indigo-400" />
        <span class="font-bold text-white">{$currentGroupTeams.length} clubes na liga</span>
      </div>
    </div>

    <!-- Specific Leagues inside chosen Macro -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {#each (LEAGUES_BY_MACRO_D[activeMacroD] || []) as lKey}
        {@const isSelected = $activeGroup === lKey}
        {@const count = $seasonDataStore?.serie_d?.ligas?.[lKey]?.length || 0}
        {@const color = CONFERENCE_COLORS[activeMacroD]}
        {@const is100Road = isLeague100Road($seasonDataStore?.serie_d?.rodadas?.[lKey])}

        <button
          on:click={() => setActiveGroup(lKey)}
          class={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
            isSelected
              ? `${color.badgeBg} ${color.badgeBorder} text-white shadow-md ring-1 ring-offset-1 ring-offset-slate-950`
              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          style={isSelected ? `ring-color: ${color.primary}` : ''}
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-black block truncate">
              {lKey.replace(`${activeMacroD}_`, '').replace('_', ' ')}
            </span>
            <span class="text-[10px] font-mono text-slate-500 font-bold">{count}c</span>
          </div>
          {#if is100Road}
            <span class="text-[9px] text-emerald-400 block font-semibold">100% Rodoviário</span>
          {:else}
            <span class="text-[9px] text-amber-400/80 block font-semibold">Modal Misto</span>
          {/if}
        </button>
      {/each}
    </div>

  </div>
{/if}

