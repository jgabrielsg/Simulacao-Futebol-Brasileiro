<script>
  import {
    currentRound,
    totalRounds,
    currentRoundMatches,
    simulatedRoundsCount,
    seasonStage,
    focusedTeamId
  } from '$lib/stores/gameStore.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    SkipBack,
    SkipForward,
    Bus,
    Plane,
    MapPin,
    Navigation,
    Calendar
  } from 'lucide-svelte';

  $: effectiveRound = Math.min(Math.max(1, $currentRound), $totalRounds);

  function formatMoney(val) {
    if (!val && val !== 0) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }

  function formatKm(km) {
    if (!km && km !== 0) return '0 km';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(km) + ' km';
  }

  function prevRound() {
    if (effectiveRound > 1) {
      currentRound.set(effectiveRound - 1);
    }
  }

  function nextRound() {
    if (effectiveRound < $totalRounds) {
      currentRound.set(effectiveRound + 1);
    }
  }

  function handleSliderChange(e) {
    const val = parseInt(e.target.value, 10);
    if (val >= 1 && val <= $totalRounds) {
      currentRound.set(val);
    }
  }
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
  
  <!-- Header with Stepper Controls -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
    
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
        <Navigation class="w-4 h-4" />
      </div>
      <div>
        <h3 class="font-black text-white text-sm flex items-center gap-2">
          Jogos & Itinerários da Rodada
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
            Rodada {effectiveRound} de {$totalRounds}
          </span>
        </h3>
        <p class="text-[11px] text-slate-400">
          Inspecione os confrontos e veja como os trajetos mudam a cada rodada.
        </p>
      </div>
    </div>

    <!-- Stepper Buttons -->
    <div class="flex items-center gap-2 self-start sm:self-auto">
      <button
        on:click={prevRound}
        disabled={effectiveRound <= 1}
        class="px-3.5 py-2 sm:px-2.5 sm:py-1 min-h-[38px] sm:min-h-0 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
      >
        <SkipBack class="w-3.5 h-3.5" /> Anterior
      </button>

      <button
        on:click={nextRound}
        disabled={effectiveRound >= $totalRounds}
        class="px-3.5 py-2 sm:px-2.5 sm:py-1 min-h-[38px] sm:min-h-0 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
      >
        Próxima <SkipForward class="w-3.5 h-3.5" />
      </button>
    </div>

  </div>

  <!-- Round Slider -->
  <div class="space-y-1">
    <div class="flex justify-between text-[10px] font-mono text-slate-400">
      <span>Rodada 1</span>
      <span class="text-indigo-400 font-bold">Vendo: Rodada {effectiveRound}</span>
      <span>Rodada {$totalRounds}</span>
    </div>
    <input
      type="range"
      min="1"
      max={$totalRounds}
      value={effectiveRound}
      on:input={handleSliderChange}
      class="w-full accent-indigo-500 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer h-2"
    />
  </div>

  <!-- Matches Grid -->
  {#if $currentRoundMatches.length === 0}
    <div class="p-6 text-center text-slate-400 text-xs italic">
      Nenhum jogo cadastrado para esta rodada.
    </div>
  {:else}
    <div class="space-y-2">
      <div class="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
        <span>Partidas da Rodada {effectiveRound} ({$currentRoundMatches.length} jogos)</span>
        {#if $seasonStage === 'grupos' && effectiveRound > $simulatedRoundsCount}
          <span class="text-amber-400/90 font-mono text-[10px] font-bold">
            (Rodada Futura — ainda não disputada)
          </span>
        {/if}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
        {#each $currentRoundMatches as match (match.jogo_id || match.mandante + match.visitante)}
          {@const d = match.deslocamento}
          {@const isTourConnection = d?.origem_tipo === 'CIDADE_ADVERSARIO_ANTERIOR'}
          {@const isFlight = d?.modal === 'AIR'}
          {@const mandanteName = match.mandante.split('/')[0]}
          {@const visitanteName = match.visitante.split('/')[0]}
          {@const isPlayed = $seasonStage !== 'grupos' || effectiveRound <= $simulatedRoundsCount}

          <div class="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 space-y-2 transition-all shadow-sm">
            
            <!-- Scoreline Row -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <TeamBadge teamId={match.mandante} size="w-5 h-5" />
                <span class="font-bold text-xs text-white truncate" title={mandanteName}>
                  {mandanteName}
                </span>
              </div>

              <!-- Score Badge -->
              <div class={`px-2.5 py-0.5 rounded-lg font-mono font-black text-xs shrink-0 ${
                isPlayed
                  ? 'bg-slate-900 border border-slate-700 text-amber-300 shadow-inner'
                  : 'bg-slate-950 border border-slate-800 text-slate-500'
              }`}>
                {#if isPlayed}
                  {match.gols_mandante} × {match.gols_visitante}
                {:else}
                  vs
                {/if}
              </div>

              <div class="flex items-center justify-end gap-2 flex-1 min-w-0">
                <span class="font-bold text-xs text-white truncate text-right" title={visitanteName}>
                  {visitanteName}
                </span>
                <TeamBadge teamId={match.visitante} size="w-5 h-5" />
              </div>
            </div>

            <!-- Logistics Details -->
            {#if d}
              <div class="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-800/60 text-[9px]">
                <div class="flex items-center gap-1.5">
                  {#if isFlight}
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 font-bold">
                      <Plane class="w-2.5 h-2.5" /> Aéreo
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 font-bold">
                      <Bus class="w-2.5 h-2.5" /> Ônibus
                    </span>
                  {/if}

                  {#if isTourConnection}
                    <span
                      class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-950/90 text-purple-300 font-bold"
                      title="Conexão direta de turnê TTP sem voltar para casa."
                    >
                      <Navigation class="w-2.5 h-2.5 text-purple-400" /> Turnê TTP
                    </span>
                  {/if}
                </div>

                <div class="flex items-center gap-1.5 font-mono text-slate-300">
                  <span class="text-slate-400 truncate max-w-[110px]">{d.origem_cidade} ➔ {d.destino_cidade}</span>
                  <span class="font-bold text-white">{formatKm(d.distancia_km)}</span>
                  <span class="text-emerald-400 font-bold">{formatMoney(d.custo_brl)}</span>
                </div>
              </div>
            {/if}

          </div>
        {/each}
      </div>
    </div>
  {/if}

</div>
