<script>
  import { currentSeason, advanceToNextSeason, simulateOneRound, simulateFullSeasonActive, loading, isSeasonComplete } from '$lib/stores/gameStore.js';
  import { Play, SkipForward, RefreshCw, Trophy, MapPin, Compass, BarChart3 } from 'lucide-svelte';
</script>

<header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 text-slate-100">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <!-- Brand Logo / Title -->
    <a href="/" class="flex items-center gap-3 group">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
        <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
          <Compass class="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform" />
        </div>
      </div>
      <div>
        <h1 class="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
          LOGÍSTICA BRASILEIRÃO
          <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            FGV TCC
          </span>
        </h1>
        <p class="text-xs text-slate-400 font-medium">Otimização de Ligas & Algoritmo de Clusters</p>
      </div>
    </a>

    <!-- Navigation Links -->
    <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
      <a href="/" class="hover:text-emerald-400 transition-colors">Apresentação</a>
      <a href="/dashboard" class="hover:text-emerald-400 text-slate-300 flex items-center gap-1.5 font-medium transition-colors">
        <MapPin class="w-4 h-4 text-emerald-400" />
        Simulador Dashboard
      </a>
      <a href="/estudo-de-caso" class="text-cyan-400 font-semibold flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
        <BarChart3 class="w-4 h-4 text-cyan-400" />
        Estudo de Caso (CBF vs. Proposto)
      </a>
    </nav>

    <!-- Simulation Control Actions & Season Counter -->
    <div class="flex items-center gap-3">
      <!-- Season Badge -->
      <div class="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
        <Trophy class="w-4 h-4 text-amber-400" />
        <div class="text-xs">
          <span class="text-slate-400 block text-[9px] uppercase font-bold">Temporada</span>
          <span class="font-extrabold text-white text-sm">Ano {$currentSeason}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      {#if !$loading}
        <button
          on:click={simulateOneRound}
          title="Simular 1 Rodada de TODAS as Divisões e Regiões"
          class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span class="hidden sm:inline">Simular Rodada</span>
        </button>

        <button
          on:click={simulateFullSeasonActive}
          title="Simular Todas as Rodadas Restantes do Brasil Inteiro"
          class="bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer"
        >
          <SkipForward class="w-3.5 h-3.5 fill-current" />
          <span class="hidden sm:inline">Simular Ano</span>
        </button>

        <button
          on:click={advanceToNextSeason}
          disabled={!$isSeasonComplete}
          title={$isSeasonComplete ? "Virar Temporada (Acessos, Rebaixamentos & Re-clusterização)" : "Finalize todas as rodadas de todas as ligas para virar a temporada"}
          class="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 shadow-none transition-all text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span class="hidden lg:inline">Virar Temporada</span>
        </button>
      {/if}
    </div>
  </div>
</header>
