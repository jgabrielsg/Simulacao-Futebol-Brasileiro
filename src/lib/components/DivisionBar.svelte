<script>
  import { selectedDivision, selectedRegion, activeRoundIndex, activeSchedule } from '$lib/stores/gameStore.js';
  import { macroOrder, macroNames, microOrder, getMicroName } from '$lib/utils/leagueNames.js';
  import { Layers, MapPin } from 'lucide-svelte';

  const divisions = [
    { id: 'serie_A', name: 'Série A', desc: 'Nacional (20 times)', color: 'from-emerald-500 to-teal-600' },
    { id: 'serie_B', name: 'Série B', desc: 'Nacional (20 times)', color: 'from-cyan-500 to-blue-600' },
    { id: 'serie_C', name: 'Série C', desc: '4 Macro-Regiões (Balanced K-Means)', color: 'from-amber-500 to-orange-600' },
    { id: 'serie_D', name: 'Série D', desc: '12 Micro-Regiões (Logística Local)', color: 'from-purple-500 to-indigo-600' }
  ];

  function handleDivisionChange(divId) {
    selectedDivision.set(divId);
    if (divId === 'serie_C') {
      selectedRegion.set('macro_1'); // North-to-South starting macro: macro_1 (Liga Verde)
    } else if (divId === 'serie_D') {
      selectedRegion.set('micro_4'); // North-to-South starting micro: micro_4 (Liga Grão-Pará)
    }
  }
</script>

<div class="bg-slate-900 border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
    <!-- Division Selector Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
      <div class="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mr-2 shrink-0">
        <Layers class="w-4 h-4 text-emerald-400" />
        Divisões:
      </div>

      {#each divisions as div}
        <button
          on:click={() => handleDivisionChange(div.id)}
          class={`px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${
            $selectedDivision === div.id
              ? `bg-gradient-to-r ${div.color} text-white border-transparent shadow-lg shadow-black/40 scale-105`
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {div.name}
        </button>
      {/each}
    </div>

    <!-- Active Division Status & Sub-region selector -->
    <div class="flex items-center gap-3 shrink-0 text-xs">
      <!-- Sub-region Selectors for Serie C or D -->
      {#if $selectedDivision === 'serie_C'}
        <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5">
          <MapPin class="w-3.5 h-3.5 text-amber-400" />
          <span class="text-slate-400 font-medium">Liga:</span>
          <select
            bind:value={$selectedRegion}
            class="bg-slate-900 text-amber-300 font-semibold text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
          >
            {#each macroOrder as mKey}
              <option value={mKey}>{macroNames[mKey]}</option>
            {/each}
          </select>
        </div>
      {:else if $selectedDivision === 'serie_D'}
        <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5">
          <MapPin class="w-3.5 h-3.5 text-purple-400" />
          <span class="text-slate-400 font-medium">Liga:</span>
          <select
            bind:value={$selectedRegion}
            class="bg-slate-900 text-purple-300 font-semibold text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-purple-500 max-w-[200px]"
          >
            {#each microOrder as dKey}
              <option value={dKey}>{getMicroName(dKey)}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Round Progress Indicator -->
      <div class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
        <span class="text-slate-400 text-[10px] uppercase font-bold">Progresso:</span>
        <span class="font-extrabold text-emerald-400">
          Rodada {$activeRoundIndex} / {$activeSchedule.length}
        </span>
      </div>
    </div>
  </div>
</div>
