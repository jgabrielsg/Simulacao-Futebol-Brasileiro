<script>
  import { onMount } from 'svelte';
  import { loadGameData, loading, error } from '$lib/stores/gameStore.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import DivisionBar from '$lib/components/DivisionBar.svelte';
  import LogisticsCards from '$lib/components/LogisticsCards.svelte';
  import LeagueTable from '$lib/components/LeagueTable.svelte';
  import Map from '$lib/components/Map.svelte';
  import SeasonSummaryModal from '$lib/components/SeasonSummaryModal.svelte';
  import ReclusteringWizard from '$lib/components/ReclusteringWizard.svelte';
  import OnboardingModal from '$lib/components/OnboardingModal.svelte';
  import { Loader2, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-svelte';

  let showOnboarding = false;

  onMount(() => {
    loadGameData();
  });

  function openHelp() {
    showOnboarding = true;
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950 relative">
  <Navbar />
  
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <DivisionBar />
    </div>
    <div class="pr-4 hidden sm:block">
      <button
        on:click={openHelp}
        class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-300 font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        title="Abrir Tutorial do Simulador"
      >
        <HelpCircle class="w-3.5 h-3.5 text-indigo-400" />
        Tutorial / Ajuda
      </button>
    </div>
  </div>

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
    {#if $loading}
      <!-- Loading State -->
      <div class="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Loader2 class="w-10 h-10 text-indigo-400 animate-spin" />
        <div class="text-center">
          <p class="text-lg font-bold text-white">Carregando Base de Dados Logística...</p>
          <p class="text-xs text-slate-400">Processando equipes, aeroportos hubs e malha de voos.</p>
        </div>
      </div>
    {:else if $error}
      <!-- Error State -->
      <div class="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 max-w-lg mx-auto my-12 text-center space-y-4">
        <AlertTriangle class="w-10 h-10 text-rose-400 mx-auto" />
        <div>
          <h3 class="text-lg font-bold text-rose-200">Erro de Inicialização</h3>
          <p class="text-sm text-slate-300 mt-1">{$error}</p>
        </div>
        <button
          on:click={loadGameData}
          class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2"
        >
          <RefreshCw class="w-4 h-4" /> Tentar Novamente
        </button>
      </div>
    {:else}
      <!-- Main Dashboard Interface -->
      <LogisticsCards />

      <!-- Main Dual Grid: Table & Map -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <!-- Left: Standings Table (5 Cols on LG) -->
        <div class="lg:col-span-5 w-full">
          <LeagueTable />
        </div>

        <!-- Right: Leaflet Interactive Map (7 Cols on LG) -->
        <div class="lg:col-span-7 w-full">
          <Map />
        </div>
      </div>
    {/if}
  </main>

  <!-- Season Review Transition Modal -->
  <SeasonSummaryModal />

  <!-- Fullscreen Didactic Reclustering Wizard (Hungarian LAP Algorithm) -->
  <ReclusteringWizard />

  <!-- First-time Visitor Onboarding Tutorial Modal -->
  <OnboardingModal bind:isOpen={showOnboarding} />
</div>
