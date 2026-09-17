<script>
  import {
    progressiveStandings,
    activeDivision,
    activeGroup,
    focusedTeamId,
    focusTeam,
    teamsDb,
    simulatedRoundsCount,
    totalRounds,
    seasonStage
  } from '$lib/stores/gameStore.js';
  import { getFriendlyGroupName, getQualificationCutoff } from '$lib/utils/leagueNames.js';
  import TeamBadge from './TeamBadge.svelte';
  import { Trophy, HelpCircle, Navigation } from 'lucide-svelte';

  function handleRowClick(teamId) {
    focusTeam(teamId);
  }

  function getZone(idx, total, div) {
    if ($simulatedRoundsCount === 0 && $seasonStage === 'grupos') return null;

    if (div === 'serie_c') {
      if (idx === 0) {
        return {
          label: 'Nacional dos 8 (BYE)',
          rowClass: 'border-l-4 border-l-emerald-500 bg-emerald-950/25',
          badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        };
      }
      if (idx >= 1 && idx <= 4) {
        return {
          label: 'Play-in Local',
          rowClass: 'border-l-4 border-l-indigo-500 bg-indigo-950/20',
          badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-800'
        };
      }
      if (idx >= total - 2) {
        return {
          label: 'Descenso Série D',
          rowClass: 'border-l-4 border-l-rose-500 bg-rose-950/25',
          badgeClass: 'bg-rose-950 text-rose-300 border-rose-800'
        };
      }
    } else {
      // Serie D: dynamic cutoff (G-4 in general and Norte-Centro 3, 4; G-2 in Norte-Centro 1, 2, 5, 6)
      const cutoff = getQualificationCutoff(div, $activeGroup);
      if (idx < cutoff) {
        return {
          label: 'Playoffs Regionais',
          rowClass: 'border-l-4 border-l-emerald-500 bg-emerald-950/25',
          badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        };
      }
    }

    return null;
  }
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
  
  <!-- Table Header Bar -->
  <div class="px-4 sm:px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <Trophy class="w-4 h-4 text-amber-400" />
      <span class="font-black text-xs text-white">
        Classificação: {getFriendlyGroupName($activeGroup)}
      </span>
      <span class="text-[11px] font-mono text-slate-400">
        {#if $seasonStage !== 'grupos'}
          (Classificação Final • {$totalRounds} rodadas)
        {:else}
          (Rodada {Math.min($simulatedRoundsCount, $totalRounds)} de {$totalRounds})
        {/if}
      </span>
    </div>

    <!-- UX Hint -->
    <div class="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
      <Navigation class="w-3 h-3 text-indigo-400" />
      <span>Clique na linha para focar no Mapa</span>
    </div>
  </div>

  <!-- Zone Legend (when matches have started) -->
  {#if $simulatedRoundsCount > 0}
    <div class="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center gap-3 text-[10px] font-bold">
      {#if $activeDivision === 'serie_c'}
        <span class="flex items-center gap-1 text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 1º: Nacional dos 8 (BYE)
        </span>
        <span class="flex items-center gap-1 text-indigo-400">
          <span class="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> 2º-5º: Play-in Local
        </span>
        <span class="flex items-center gap-1 text-rose-400">
          <span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Z-2: Descenso D
        </span>
      {:else}
        {@const cutoff = getQualificationCutoff($activeDivision, $activeGroup)}
        <span class="flex items-center gap-1 text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> G-{cutoff}: Playoffs Regionais
        </span>
      {/if}
    </div>
  {/if}

  <!-- Table Body -->
  <div class="overflow-x-auto max-h-[560px] overflow-y-auto scrollbar-thin">
    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-20 border-b border-slate-800">
        <tr>
          <th class="py-2.5 px-2.5 text-center w-9 min-w-[36px] sticky top-0 left-0 z-30 bg-slate-950">#</th>
          <th class="py-2.5 px-3 sticky top-0 left-9 z-30 bg-slate-950 min-w-[150px] sm:min-w-[190px] border-r border-slate-800 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">Clube</th>
          <th class="py-2.5 px-2 text-center font-black text-amber-300">PTS</th>
          <th class="py-2.5 px-2 text-center">J</th>
          <th class="py-2.5 px-2 text-center">V</th>
          <th class="py-2.5 px-2 text-center">E</th>
          <th class="py-2.5 px-2 text-center">D</th>
          <th class="py-2.5 px-2 text-center">GP</th>
          <th class="py-2.5 px-2 text-center">GC</th>
          <th class="py-2.5 px-2 text-center font-bold">SG</th>
          <th class="py-2.5 px-3 text-right hidden sm:table-cell">PageRank</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60 font-medium">
        {#each $progressiveStandings as row, idx (row.clube)}
          {@const zone = getZone(idx, $progressiveStandings.length, $activeDivision)}
          {@const teamObj = $teamsDb ? $teamsDb[row.clube] : null}
          {@const isFocused = $focusedTeamId === row.clube}
          {@const cellStickyBg = isFocused ? 'bg-slate-900' : (idx % 2 === 1 ? 'bg-slate-950' : 'bg-slate-900')}

          <tr
            on:click={() => handleRowClick(row.clube)}
            class={`cursor-pointer transition-all hover:bg-slate-800/80 group ${
              isFocused
                ? 'bg-indigo-950/50 border-l-4 border-l-indigo-400 ring-1 ring-indigo-400/50 shadow-inner'
                : zone ? zone.rowClass : 'even:bg-slate-950/30'
            }`}
          >
            <!-- Rank # (Sticky Column 1) -->
            <td class={`py-2.5 px-2.5 text-center font-mono font-black text-slate-400 w-9 min-w-[36px] sticky left-0 z-10 ${cellStickyBg} group-hover:bg-slate-800 transition-colors`}>
              {row.pos || idx + 1}
            </td>

            <!-- Club Info (Sticky Column 2) -->
            <td class={`py-2.5 px-3 sticky left-9 z-10 min-w-[150px] sm:min-w-[190px] border-r border-slate-800 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] ${cellStickyBg} group-hover:bg-slate-800 transition-colors`}>
              <div class="flex items-center gap-2.5">
                <TeamBadge teamId={row.clube} name={row.nome} size="w-6 h-6" />
                <div class="truncate max-w-[110px] sm:max-w-none">
                  <span class="font-extrabold text-white text-xs block truncate">
                    {row.nome || row.clube.split('/')[0]}
                  </span>
                  <span class="text-[9px] text-slate-500 uppercase font-semibold block truncate">
                    {teamObj?.cidade ? `${teamObj.cidade} - ${teamObj.uf}` : row.clube.split('/')[1]?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </td>

            <!-- Points -->
            <td class="py-2.5 px-2 text-center font-mono font-black text-sm text-amber-300">
              {row.pts}
            </td>

            <!-- Matches -->
            <td class="py-2.5 px-2 text-center font-mono text-slate-400">{row.j}</td>

            <!-- Victories -->
            <td class="py-2.5 px-2 text-center font-mono text-emerald-400 font-bold">{row.v}</td>

            <!-- Draws -->
            <td class="py-2.5 px-2 text-center font-mono text-slate-400">{row.e}</td>

            <!-- Losses -->
            <td class="py-2.5 px-2 text-center font-mono text-rose-400 font-bold">{row.d}</td>

            <!-- Goals For (GP) -->
            <td class="py-2.5 px-2 text-center font-mono text-slate-300">{row.gp}</td>

            <!-- Goals Against (GC) -->
            <td class="py-2.5 px-2 text-center font-mono text-slate-400">{row.gc}</td>

            <!-- Goal Difference (SG) -->
            <td class={`py-2.5 px-2 text-center font-mono font-extrabold ${
              row.sg > 0 ? 'text-emerald-400' : row.sg < 0 ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {row.sg > 0 ? `+${row.sg}` : row.sg}
            </td>

            <!-- PageRank -->
            <td class="py-2.5 px-3 text-right font-mono text-[10px] text-slate-400 hidden sm:table-cell">
              {teamObj?.pagerank ? teamObj.pagerank.toFixed(5) : '-'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

</div>
