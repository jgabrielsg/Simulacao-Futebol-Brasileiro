<script>
  import { activeStandings, selectedDivision, focusedTeamId, cityHubs } from '$lib/stores/gameStore.js';
  import TeamBadge from './TeamBadge.svelte';
  import { MapPin, Trophy, Plane, ArrowUp, ArrowDown } from 'lucide-svelte';

  function handleRowClick(teamId) {
    if ($focusedTeamId === teamId) {
      focusedTeamId.set(null); // toggle off
    } else {
      focusedTeamId.set(teamId);
    }
  }

  // Get zone styling based on division and rank
  function getZoneClass(idx, total, div) {
    if (div === 'serie_A') {
      if (idx < 4) return 'border-l-4 border-l-emerald-500 bg-emerald-950/20'; // Libertadores / Title
      if (idx < 6) return 'border-l-4 border-l-teal-500 bg-teal-950/10'; // Pré-Libertadores
      if (idx >= total - 4) return 'border-l-4 border-l-rose-500 bg-rose-950/20'; // Relegation Z4
    } else if (div === 'serie_B') {
      if (idx < 4) return 'border-l-4 border-l-emerald-500 bg-emerald-950/20'; // Promotion G4
      if (idx >= total - 4) return 'border-l-4 border-l-rose-500 bg-rose-950/20'; // Relegation Z4
    } else if (div === 'serie_C') {
      if (idx === 0) return 'border-l-4 border-l-emerald-500 bg-emerald-950/20'; // Promoted to B
      if (idx === total - 1) return 'border-l-4 border-l-rose-500 bg-rose-950/20'; // Relegated to D
    } else if (div === 'serie_D') {
      if (idx === 0) return 'border-l-4 border-l-emerald-500 bg-emerald-950/20'; // Promoted to C
      if (idx >= total - 4) return 'border-l-4 border-l-rose-500 bg-rose-950/20'; // Relegated to Amateur
    }
    return '';
  }
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
  <!-- Header Title -->
  <div class="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
    <div class="flex items-center gap-2 font-bold text-sm text-slate-200">
      <Trophy class="w-4 h-4 text-amber-400" />
      Tabela de Classificação
    </div>
    <div class="text-xs text-slate-400 font-normal">
      Clique na linha para ver as rotas de viagem no Mapa
    </div>
  </div>

  <!-- Table Body -->
  <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-950/90 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
        <tr>
          <th class="py-2.5 px-3 text-center w-8">#</th>
          <th class="py-2.5 px-3">Clube</th>
          <th class="py-2.5 px-2 text-center font-extrabold text-white">PTS</th>
          <th class="py-2.5 px-2 text-center">J</th>
          <th class="py-2.5 px-2 text-center">V</th>
          <th class="py-2.5 px-2 text-center">E</th>
          <th class="py-2.5 px-2 text-center">D</th>
          <th class="py-2.5 px-2 text-center">GP</th>
          <th class="py-2.5 px-2 text-center">GC</th>
          <th class="py-2.5 px-2 text-center">SG</th>
          <th class="py-2.5 px-3 text-center">PageRank</th>
          <th class="py-2.5 px-3 text-left hidden sm:table-cell">Hub Aéreo</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60 font-medium">
        {#each $activeStandings as item, idx (item.teamId)}
          {@const isFocused = $focusedTeamId === item.teamId}
          {@const zoneClass = getZoneClass(idx, $activeStandings.length, $selectedDivision)}
          {@const hubInfo = $cityHubs[item.teamId]}

          <tr
            on:click={() => handleRowClick(item.teamId)}
            class={`cursor-pointer transition-colors hover:bg-slate-800/80 ${zoneClass} ${
              isFocused ? 'bg-emerald-950/40 ring-1 ring-emerald-500/50' : 'even:bg-slate-950/30'
            }`}
          >
            <!-- Position -->
            <td class="py-2 px-3 text-center font-bold text-slate-400">
              {idx + 1}
            </td>

            <!-- Team Badge & Name -->
            <td class="py-2 px-3 flex items-center gap-2.5 min-w-[170px]">
              <TeamBadge teamId={item.teamId} name={item.name} state={item.state} size="w-6 h-6" />
              <div class="truncate">
                <span class="font-bold text-slate-100 block text-xs truncate max-w-[130px]" title={item.name}>
                  {item.name}
                </span>
                <span class="text-[9px] text-slate-500 font-semibold uppercase">{item.state}</span>
              </div>
            </td>

            <!-- Points -->
            <td class="py-2 px-2 text-center font-extrabold text-emerald-400 text-sm">
              {item.points}
            </td>

            <!-- Stats -->
            <td class="py-2 px-2 text-center text-slate-300">{item.played}</td>
            <td class="py-2 px-2 text-center text-emerald-400">{item.won}</td>
            <td class="py-2 px-2 text-center text-amber-400">{item.drawn}</td>
            <td class="py-2 px-2 text-center text-rose-400">{item.lost}</td>
            <td class="py-2 px-2 text-center text-slate-400">{item.goalsFor}</td>
            <td class="py-2 px-2 text-center text-slate-400">{item.goalsAgainst}</td>
            <td class="py-2 px-2 text-center font-bold ${item.goalDifference > 0 ? 'text-emerald-400' : item.goalDifference < 0 ? 'text-rose-400' : 'text-slate-400'}">
              {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
            </td>

            <!-- PageRank Score -->
            <td class="py-2 px-3 text-center font-mono text-[11px] text-purple-300">
              {(item.pagerank * 1000).toFixed(2)}
            </td>

            <!-- Hub Aéreo -->
            <td class="py-2 px-3 text-left text-[11px] text-slate-400 hidden sm:table-cell">
              {#if hubInfo && hubInfo.hub_aero_iata}
                <div class="flex items-center gap-1.5">
                  <Plane class="w-3 h-3 text-cyan-400 shrink-0" />
                  <span class="font-bold text-cyan-300">{hubInfo.hub_aero_iata}</span>
                  <span class="text-[10px] text-slate-500">({hubInfo.dist_ate_aero_km} km)</span>
                </div>
              {:else}
                <span class="text-slate-600">-</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
