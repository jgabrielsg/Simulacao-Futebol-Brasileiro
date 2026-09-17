<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import {
    loadInitialData,
    loading,
    loadingSeason,
    error,
    seasonStage,
    activeDashboardTab,
    currentSeasonNum,
    activeDivision,
    activeGroup,
    focusedTeamId,
    teamsDb,
    seasonDataStore,
    loadSeason,
    setDivision,
    showSocialShareModal
  } from '$lib/stores/gameStore.js';
  import { CONFERENCES_C, LEAGUES_BY_MACRO_D } from '$lib/utils/leagueNames.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import SeasonHeader from '$lib/components/SeasonHeader.svelte';
  import StickySimulatorHeader from '$lib/components/StickySimulatorHeader.svelte';
  import DivisionBar from '$lib/components/DivisionBar.svelte';
  import StageProgressBar from '$lib/components/StageProgressBar.svelte';
  import StageExplainerModal from '$lib/components/StageExplainerModal.svelte';
  import RoundPlayer from '$lib/components/RoundPlayer.svelte';
  import LeagueTable from '$lib/components/LeagueTable.svelte';
  import Map from '$lib/components/Map.svelte';
  import LeagueStatsCard from '$lib/components/LeagueStatsCard.svelte';
  import PlayoffsTree from '$lib/components/PlayoffsTree.svelte';
  import TransitionsPanel from '$lib/components/TransitionsPanel.svelte';
  import ReclusteringWizard from '$lib/components/ReclusteringWizard.svelte';
  import QuinquenniumSummaryModal from '$lib/components/QuinquenniumSummaryModal.svelte';
  import OnboardingModal from '$lib/components/OnboardingModal.svelte';
  import SocialShareCardModal from '$lib/components/SocialShareCardModal.svelte';
  import {
    Loader2,
    AlertTriangle,
    RefreshCw,
    HelpCircle,
    TableProperties,
    MapPin,
    Trophy,
    Shuffle,
    Lock
  } from 'lucide-svelte';

  const basePath = base ? base.replace(/\/$/, '') : '';

  let showOnboarding = false;
  let initializedFromUrl = false;
  let clubImpactDetails = {};
  let estadosMap = {};

  $: isPlayoffsUnlocked = $seasonStage !== 'grupos';
  $: isMercadoUnlocked = $seasonStage === 'concluida';

  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function cleanClubQuery(str) {
    return normalize(str)
      .replace(/\b(futebol clube|f\.c\.|fc|esporte clube|e\.c\.|ec|clube|atletico|associacao|desportiva|sociedade)\b/gi, '')
      .trim();
  }

  function findClubInSeason(query, sData, tDb) {
    if (!query || !sData || !tDb) return null;
    const rawQ = normalize(query);
    const cleanQ = cleanClubQuery(query);

    const teamList = Object.values(tDb);
    let match = teamList.find(t => normalize(t.nome) === rawQ || normalize(t.clube) === rawQ || t.id.toLowerCase() === rawQ);
    if (!match && cleanQ.length >= 3) {
      match = teamList.find(t => normalize(t.nome) === cleanQ || normalize(t.clube) === cleanQ);
    }
    if (!match) {
      match = teamList.find(t => normalize(t.nome).startsWith(rawQ) || normalize(t.clube).startsWith(rawQ));
    }
    if (!match && cleanQ.length >= 3) {
      match = teamList.find(t => normalize(t.nome).startsWith(cleanQ) || normalize(t.clube).startsWith(cleanQ));
    }
    if (!match) {
      match = teamList.find(t => normalize(t.nome).includes(rawQ) || normalize(t.clube).includes(rawQ));
    }

    if (!match) return null;
    const teamId = match.id;

    // Search in Serie C
    if (sData.serie_c?.conferencias) {
      for (const [conf, list] of Object.entries(sData.serie_c.conferencias)) {
        if (list.includes(teamId)) {
          return { teamId, team: match, division: 'serie_c', group: conf };
        }
      }
    }

    // Search in Serie D
    if (sData.serie_d?.ligas) {
      for (const [liga, list] of Object.entries(sData.serie_d.ligas)) {
        if (list.includes(teamId)) {
          return { teamId, team: match, division: 'serie_d', group: liga };
        }
      }
    }

    return { teamId, team: match, division: null, group: null };
  }

  onMount(async () => {
    await loadInitialData();

    // Load impact details & analytics asynchronously for Social Share Cards
    try {
      const [detailsRes, analyticsRes] = await Promise.all([
        fetch(`${basePath}/json/club_impact_details.json`),
        fetch(`${basePath}/json/pagerank_analytics.json`)
      ]);
      if (detailsRes.ok) clubImpactDetails = await detailsRes.json();
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        if (aData.estados) {
          aData.estados.forEach(st => { estadosMap[st.uf] = st; });
        }
      }
    } catch (e) {
      console.warn('Could not load club impact details for dashboard cards:', e);
    }

    // Read and apply URL query parameters (Task B: Deep Linking)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const temporadaParam = params.get('temporada');
      const divisaoParam = params.get('divisao');
      const grupoParam = params.get('grupo') || params.get('conferencia');
      const clubeParam = params.get('clube');

      const targetSeason = temporadaParam ? parseInt(temporadaParam) : 1;
      if (targetSeason >= 1 && targetSeason <= 5 && targetSeason !== $currentSeasonNum) {
        await loadSeason(targetSeason, false);
      }

      const sData = $seasonDataStore;
      const tDb = $teamsDb;

      if (clubeParam && sData && tDb) {
        const found = findClubInSeason(clubeParam, sData, tDb);
        if (found && found.division && found.group) {
          activeDivision.set(found.division);
          activeGroup.set(found.group);
          focusedTeamId.set(found.teamId);
        } else if (found) {
          focusedTeamId.set(found.teamId);
        }
      } else {
        if (divisaoParam) {
          const d = (divisaoParam === 'c' || divisaoParam === 'serie_c') ? 'serie_c' : 'serie_d';
          setDivision(d);
        }
        if (grupoParam) {
          const upperGroup = grupoParam.toUpperCase();
          if ($activeDivision === 'serie_c') {
            if (CONFERENCES_C.includes(upperGroup)) activeGroup.set(upperGroup);
          } else {
            const allDLeagues = Object.values(LEAGUES_BY_MACRO_D).flat();
            if (allDLeagues.includes(upperGroup)) activeGroup.set(upperGroup);
          }
        }
      }

      initializedFromUrl = true;
    }
  });

  // Reactive URL synchronizer to maintain shareable state
  $: if (typeof window !== 'undefined' && initializedFromUrl && !$loading) {
    const url = new URL(window.location.href);
    url.searchParams.set('temporada', String($currentSeasonNum));
    url.searchParams.set('divisao', $activeDivision);
    url.searchParams.set('grupo', $activeGroup);
    if ($focusedTeamId) {
      const teamObj = $teamsDb?.[$focusedTeamId];
      url.searchParams.set('clube', teamObj?.nome || $focusedTeamId.split('/')[0]);
    } else {
      url.searchParams.delete('clube');
    }
    window.history.replaceState({}, '', url.toString());
  }

  // Reactive club object for focused team card generation
  $: currentFocusedClubObj = (() => {
    if (!$focusedTeamId || !$teamsDb) return null;
    const t = $teamsDb[$focusedTeamId];
    if (!t) return null;
    return {
      name: t.nome || t.clube,
      uf: t.uf,
      divisao: $activeDivision === 'serie_c' ? 'Série C' : 'Série D',
      liga: $activeGroup,
      cidade: t.cidade,
      estadio: t.estadio,
      rank: t.rank || null,
      score: t.pagerank || null,
      teamId: $focusedTeamId,
      estadoSlug: t.estado_slug,
      estadoNome: t.estado || t.uf
    };
  })();

  $: currentFocusedClubDetails = ($focusedTeamId && clubImpactDetails) ? clubImpactDetails[$focusedTeamId] : null;

  function openHelp() {
    showOnboarding = true;
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950 relative">
  <Navbar />
  <StickySimulatorHeader />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    {#if $loading}
      <!-- Global Loading State -->
      <div class="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 class="w-12 h-12 text-indigo-400 animate-spin" />
        <div class="text-center space-y-1">
          <p class="text-xl font-black text-white">Carregando Simulador da Nova Pirâmide...</p>
          <p class="text-xs text-slate-400">Inicializando 876 clubes e o motor determinístico do quinquênio (5 temporadas).</p>
        </div>
      </div>
    {:else if $error}
      <!-- Error State -->
      <div class="bg-rose-950/40 border border-rose-800 rounded-2xl p-8 max-w-lg mx-auto my-12 text-center space-y-4 shadow-2xl">
        <AlertTriangle class="w-12 h-12 text-rose-400 mx-auto" />
        <div>
          <h3 class="text-xl font-black text-rose-200">Falha ao Carregar Dados</h3>
          <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">{$error}</p>
        </div>
        <button
          on:click={loadInitialData}
          class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/80"
        >
          <RefreshCw class="w-4 h-4" /> Recarregar Simulador
        </button>
      </div>
    {:else}
      <!-- 1. Top Season Picker & Financial KPIs -->
      <SeasonHeader />

      <!-- 2. The 3-Stages Interactive Simulation Progress Bar -->
      <StageProgressBar />

      <!-- 3. Navigation Tabs Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          
          <!-- Tab 1: Classificação & Mapa Lado a Lado -->
          <button
            on:click={() => activeDashboardTab.set('classificacao_rodadas')}
            class={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              $activeDashboardTab === 'classificacao_rodadas'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/80'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <TableProperties class="w-4 h-4" />
            Classificação & Mapa
          </button>

          <!-- Tab 2: Playoffs & Acessos -->
          <button
            on:click={() => {
              if (isPlayoffsUnlocked) activeDashboardTab.set('playoffs');
            }}
            disabled={!isPlayoffsUnlocked}
            class={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              !isPlayoffsUnlocked
                ? 'bg-slate-950/60 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-50'
                : $activeDashboardTab === 'playoffs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/80 cursor-pointer'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 cursor-pointer'
            }`}
            title={isPlayoffsUnlocked ? 'Visualizar chaveamentos e confrontos eliminatórios' : 'Bloqueado: conclua todas as rodadas da fase de grupos para liberar os playoffs'}
          >
            {#if !isPlayoffsUnlocked}
              <Lock class="w-3.5 h-3.5 text-slate-600" />
            {:else}
              <Trophy class="w-4 h-4" />
            {/if}
            <span>Playoffs & Acessos</span>
          </button>

          <!-- Tab 3: Mercado & Transições -->
          <button
            on:click={() => {
              if (isMercadoUnlocked) activeDashboardTab.set('transicoes');
            }}
            disabled={!isMercadoUnlocked}
            class={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              !isMercadoUnlocked
                ? 'bg-slate-950/60 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-50'
                : $activeDashboardTab === 'transicoes'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/80 cursor-pointer'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 cursor-pointer'
            }`}
            title={isMercadoUnlocked ? 'Visualizar balanço da pirâmide e transferências de conferência' : 'Bloqueado: disponível após o término dos playoffs e encerramento da temporada'}
          >
            {#if !isMercadoUnlocked}
              <Lock class="w-3.5 h-3.5 text-slate-600" />
            {:else}
              <Shuffle class="w-4 h-4" />
            {/if}
            <span>Mercado & Iso-Ligas</span>
          </button>

        </div>

        <!-- Help / Tutorial Button -->
        <button
          on:click={openHelp}
          class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto shadow-sm"
          title="Abrir Tutorial do Simulador"
        >
          <HelpCircle class="w-4 h-4 text-indigo-400" />
          Como Funciona
        </button>
      </div>

      <!-- 4. Dynamic Tab View -->
      {#if $activeDashboardTab === 'classificacao_rodadas'}
        
        <!-- Regional League Strip (only active during Serie D group stage) -->
        <DivisionBar />

        <!-- Classic Side-by-Side View: Standings (Left) + Leaflet Map with Team Focus (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-6 w-full space-y-6">
            <LeagueTable />
            <RoundPlayer />
          </div>

          <div class="lg:col-span-6 w-full space-y-6">
            <Map />
            <LeagueStatsCard />
          </div>
        </div>

      {:else if $activeDashboardTab === 'playoffs'}

        <!-- Playoffs & Knockout Brackets View -->
        <div class="space-y-6">
          <PlayoffsTree />
        </div>

      {:else if $activeDashboardTab === 'transicoes'}

        <!-- Annual Transitions & Iso-Leagues Panel -->
        <TransitionsPanel />

      {/if}

    {/if}
  </main>

  <!-- Contextual Stage Explainer Modal -->
  <StageExplainerModal />

  <!-- Animated End-of-Season Leaflet Reclustering Wizard -->
  <ReclusteringWizard />

  <!-- 5-Year Quinquennium Summary Modal -->
  <QuinquenniumSummaryModal />

  <!-- Onboarding Guide Modal -->
  <OnboardingModal bind:isOpen={showOnboarding} />

  <!-- Focused Club Social Share Card Modal -->
  {#if currentFocusedClubObj}
    <SocialShareCardModal
      bind:isOpen={$showSocialShareModal}
      club={currentFocusedClubObj}
      details={currentFocusedClubDetails}
      {estadosMap}
    />
  {/if}
</div>
