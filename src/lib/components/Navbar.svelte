<script>
  import { currentSeason, advanceToNextSeason, simulateOneRound, simulateFullSeasonActive, loading, isSeasonComplete } from '$lib/stores/gameStore.js';
  import { Play, SkipForward, RefreshCw, Trophy, MapPin, Compass, BarChart3, BookOpen, LayoutDashboard, Home } from 'lucide-svelte';
  import { page } from '$app/stores';
</script>

<header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 text-slate-100">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
    
    <!-- Brand Logo / Title -->
    <a href="/" class="flex items-center gap-3 group shrink-0">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-950/40 group-hover:scale-105 transition-transform">
        <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
          <Compass class="w-4 h-4 text-indigo-400 group-hover:rotate-45 transition-transform" />
        </div>
      </div>
      <div>
        <h1 class="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
          LOGÍSTICA BRASILEIRÃO
          <span class="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            FGV TCC
          </span>
        </h1>
        <p class="text-[11px] text-slate-400 font-medium hidden sm:block">Reestruturação Logística & Calendário</p>
      </div>
    </a>

    <!-- Ordered Navigation Links: Início -> O Problema (Estudo de Caso) -> A Ciência (Metodologia) -> Simulador -->
    <nav class="hidden md:flex items-center gap-1 font-medium text-xs lg:text-sm">
      
      <!-- 1. Início -->
      <a
        href="/"
        class={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
          $page.url.pathname === '/' ? 'text-white font-bold bg-slate-800/80' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
        }`}
      >
        <Home class="w-3.5 h-3.5 text-indigo-400" />
        Início
      </a>

      <!-- 2. O Problema (Estudo de Caso) -->
      <a
        href="/estudo-de-caso"
        class={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
          $page.url.pathname.startsWith('/estudo-de-caso') ? 'text-white font-bold bg-slate-800/80' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
        }`}
      >
        <BarChart3 class="w-3.5 h-3.5 text-cyan-400" />
        <span>O Problema (Estudo de Caso)</span>
      </a>

      <!-- 3. A Ciência (Metodologia) -->
      <a
        href="/metodologia"
        class={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
          $page.url.pathname.startsWith('/metodologia') ? 'text-white font-bold bg-slate-800/80' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
        }`}
      >
        <BookOpen class="w-3.5 h-3.5 text-purple-400" />
        <span>A Ciência (Metodologia)</span>
      </a>

      <!-- 4. Simulador (Dashboard) - Prominent CTA Button Style -->
      <a
        href="/dashboard"
        class={`ml-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-md ${
          $page.url.pathname.startsWith('/dashboard')
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-indigo-950/60'
            : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40'
        }`}
      >
        <LayoutDashboard class="w-3.5 h-3.5" />
        <span>Simulador (Dashboard)</span>
      </a>
    </nav>

    <!-- Simulation Control Actions (Visible on Dashboard) -->
    <div class="flex items-center gap-2">
      {#if $page.url.pathname.startsWith('/dashboard')}
        <!-- Season Badge -->
        <div class="bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <Trophy class="w-3.5 h-3.5 text-amber-400" />
          <div class="text-[10px]">
            <span class="text-slate-400 block text-[8px] uppercase font-bold">Temporada</span>
            <span class="font-extrabold text-white text-xs">Ano {$currentSeason}</span>
          </div>
        </div>

        {#if !$loading}
          <button
            on:click={simulateOneRound}
            title="Simular 1 Rodada de TODAS as Divisões"
            class="bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Play class="w-3 h-3 fill-current" />
            <span class="hidden sm:inline">Simular Rodada</span>
          </button>

          <button
            on:click={simulateFullSeasonActive}
            title="Simular Ano Completo"
            class="bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <SkipForward class="w-3 h-3 fill-current" />
            <span class="hidden sm:inline">Simular Ano</span>
          </button>

          <button
            on:click={advanceToNextSeason}
            disabled={!$isSeasonComplete}
            title={$isSeasonComplete ? "Virar Temporada (Promoções, Rebaixamentos e Alocação Logística)" : "Finalize as rodadas para virar a temporada"}
            class="bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-none transition-all text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw class="w-3 h-3" />
            <span class="hidden xl:inline">Virar Ano</span>
          </button>
        {/if}
      {:else}
        <a
          href="/dashboard"
          class="md:hidden bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <LayoutDashboard class="w-3.5 h-3.5" />
          Simulador
        </a>
      {/if}
    </div>

  </div>
</header>
