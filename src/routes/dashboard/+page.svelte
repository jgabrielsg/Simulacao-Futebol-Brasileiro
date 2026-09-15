<script>
  import { onMount } from 'svelte';
  import {
    loadInitialData,
    loading,
    loadingSeason,
    error,
    seasonStage,
    activeDashboardTab,
    currentSeasonNum
  } from '$lib/stores/gameStore.js';
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

  let showOnboarding = false;

  $: isPlayoffsUnlocked = $seasonStage !== 'grupos';
  $: isMercadoUnlocked = $seasonStage === 'concluida';

  onMount(() => {
    loadInitialData();
  });

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
</div>
