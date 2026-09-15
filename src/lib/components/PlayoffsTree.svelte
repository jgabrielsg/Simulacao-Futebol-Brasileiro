<script>
  import {
    currentPlayoffs,
    activeDivision,
    activeGroup,
    currentSeasonNum,
    seasonStage,
    playinsStep,
    playoffsStep,
    seasonDataStore
  } from '$lib/stores/gameStore.js';
  import {
    CONFERENCES_C,
    CONFERENCE_COLORS,
    getFriendlyGroupName,
    getConferenceFromLeague
  } from '$lib/utils/leagueNames.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    Trophy,
    Shield,
    Layers,
    MapPin,
    Lock
  } from 'lucide-svelte';

  // Sub-navigation within Serie C: 'playins' vs 'nacional8'
  let subViewC = 'playins';

  // Reactively derive selected conference and macro from $activeGroup
  $: selectedConfC = CONFERENCES_C.includes($activeGroup) ? $activeGroup : 'SUDESTE';
  $: selectedMacroD = getConferenceFromLeague($activeGroup);

  function formatMoney(val) {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }

  function getSingleMatchGoals(match, teamId) {
    if (!match?.jogo_unico) return '—';
    const ju = match.jogo_unico;
    if (ju.mandante === teamId) return ju.gols_m;
    if (ju.visitante === teamId) return ju.gols_v;
    return '—';
  }

  function isSingleMatchPen(match) {
    if (!match?.jogo_unico) return false;
    return match.jogo_unico.gols_m === match.jogo_unico.gols_v;
  }

  function isTwoLeggedPen(match) {
    if (!match?.jogo_ida || !match?.jogo_volta) return false;
    const t1 = match.time_1;
    const t2 = match.time_2;
    const g1_ida = match.jogo_ida.mandante === t1 ? match.jogo_ida.gols_m : match.jogo_ida.gols_v;
    const g1_volta = match.jogo_volta.mandante === t1 ? match.jogo_volta.gols_m : match.jogo_volta.gols_v;
    const g2_ida = match.jogo_ida.mandante === t2 ? match.jogo_ida.gols_m : match.jogo_ida.gols_v;
    const g2_volta = match.jogo_volta.mandante === t2 ? match.jogo_volta.gols_m : match.jogo_volta.gols_v;
    return (g1_ida + g1_volta) === (g2_ida + g2_volta);
  }

  // Knockout progression stages
  $: pStep = $playinsStep || 0;
  $: fStep = $playoffsStep || 0;
  $: isPlayinSemisDone = pStep >= 1 || $seasonStage === 'playoffs_finais' || $seasonStage === 'concluida';
  $: isPlayinFinalDone = pStep >= 2 || $seasonStage === 'playoffs_finais' || $seasonStage === 'concluida';
  $: isQuartasDone = fStep >= 1 || $seasonStage === 'concluida';
  $: isSemisDone = fStep >= 2 || $seasonStage === 'concluida';
  $: isFinalDone = fStep >= 3 || $seasonStage === 'concluida';

  // Prevent spoiler by forcing subViewC to playins if playins not finished
  $: if (!isPlayinFinalDone && subViewC === 'nacional8') {
    subViewC = 'playins';
  }

  // Look up 1st place champion with direct BYE in Serie C
  $: currentConf1st = (() => {
    if ($seasonStage === 'grupos') return null;
    const classif = $seasonDataStore?.serie_c?.classificacao?.[selectedConfC];
    if (classif && classif.length > 0) return classif[0];
    return null;
  })();

  // Look up Serie C playin for selected conference
  $: currentPlayinC = ($currentPlayoffs?.playins || []).find(p => p.conferencia === selectedConfC);
  $: semi1 = currentPlayinC?.semis?.[0];
  $: semi2 = currentPlayinC?.semis?.[1];
  $: playinFin = currentPlayinC?.final;

  // Look up Serie D macro data (fallback SUL-MS -> SUL if needed)
  $: currentMacroD = (() => {
    if (!$currentPlayoffs) return null;
    return $currentPlayoffs[selectedMacroD] || (selectedMacroD === 'SUL-MS' ? $currentPlayoffs['SUL'] : null);
  })();
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
  
  <!-- Header: Division Toggle & Context -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
    <div class="space-y-0.5">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
        <Trophy class="w-3 h-3 text-amber-400" />
        Fases Eliminatórias • Temporada {$currentSeasonNum}
      </div>
      <h3 class="text-lg font-black text-white tracking-tight">
        Playoffs & Chaveamentos Eliminatórios
      </h3>
      <p class="text-xs text-slate-400">
        Acompanhe os confrontos eliminatórios de {$activeDivision === 'serie_c' ? 'Série C' : 'Série D'}.
      </p>
    </div>

    <!-- Active Division Context Badge (controls are in the top header) -->
    <div class="flex items-center gap-2 self-start sm:self-auto">
      <span class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-white shadow-inner flex items-center gap-1.5">
        <Shield class="w-3.5 h-3.5 text-indigo-400" />
        {#if $activeDivision === 'serie_c'}
          Série C (Play-ins & Fase Nacional)
        {:else}
          Série D (Mata-mata Regional: {selectedMacroD})
        {/if}
      </span>
    </div>
  </div>

  {#if !$currentPlayoffs}
    <div class="p-6 text-center text-slate-400 text-xs">
      Chaveamentos não disponíveis para esta temporada.
    </div>
  {:else if $activeDivision === 'serie_c'}

    <!-- ================================================================= -->
    <!-- SÉRIE C: PLAY-INS DE CONFERÊNCIA OU PLAYOFFS FINAIS (NACIONAL 8)  -->
    <!-- ================================================================= -->
    <div class="space-y-5">
      
      <!-- Serie C Sub-views: Play-ins vs Playoffs Finais -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
        <div class="flex items-center gap-1.5">
          <button
            on:click={() => subViewC = 'playins'}
            class={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              subViewC === 'playins'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers class="w-3.5 h-3.5" />
            1. Play-ins Locais
          </button>
          <button
            on:click={() => {
              if (isPlayinFinalDone) subViewC = 'nacional8';
            }}
            disabled={!isPlayinFinalDone}
            class={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              !isPlayinFinalDone
                ? 'text-slate-600 bg-slate-950/40 border border-slate-800/40 cursor-not-allowed opacity-50'
                : subViewC === 'nacional8'
                  ? 'bg-indigo-600 text-white shadow-sm cursor-pointer'
                  : 'text-slate-400 hover:text-slate-200 cursor-pointer'
            }`}
            title={isPlayinFinalDone ? 'Visualizar Quartas, Semifinais e Final Nacional' : 'Bloqueado: conclua todos os confrontos de play-in regional para liberar o Nacional dos 8'}
          >
            {#if !isPlayinFinalDone}
              <Lock class="w-3.5 h-3.5 text-slate-500" />
            {:else}
              <Trophy class="w-3.5 h-3.5 text-amber-400" />
            {/if}
            2. Nacional dos 8 & Final
          </button>
        </div>

        {#if subViewC === 'playins'}
          <!-- Active Conference Status (selected via top header) -->
          <div class="flex items-center gap-1.5 px-2">
            <span class="text-[11px] font-bold text-slate-400">Conferência:</span>
            <span class="text-xs font-black text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2.5 py-1 rounded-lg">
              {getFriendlyGroupName(selectedConfC)}
            </span>
          </div>
        {/if}
      </div>

      {#if subViewC === 'playins'}
        <!-- VIEW C1: PLAY-IN DA CONFERÊNCIA SELECIONADA -->
        <div class="space-y-4">
          
          <!-- Explainer Card for Conference Play-in -->
          <div class="bg-slate-950/90 border border-purple-500/30 rounded-xl p-3.5 space-y-2.5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-purple-500/20 pb-2">
              <span class="text-xs font-black uppercase text-purple-400 tracking-wider">
                Chave G-5 Regional • {getFriendlyGroupName(selectedConfC)}
              </span>
              <span class="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800">
                Play-in Eliminatório Local
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <!-- Direct BYE Champion -->
              <div class="bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between">
                <div class="space-y-0.5">
                  <span class="text-[9px] font-black uppercase text-amber-400 tracking-wider block">
                    1º Colocado (Campeão de Conferência)
                  </span>
                  <div class="flex items-center gap-2">
                    {#if currentConf1st}
                      <TeamBadge teamId={currentConf1st.clube} size="w-5 h-5" />
                      <div>
                        <span class="font-bold text-xs text-white">{currentConf1st.nome || currentConf1st.clube?.split('/')[0]}</span>
                        <span class="text-[9px] text-slate-400 block font-mono">{currentConf1st.pts} pts</span>
                      </div>
                    {:else}
                      <span class="text-slate-400 italic text-[11px]">Aguardando término dos grupos</span>
                    {/if}
                  </div>
                </div>
                <span class="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                  Vaga Direta (BYE)
                </span>
              </div>

              <!-- Rule Explanation -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-center text-slate-300 text-[11px] leading-relaxed">
                <span>
                  <strong>Regulamento G-5:</strong> Clubes de 2º ao 5º lugar duelam em jogo único nesta conferência (2º x 5º e 3º x 4º). O vencedor da final local obtém a segunda vaga regional nas Quartas Nacionais.
                </span>
              </div>
            </div>
          </div>

          <!-- Play-in Matches Grid -->
          {#if currentPlayinC}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              
              <!-- Semi 1 (2º x 5º) -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm">
                <div class="flex items-center justify-between text-[10px] font-bold text-purple-300 border-b border-slate-800 pb-1">
                  <span>Semi Local 1 (2º × 5º)</span>
                  <span class="text-slate-500 font-mono">Jogo Único</span>
                </div>

                {#if semi1}
                  <div class="space-y-1 text-xs">
                    <div class={`flex items-center justify-between p-1 rounded-md ${isPlayinSemisDone && semi1.vencedor === semi1.time_1 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                      <div class="flex items-center gap-1.5 truncate">
                        <TeamBadge teamId={semi1.time_1} size="w-4 h-4" />
                        <span class="truncate text-[11px]">{semi1.time_1.split('/')[0]}</span>
                      </div>
                      <span class="font-mono font-bold text-xs">{isPlayinSemisDone ? (semi1.jogo_unico?.mandante === semi1.time_1 ? semi1.jogo_unico.gols_m : semi1.jogo_unico?.gols_v) : '—'}</span>
                    </div>

                    <div class={`flex items-center justify-between p-1 rounded-md ${isPlayinSemisDone && semi1.vencedor === semi1.time_2 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                      <div class="flex items-center gap-1.5 truncate">
                        <TeamBadge teamId={semi1.time_2} size="w-4 h-4" />
                        <span class="truncate text-[11px]">{semi1.time_2.split('/')[0]}</span>
                      </div>
                      <span class="font-mono font-bold text-xs">{isPlayinSemisDone ? (semi1.jogo_unico?.mandante === semi1.time_2 ? semi1.jogo_unico.gols_m : semi1.jogo_unico?.gols_v) : '—'}</span>
                    </div>
                  </div>

                  {#if isPlayinSemisDone}
                    <div class="pt-1 border-t border-slate-800/80 text-[10px] text-emerald-400 font-bold flex justify-between items-center">
                      <span>Classificado:</span>
                      <span class="flex items-center gap-1">
                        {semi1.vencedor.split('/')[0]}
                        {#if isSingleMatchPen(semi1)}
                          <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 leading-none">(pen)</span>
                        {/if}
                      </span>
                    </div>
                  {:else}
                    <div class="pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 italic text-center">
                      A Realizar
                    </div>
                  {/if}
                {/if}
              </div>

              <!-- Semi 2 (3º x 4º) -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm">
                <div class="flex items-center justify-between text-[10px] font-bold text-purple-300 border-b border-slate-800 pb-1">
                  <span>Semi Local 2 (3º × 4º)</span>
                  <span class="text-slate-500 font-mono">Jogo Único</span>
                </div>

                {#if semi2}
                  <div class="space-y-1 text-xs">
                    <div class={`flex items-center justify-between p-1 rounded-md ${isPlayinSemisDone && semi2.vencedor === semi2.time_1 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                      <div class="flex items-center gap-1.5 truncate">
                        <TeamBadge teamId={semi2.time_1} size="w-4 h-4" />
                        <span class="truncate text-[11px]">{semi2.time_1.split('/')[0]}</span>
                      </div>
                      <span class="font-mono font-bold text-xs">{isPlayinSemisDone ? (semi2.jogo_unico?.mandante === semi2.time_1 ? semi2.jogo_unico.gols_m : semi2.jogo_unico?.gols_v) : '—'}</span>
                    </div>

                    <div class={`flex items-center justify-between p-1 rounded-md ${isPlayinSemisDone && semi2.vencedor === semi2.time_2 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                      <div class="flex items-center gap-1.5 truncate">
                        <TeamBadge teamId={semi2.time_2} size="w-4 h-4" />
                        <span class="truncate text-[11px]">{semi2.time_2.split('/')[0]}</span>
                      </div>
                      <span class="font-mono font-bold text-xs">{isPlayinSemisDone ? (semi2.jogo_unico?.mandante === semi2.time_2 ? semi2.jogo_unico.gols_m : semi2.jogo_unico?.gols_v) : '—'}</span>
                    </div>
                  </div>

                  {#if isPlayinSemisDone}
                    <div class="pt-1 border-t border-slate-800/80 text-[10px] text-emerald-400 font-bold flex justify-between items-center">
                      <span>Classificado:</span>
                      <span class="flex items-center gap-1">
                        {semi2.vencedor.split('/')[0]}
                        {#if isSingleMatchPen(semi2)}
                          <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 leading-none">(pen)</span>
                        {/if}
                      </span>
                    </div>
                  {:else}
                    <div class="pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 italic text-center">
                      A Realizar
                    </div>
                  {/if}
                {/if}
              </div>

              <!-- Final Local (No Spoilers Before Semis) -->
              <div class="bg-slate-950 border border-purple-500/40 rounded-xl p-3 space-y-2 shadow-sm">
                <div class="flex items-center justify-between text-[10px] font-bold text-amber-300 border-b border-purple-500/20 pb-1">
                  <span>Final da Conferência</span>
                  <span class="text-emerald-400 font-bold">Vaga no N8</span>
                </div>

                {#if playinFin}
                  <div class="space-y-1 text-xs">
                    <!-- Finalist 1 -->
                    <div class={`flex items-center justify-between p-1 rounded-md ${isPlayinFinalDone && playinFin.vencedor === playinFin.time_1 ? 'bg-emerald-950/50 text-white font-bold' : 'text-slate-300'}`}>
                      <div class="flex items-center gap-1.5 truncate">
                        {#if isPlayinSemisDone}
                          <TeamBadge teamId={playinFin.time_1} size="w-4 h-4" />
                          <span class="truncate text-[11px]">{playinFin.time_1.split('/')[0]}</span>
                        {:else}
                          <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                          <span class="truncate text-slate-500 italic text-[10px]">Vencedor Semi 1</span>
                        {/if}
                      </div>
                      <span class="font-mono font-bold text-xs">{isPlayinFinalDone ? (playinFin.jogo_unico?.mandante === playinFin.time_1 ? playinFin.jogo_unico.gols_m : playinFin.jogo_unico?.gols_v) : '—'}</span>
                    </div>

                    <!-- Finalist 2 -->
                    <div class={`flex items-center justify-between p-1 rounded-md ${isPlayinFinalDone && playinFin.vencedor === playinFin.time_2 ? 'bg-emerald-950/50 text-white font-bold' : 'text-slate-300'}`}>
                      <div class="flex items-center gap-1.5 truncate">
                        {#if isPlayinSemisDone}
                          <TeamBadge teamId={playinFin.time_2} size="w-4 h-4" />
                          <span class="truncate text-[11px]">{playinFin.time_2.split('/')[0]}</span>
                        {:else}
                          <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                          <span class="truncate text-slate-500 italic text-[10px]">Vencedor Semi 2</span>
                        {/if}
                      </div>
                      <span class="font-mono font-bold text-xs">{isPlayinFinalDone ? (playinFin.jogo_unico?.mandante === playinFin.time_2 ? playinFin.jogo_unico.gols_m : playinFin.jogo_unico?.gols_v) : '—'}</span>
                    </div>
                  </div>

                  {#if isPlayinFinalDone}
                    <div class="pt-1.5 border-t border-purple-500/30 flex items-center justify-between text-[11px]">
                      <span class="text-amber-300 font-bold">Classificado:</span>
                      <span class="font-black text-emerald-400 flex items-center gap-1">
                        {playinFin.vencedor?.split('/')[0]}
                        {#if isSingleMatchPen(playinFin)}
                          <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 leading-none">(pen)</span>
                        {/if}
                      </span>
                    </div>
                  {:else}
                    <div class="pt-1.5 border-t border-purple-500/30 text-[10px] text-slate-500 italic text-center">
                      Aguardando Semifinais
                    </div>
                  {/if}
                {/if}
              </div>

            </div>
          {/if}

        </div>

      {:else}
        <!-- VIEW C2: NACIONAL DOS 8 & GRANDE FINAL -->
        <div class="space-y-6">
          
          <!-- 1. Quartas de Final: Jogos do Acesso à Série B -->
          <div class="space-y-2.5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <h4 class="font-black text-xs text-white uppercase tracking-wider">
                  Nacional dos 8 (Quartas de Final • Ida e Volta)
                </h4>
              </div>
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                Os 4 vencedores ascendem à Série B
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {#each ($currentPlayoffs.quartas_n8 || []) as match, i}
                {@const isWinner1 = isQuartasDone && match.vencedor === match.time_1}
                {@const isWinner2 = isQuartasDone && match.vencedor === match.time_2}

                <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-sm">
                  <div class="text-[9px] font-bold uppercase text-slate-400 flex items-center justify-between border-b border-slate-800/60 pb-1">
                    <span>Confronto {i + 1}</span>
                    <span class="text-emerald-400 font-bold">Vale Vaga Série B</span>
                  </div>

                  <!-- Team 1 -->
                  <div class={`flex items-center justify-between p-1.5 rounded-md ${isWinner1 ? 'bg-emerald-950/50 border border-emerald-800/80 text-white font-bold' : 'text-slate-300'}`}>
                    <div class="flex items-center gap-1.5 truncate">
                      <TeamBadge teamId={match.time_1} size="w-4 h-4" />
                      <span class="text-xs truncate">{match.time_1.split('/')[0]}</span>
                    </div>
                    {#if isWinner1}
                      <span class="flex items-center gap-1">
                        {#if isTwoLeggedPen(match)}
                          <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-700/60 leading-none">(pen)</span>
                        {/if}
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">SUBIU B</span>
                      </span>
                    {/if}
                  </div>

                  <!-- Team 2 -->
                  <div class={`flex items-center justify-between p-1.5 rounded-md ${isWinner2 ? 'bg-emerald-950/50 border border-emerald-800/80 text-white font-bold' : 'text-slate-300'}`}>
                    <div class="flex items-center gap-1.5 truncate">
                      <TeamBadge teamId={match.time_2} size="w-4 h-4" />
                      <span class="text-xs truncate">{match.time_2.split('/')[0]}</span>
                    </div>
                    {#if isWinner2}
                      <span class="flex items-center gap-1">
                        {#if isTwoLeggedPen(match)}
                          <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-700/60 leading-none">(pen)</span>
                        {/if}
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">SUBIU B</span>
                      </span>
                    {/if}
                  </div>

                  <div class="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    {#if isQuartasDone}
                      <span>Ida: {match.jogo_ida?.gols_m}×{match.jogo_ida?.gols_v}</span>
                      <span>Volta: {match.jogo_volta?.gols_m}×{match.jogo_volta?.gols_v}</span>
                    {:else}
                      <span class="italic text-slate-500">A Realizar</span>
                      <span class="text-slate-500 font-mono">Ida e Volta</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- 2. Semifinais & Grande Final -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
            
            <!-- Semifinais -->
            <div class="lg:col-span-6 space-y-2.5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                <h4 class="font-black text-xs text-white uppercase tracking-wider">
                  Semifinais Nacionais (Ida e Volta)
                </h4>
              </div>

              <div class="space-y-2.5">
                {#each ($currentPlayoffs.semifinais_n8 || []) as semi, i}
                  <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm">
                    <div class="text-[9px] font-bold text-slate-400 flex justify-between border-b border-slate-800/60 pb-1">
                      <span>Semifinal {i + 1}</span>
                      <span class="text-indigo-400 font-bold">Rumo à Final</span>
                    </div>

                    <div class="space-y-1 text-xs">
                      <!-- Semi Team 1 -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 truncate">
                          {#if isQuartasDone}
                            <TeamBadge teamId={semi.time_1} size="w-4 h-4" />
                            <span class="truncate font-bold text-white text-[11px]">{semi.time_1.split('/')[0]}</span>
                          {:else}
                            <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                            <span class="truncate text-slate-500 italic text-[10px]">Vencedor Q{2*i + 1}</span>
                          {/if}
                        </div>
                      </div>

                      <!-- Semi Team 2 -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 truncate">
                          {#if isQuartasDone}
                            <TeamBadge teamId={semi.time_2} size="w-4 h-4" />
                            <span class="truncate font-bold text-white text-[11px]">{semi.time_2.split('/')[0]}</span>
                          {:else}
                            <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                            <span class="truncate text-slate-500 italic text-[10px]">Vencedor Q{2*i + 2}</span>
                          {/if}
                        </div>
                      </div>
                    </div>

                    <div class="pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60 flex justify-between items-center">
                      {#if isSemisDone}
                        <span>Ida: {semi.jogo_ida?.gols_m}×{semi.jogo_ida?.gols_v} | Volta: {semi.jogo_volta?.gols_m}×{semi.jogo_volta?.gols_v}</span>
                        <span class="text-emerald-400 font-bold flex items-center gap-1">
                          {semi.vencedor?.split('/')[0]}
                          {#if isTwoLeggedPen(semi)}
                            <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 leading-none">(pen)</span>
                          {/if}
                        </span>
                      {:else}
                        <span class="text-slate-500 italic">Aguardando Quartas</span>
                        <span>Ida e Volta</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Grande Final Nacional -->
            <div class="lg:col-span-6 space-y-2.5">
              <div class="flex items-center gap-2">
                <Trophy class="w-3.5 h-3.5 text-amber-400" />
                <h4 class="font-black text-xs text-white uppercase tracking-wider">
                  Grande Final da Série C
                </h4>
              </div>

              {#if $currentPlayoffs.final}
                {@const fin = $currentPlayoffs.final}
                <div class="bg-slate-950 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                  <div class="flex items-center justify-between text-xs border-b border-amber-500/20 pb-1.5">
                    <span class="font-black text-amber-300 text-[11px]">DISPUTA DO TÍTULO NACIONAL</span>
                    <span class="font-mono text-[10px] text-slate-400">
                      {isFinalDone ? `Ida: ${fin.jogo_ida?.gols_m}×${fin.jogo_ida?.gols_v} • Volta: ${fin.jogo_volta?.gols_m}×${fin.jogo_volta?.gols_v}` : 'Ida e Volta'}
                    </span>
                  </div>

                  {#if isFinalDone}
                    <!-- Crowned Champion Box -->
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div class="flex items-center gap-2.5">
                        <TeamBadge teamId={fin.campeao || fin.vencedor} size="w-7 h-7" />
                        <div>
                          <span class="text-[9px] font-black uppercase text-amber-400 tracking-wider block">CAMPEÃO NACIONAL DA SÉRIE C</span>
                          <span class="text-sm font-black text-white flex items-center gap-1.5">
                            {(fin.campeao || fin.vencedor)?.split('/')[0]}
                            {#if isTwoLeggedPen(fin)}
                              <span class="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60 leading-none">(pen)</span>
                            {/if}
                          </span>
                        </div>
                      </div>
                      <span class="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60">
                        Ouro
                      </span>
                    </div>

                    {#if fin.vice}
                      <div class="flex items-center justify-between text-[11px] text-slate-300 px-1 pt-1">
                        <span class="text-slate-400">Vice-Campeão:</span>
                        <div class="flex items-center gap-1.5 font-bold">
                          <TeamBadge teamId={fin.vice} size="w-3.5 h-3.5" />
                          <span>{fin.vice.split('/')[0]}</span>
                        </div>
                      </div>
                    {/if}
                  {:else}
                    <div class="py-4 text-center space-y-1">
                      <Trophy class="w-6 h-6 text-amber-400/40 mx-auto" />
                      <span class="text-[11px] font-bold text-slate-300 block">Troféu em Disputa</span>
                      <span class="text-[10px] text-slate-500 block">
                        {#if isSemisDone}
                          {fin.time_1?.split('/')[0]} × {fin.time_2?.split('/')[0]} (A Realizar)
                        {:else}
                          Confronto a definir após as semifinais
                        {/if}
                      </span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

          </div>

        </div>
      {/if}

    </div>

  {:else}

    <!-- ================================================================= -->
    <!-- SÉRIE D: MATA-MATAS REGIONAIS (OITAVAS -> QUARTAS -> SEMIFINAIS)  -->
    <!-- ================================================================= -->
    <div class="space-y-4">
      
      <!-- Macro Region Status Bar (selection controlled via top header) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 px-1">Macrorregião:</span>
          <span class="text-xs font-black text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
            {CONFERENCE_COLORS[selectedMacroD]?.name || selectedMacroD}
          </span>
        </div>
        <span class="text-[11px] text-slate-400 font-medium px-1">
          16 clubes disputam 2 vagas regionais de acesso à Série C
        </span>
      </div>

      <!-- Macro Explainer Banner -->
      <div class="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 space-y-1">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-indigo-500/20 pb-1.5">
          <span class="text-xs font-bold uppercase text-indigo-300">
            Mata-mata Regional • {CONFERENCE_COLORS[selectedMacroD]?.name || selectedMacroD} (16 Clubes)
          </span>
          <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Os 2 vencedores das semifinais sobem para a Série C
          </span>
        </div>
        <p class="text-[11px] text-slate-300 leading-relaxed">
          Confrontos eliminatórios estruturados por proximidade geográfica na macrorregião. As semifinais decidem os 2 acessos à Série C.
        </p>
      </div>

      {#if !currentMacroD}
        <div class="p-6 text-center text-slate-400 text-xs">
          Mata-mata não encontrado para a macrorregião {selectedMacroD}.
        </div>
      {:else}
        
        <!-- 1. Semifinais Regionais (O Jogo do Acesso à Série C) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="font-black text-xs text-white uppercase tracking-wider">
              Semifinais Regionais — Decisão do Acesso à Série C (Ida e Volta)
            </h4>
            <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              2 Vagas na Série C
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each (currentMacroD.semifinais || []) as semi, i}
              {@const isWinner1 = isQuartasDone && semi.vencedor === semi.time_1}
              {@const isWinner2 = isQuartasDone && semi.vencedor === semi.time_2}

              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm">
                <div class="text-[10px] font-bold uppercase text-indigo-300 flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>Semifinal Regional {i + 1}</span>
                  <span class="text-emerald-400 font-bold">Vale Vaga Série C</span>
                </div>

                <!-- Team 1 -->
                <div class={`flex items-center justify-between p-1 rounded-md ${isWinner1 ? 'bg-emerald-950/50 border border-emerald-800/80 text-white font-bold' : 'text-slate-300'}`}>
                  <div class="flex items-center gap-1.5 truncate flex-1">
                    {#if isPlayinFinalDone}
                      <TeamBadge teamId={semi.time_1} size="w-4 h-4" />
                      <span class="text-xs truncate">{semi.time_1.split('/')[0]}</span>
                    {:else}
                      <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                      <span class="text-slate-500 italic text-[10px]">Vencedor Quartas {2*i + 1}</span>
                    {/if}
                  </div>
                  {#if isWinner1}
                    <span class="flex items-center gap-1 ml-1">
                      {#if isTwoLeggedPen(semi)}
                        <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-700/60 leading-none">(pen)</span>
                      {/if}
                      <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">SUBIU C</span>
                    </span>
                  {/if}
                </div>

                <!-- Team 2 -->
                <div class={`flex items-center justify-between p-1 rounded-md ${isWinner2 ? 'bg-emerald-950/50 border border-emerald-800/80 text-white font-bold' : 'text-slate-300'}`}>
                  <div class="flex items-center gap-1.5 truncate flex-1">
                    {#if isPlayinFinalDone}
                      <TeamBadge teamId={semi.time_2} size="w-4 h-4" />
                      <span class="text-xs truncate">{semi.time_2.split('/')[0]}</span>
                    {:else}
                      <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                      <span class="text-slate-500 italic text-[10px]">Vencedor Quartas {2*i + 2}</span>
                    {/if}
                  </div>
                  {#if isWinner2}
                    <span class="flex items-center gap-1 ml-1">
                      {#if isTwoLeggedPen(semi)}
                        <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-700/60 leading-none">(pen)</span>
                      {/if}
                      <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">SUBIU C</span>
                    </span>
                  {/if}
                </div>

                <div class="pt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                  {#if isQuartasDone}
                    <span>Ida: {semi.jogo_ida?.gols_m}×{semi.jogo_ida?.gols_v}</span>
                    <span>Volta: {semi.jogo_volta?.gols_m}×{semi.jogo_volta?.gols_v}</span>
                  {:else}
                    <span class="italic text-slate-500">Aguardando Quartas</span>
                    <span>Ida e Volta</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- 2. Quartas de Final Regionais (4 Jogos • JOGO ÚNICO) -->
        <div class="space-y-2 pt-1">
          <h4 class="font-black text-xs text-white uppercase tracking-wider">
            Quartas de Final Regionais ({CONFERENCE_COLORS[selectedMacroD]?.name || selectedMacroD} • Jogo Único)
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {#each (currentMacroD.quartas || []) as q, i}
              {@const isWinner1 = isPlayinFinalDone && q.vencedor === q.time_1}
              {@const isWinner2 = isPlayinFinalDone && q.vencedor === q.time_2}

              <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-sm">
                <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 border-b border-slate-800/60 pb-1">
                  <span>Quartas {i + 1}</span>
                  <span class="text-slate-500 font-mono">Jogo Único</span>
                </div>
                <div class="space-y-1">
                  <!-- Team 1 -->
                  <div class={`flex items-center justify-between p-1 rounded-md ${isWinner1 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                    <div class="flex items-center gap-1.5 truncate flex-1">
                      {#if isPlayinSemisDone}
                        <TeamBadge teamId={q.time_1} size="w-4 h-4" />
                        <span class="truncate text-[11px]">{q.time_1.split('/')[0]}</span>
                      {:else}
                        <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                        <span class="truncate text-slate-500 italic text-[10px]">Vencedor Oitavas {2*i + 1}</span>
                      {/if}
                    </div>
                    <span class="font-mono font-bold text-xs">
                      {isPlayinFinalDone ? getSingleMatchGoals(q, q.time_1) : '—'}
                    </span>
                  </div>
                  <!-- Team 2 -->
                  <div class={`flex items-center justify-between p-1 rounded-md ${isWinner2 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                    <div class="flex items-center gap-1.5 truncate flex-1">
                      {#if isPlayinSemisDone}
                        <TeamBadge teamId={q.time_2} size="w-4 h-4" />
                        <span class="truncate text-[11px]">{q.time_2.split('/')[0]}</span>
                      {:else}
                        <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500">?</div>
                        <span class="truncate text-slate-500 italic text-[10px]">Vencedor Oitavas {2*i + 2}</span>
                      {/if}
                    </div>
                    <span class="font-mono font-bold text-xs">
                      {isPlayinFinalDone ? getSingleMatchGoals(q, q.time_2) : '—'}
                    </span>
                  </div>
                </div>

                {#if isPlayinFinalDone}
                  <div class="text-[10px] text-emerald-400 font-bold border-t border-slate-800/60 pt-1 flex justify-between items-center">
                    <span>Avançou:</span>
                    <span class="flex items-center gap-1">
                      {q.vencedor.split('/')[0]}
                      {#if isSingleMatchPen(q)}
                        <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 leading-none">(pen)</span>
                      {/if}
                    </span>
                  </div>
                {:else}
                  <div class="text-[9px] text-slate-500 italic border-t border-slate-800/60 pt-1 text-center">
                    Aguardando Oitavas
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- 3. Oitavas de Final Regionais (8 Jogos • JOGO ÚNICO) -->
        <div class="space-y-2 pt-1">
          <h4 class="font-black text-xs text-slate-300 uppercase tracking-wider">
            Oitavas de Final Regionais (16 Clubes • Jogo Único • Pareamento Territorial)
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {#each (currentMacroD.oitavas || []) as o, i}
              {@const isWinner1 = isPlayinSemisDone && o.vencedor === o.time_1}
              {@const isWinner2 = isPlayinSemisDone && o.vencedor === o.time_2}

              <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5 shadow-sm">
                <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 border-b border-slate-800/60 pb-1">
                  <span>Oitavas {i + 1}</span>
                  <span class="text-slate-500 font-mono">Jogo Único</span>
                </div>
                <div class="space-y-1">
                  <div class={`flex items-center justify-between p-1 rounded-md ${isWinner1 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                    <div class="flex items-center gap-1.5 truncate flex-1">
                      <TeamBadge teamId={o.time_1} size="w-3.5 h-3.5" />
                      <span class="truncate text-[10px]">{o.time_1.split('/')[0]}</span>
                    </div>
                    <span class="font-mono font-bold text-xs">
                      {isPlayinSemisDone ? getSingleMatchGoals(o, o.time_1) : '—'}
                    </span>
                  </div>
                  <div class={`flex items-center justify-between p-1 rounded-md ${isWinner2 ? 'bg-emerald-950/40 text-white font-bold' : 'text-slate-300'}`}>
                    <div class="flex items-center gap-1.5 truncate flex-1">
                      <TeamBadge teamId={o.time_2} size="w-3.5 h-3.5" />
                      <span class="truncate text-[10px]">{o.time_2.split('/')[0]}</span>
                    </div>
                    <span class="font-mono font-bold text-xs">
                      {isPlayinSemisDone ? getSingleMatchGoals(o, o.time_2) : '—'}
                    </span>
                  </div>
                </div>

                {#if isPlayinSemisDone}
                  <div class="text-[9px] text-emerald-400 font-bold border-t border-slate-800/60 pt-1 flex justify-between items-center">
                    <span>Vencedor:</span>
                    <span class="flex items-center gap-1">
                      {o.vencedor.split('/')[0]}
                      {#if isSingleMatchPen(o)}
                        <span class="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 leading-none">(pen)</span>
                      {/if}
                    </span>
                  </div>
                {:else}
                  <div class="text-[9px] text-slate-500 italic border-t border-slate-800/60 pt-1 text-center">
                    A Realizar
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

      {/if}

    </div>

  {/if}

</div>
