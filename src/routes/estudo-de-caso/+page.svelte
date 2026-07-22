<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { base } from '$app/paths';
  import 'leaflet/dist/leaflet.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import TeamBadge from '$lib/components/TeamBadge.svelte';
  import {
    BarChart3, TrendingDown, DollarSign, Bus, Plane, ArrowLeft,
    Search, Sliders, Shield, MapPin, Loader2, Sparkles,
    Layers, Calculator, Compass, ChevronRight, ChevronDown, ChevronUp,
    Info, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle
  } from 'lucide-svelte';

  let L;
  let loadingData = true;
  let errorMsg = null;
  let rawData = {};
  let teamKeysList = [];

  // Navigation / Selection State
  let selectedTeamKey = null;
  let searchQuery = '';

  // Progressive Disclosure State for Premises (Collapsed by default)
  let showPremisesAccordion = false;

  // Table Sorting State
  let sortKey = 'costAvgSaved'; // default sort by Economia Média por Jogo
  let sortDirection = 'desc';   // 'asc' or 'desc'

  // Delegation Size Constant (CBF Standard for Flights)
  const DELEGATION_N = 30; // 30 pessoas por delegação

  // Financial Premises (Affine Functions for Flight & Bus Charter)
  let flightFixedFee = 45.00;        // f_aereo: R$ 45,00 por bilhete
  let flightVarPerKm = 0.40;         // c_aereo: R$ 0,40 por Km aéreo por pessoa
  let busFixedOperational = 1500.00; // F_operacional: R$ 1.500,00 por viagem
  let busVarPerKm = 6.00;            // c_bus: R$ 6,00 por Km rodado do veículo

  // Leaflet Dual-Map references for Micro View
  let mapCbfElement;
  let mapPropostoElement;
  let mapCBF = null;
  let mapProposto = null;

  onMount(async () => {
    try {
      const basePath = base ? base.replace(/\/$/, '') : '';
      const res = await fetch(`${basePath}/json/comparison_cbf_vs_otimizado.json`);
      if (!res.ok) {
        throw new Error('Não foi possível carregar os dados do comparativo CBF vs Otimizado.');
      }
      rawData = await res.json();
      teamKeysList = Object.keys(rawData);
      loadingData = false;
    } catch (err) {
      console.error('Erro ao carregar JSON de comparativo:', err);
      errorMsg = err.message || 'Erro de carregamento.';
      loadingData = false;
    }
  });

  onDestroy(() => {
    destroyMaps();
  });

  function destroyMaps() {
    if (mapCBF) {
      mapCBF.remove();
      mapCBF = null;
    }
    if (mapProposto) {
      mapProposto.remove();
      mapProposto = null;
    }
  }

  /**
   * Affine Function for Round-Trip Flight Cost: C_aereo(d) = N * [2 * (c_aereo * d + f_aereo)]
   * Affine Function for Round-Trip Bus Charter Cost: C_onibus(d) = (c_bus * 2d) + F_operacional
   */
  function calculateMatchCost(match, busVarRate, busFixedFee, flightVarRate, flightFixedFee) {
    if (!match || typeof match.km !== 'number') return 0;
    const isFlight = match.modal === 'aereo' || match.modal === 'flight' || match.modal === 'aéreo';
    const d = match.km; // One-way distance in km

    if (isFlight) {
      return DELEGATION_N * (2 * (flightVarRate * d + flightFixedFee));
    } else {
      return (busVarRate * 2 * d) + busFixedFee;
    }
  }

  function calculateTotalCost(partidasList, busVarRate, busFixedFee, flightVarRate, flightFixedFee) {
    if (!partidasList || partidasList.length === 0) return 0;
    return partidasList.reduce((acc, m) => acc + calculateMatchCost(m, busVarRate, busFixedFee, flightVarRate, flightFixedFee), 0);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function formatKm(km) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(km) + ' km';
  }

  // Handle Table Header Sorting Toggle
  function handleSort(key) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'desc'; // default to descending for new metric
    }
  }

  // Reactive Processed Teams Array with Calculations & Sorting
  $: processedTeams = teamKeysList.map(key => {
    const item = rawData[key];
    const cbfGames = item?.baseline?.jogos_fora || item?.baseline?.partidas?.length || 9;
    const propGames = item?.proposto?.jogos_fora || item?.proposto?.partidas?.length || 19;

    const cbfKmTotal = item?.baseline?.km_total || 0;
    const propKmTotal = item?.proposto?.km_total || 0;

    const cbfKmAvg = cbfKmTotal / cbfGames;
    const propKmAvg = propKmTotal / propGames;

    const cbfCostTotal = calculateTotalCost(item?.baseline?.partidas, busVarPerKm, busFixedOperational, flightVarPerKm, flightFixedFee);
    const propCostTotal = calculateTotalCost(item?.proposto?.partidas, busVarPerKm, busFixedOperational, flightVarPerKm, flightFixedFee);

    const cbfCostAvg = cbfCostTotal / cbfGames;
    const propCostAvg = propCostTotal / propGames;

    const costAvgSaved = cbfCostAvg - propCostAvg;
    const costAvgPct = cbfCostAvg > 0 ? (costAvgSaved / cbfCostAvg) * 100 : 0;
    const kmAvgSaved = cbfKmAvg - propKmAvg;

    return {
      key,
      item,
      nome: item.nome,
      estado: item.estado,
      liga_proposta: item.liga_proposta.includes("Macro") ? 'Série C' : (item.liga_proposta.includes("Micro") ? 'Série D' : item.liga_proposta),
      cbfGames,
      propGames,
      cbfKmAvg,
      propKmAvg,
      kmAvgSaved,
      cbfCostAvg,
      propCostAvg,
      costAvgSaved,
      costAvgPct
    };
  });

  // Filtered & Sorted Teams List for Table
  $: sortedFilteredTeams = processedTeams
    .filter(t => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        t.nome?.toLowerCase().includes(q) ||
        t.estado?.toLowerCase().includes(q) ||
        t.liga_proposta?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Global Average Aggregates
  $: globalStats = (() => {
    if (!processedTeams.length) return null;
    const count = processedTeams.length;

    const avgCbfKmPerGame = processedTeams.reduce((acc, t) => acc + t.cbfKmAvg, 0) / count;
    const avgPropKmPerGame = processedTeams.reduce((acc, t) => acc + t.propKmAvg, 0) / count;

    const avgCbfCostPerGame = processedTeams.reduce((acc, t) => acc + t.cbfCostAvg, 0) / count;
    const avgPropCostPerGame = processedTeams.reduce((acc, t) => acc + t.propCostAvg, 0) / count;

    const kmAvgSaved = avgCbfKmPerGame - avgPropKmPerGame;
    const kmAvgPct = avgCbfKmPerGame > 0 ? (kmAvgSaved / avgCbfKmPerGame) * 100 : 0;

    const costAvgSaved = avgCbfCostPerGame - avgPropCostPerGame;
    const costAvgPct = avgCbfCostPerGame > 0 ? (costAvgSaved / avgCbfCostPerGame) * 100 : 0;

    return {
      avgCbfKmPerGame,
      avgPropKmPerGame,
      kmAvgSaved,
      kmAvgPct,
      avgCbfCostPerGame,
      avgPropCostPerGame,
      costAvgSaved,
      costAvgPct
    };
  })();

  // Select Team for Micro View
  async function selectTeam(key) {
    selectedTeamKey = key;
    await tick();
    initDualMaps();
  }

  function backToMacroTable() {
    selectedTeamKey = null;
    destroyMaps();
  }

  async function initDualMaps() {
    if (!selectedTeamKey || !rawData[selectedTeamKey]) return;
    destroyMaps();

    if (!L) {
      L = await import('leaflet');
    }

    const item = rawData[selectedTeamKey];
    const cbfPartidas = item.baseline?.partidas || [];
    const propPartidas = item.proposto?.partidas || [];

    const setupMap = (mapElement, partidas, routeColor) => {
      if (!mapElement) return null;

      const mapInstance = L.map(mapElement, {
        center: [-14.235, -51.925],
        zoom: 4,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(mapInstance);

      const bounds = L.latLngBounds();

      partidas.forEach(m => {
        const rota = m.rota || [];
        if (rota.length >= 2) {
          rota.forEach(pt => bounds.extend(pt));

          const polyline = L.polyline(rota, {
            color: routeColor,
            weight: 3.5,
            opacity: 0.85,
            dashArray: (m.modal === 'aereo' || m.modal === 'flight') ? '6, 6' : null
          });
          polyline.bindTooltip(`<b>${m.adversario.split('/')[0]}</b><br/>Distância: ${formatKm(m.km)} (${m.modal})`);
          polyline.addTo(mapInstance);

          const destPt = rota[rota.length - 1];
          const advName = m.adversario.split('/')[0];

          const markerIcon = L.divIcon({
            html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[7px] font-bold text-white" style="background-color: ${routeColor}"></div>`,
            className: 'custom-[micro-marker]',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          const destMarker = L.marker(destPt, { icon: markerIcon });
          destMarker.bindPopup(`<b>${advName}</b><br/>${formatKm(m.km)} - Modal: ${m.modal}`);
          destMarker.addTo(mapInstance);
        }
      });

      if (partidas.length > 0 && partidas[0].rota && partidas[0].rota.length > 0) {
        const homePt = partidas[0].rota[0];
        bounds.extend(homePt);

        const homeIcon = L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center font-black text-amber-300 text-xs shadow-xl animate-pulse">🏠</div>`,
          className: 'custom-[home-marker]',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const homeMarker = L.marker(homePt, { icon: homeIcon });
        homeMarker.bindPopup(`<b>Sede Principal: ${item.nome}</b>`);
        homeMarker.addTo(mapInstance);
      }

      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 7 });
      }

      return mapInstance;
    };

    setTimeout(() => {
      mapCBF = setupMap(mapCbfElement, cbfPartidas, '#ef4444');
      mapProposto = setupMap(mapPropostoElement, propPartidas, '#10b981');
    }, 100);
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950">
  <Navbar />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    
    <!-- Top Header Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <BarChart3 class="w-4 h-4 text-indigo-400" />
          Estudo de Caso Acadêmico (FGV TCC)
        </div>
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          O Impacto Logístico: CBF 2026 vs. Modelo Otimizado
        </h1>
        
        <!-- 1. Executive Summary Paragraph (Context Before Raw Data) -->
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify pt-1">
          Nesta simulação, submetemos os 20 clubes da Série C a duas realidades: o calendário oficial da CBF de 2026 (que exige cruzamentos continentais) e o nosso modelo de Ligas Regionais Otimizadas. Explore abaixo como a Pesquisa Operacional e a Teoria dos Grafos encurtam distâncias, dobram o número de partidas e geram economia real por jogo.
        </p>
      </div>

      {#if selectedTeamKey}
        <button
          on:click={backToMacroTable}
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-950/60 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <ArrowLeft class="w-4 h-4" />
          Voltar à Tabela Geral
        </button>
      {/if}
    </div>

    {#if loadingData}
      <div class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 class="w-10 h-10 text-indigo-400 animate-spin" />
        <p class="text-sm font-bold text-slate-300">Carregando Matriz de Comparativo de Rotas e Custos...</p>
      </div>
    {:else if errorMsg}
      <div class="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
        <p class="text-rose-300 font-bold">{errorMsg}</p>
        <button on:click={() => location.reload()} class="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold">
          Tentar Novamente
        </button>
      </div>
    {:else if !selectedTeamKey}

      <!-- ================================================================= -->
      <!-- MACRO VIEW: AVERAGE METRICS KPI CARDS & CONSOLIDATED TABLE        -->
      <!-- ================================================================= -->

      <!-- Global Average KPI Summary Cards -->
      {#if globalStats}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Km Médio CBF -->
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Km Médio / Jogo (Modelo CBF)</span>
              <MapPin class="w-4 h-4 text-rose-400" />
            </div>
            <p class="text-xl font-black text-rose-400 font-mono">
              {formatKm(globalStats.avgCbfKmPerGame)}
            </p>
            <span class="text-[10px] text-slate-500">Média por partida fora de casa</span>
          </div>

          <!-- Card 2: Km Médio Proposto -->
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Km Médio / Jogo (Modelo Otimizado)</span>
              <MapPin class="w-4 h-4 text-emerald-400" />
            </div>
            <p class="text-xl font-black text-emerald-400 font-mono">
              {formatKm(globalStats.avgPropKmPerGame)}
            </p>
            <span class="text-[10px] text-emerald-500/80 font-bold">Média por partida fora de casa</span>
          </div>

          <!-- Card 3: Redução Média em Km -->
          <div class="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-4 space-y-1 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Redução Média de Distância</span>
              <TrendingDown class="w-4 h-4 text-emerald-400" />
            </div>
            <p class="text-xl font-black text-emerald-300 font-mono">
              -{formatKm(globalStats.kmAvgSaved)} / jogo
            </p>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              -{globalStats.kmAvgPct.toFixed(1)}% de Km por viagem
            </span>
          </div>

          <!-- Card 4: Economia Média por Jogo -->
          <div class="bg-slate-900/90 border border-indigo-900/40 rounded-xl p-4 space-y-1 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Economia Média por Jogo</span>
              <DollarSign class="w-4 h-4 text-indigo-400" />
            </div>
            <p class="text-xl font-black text-indigo-300 font-mono">
              {formatCurrency(globalStats.costAvgSaved)} / jogo
            </p>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              -{globalStats.costAvgPct.toFixed(1)}% no custo por partida
            </span>
          </div>

        </div>
      {/if}

      <!-- 2. Progressive Disclosure Accordion for Financial Premises Sliders -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        <!-- Accordion Header Button -->
        <button
          on:click={() => showPremisesAccordion = !showPremisesAccordion}
          class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sliders class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-extrabold text-sm text-white flex items-center gap-2">
                ⚙️ Ajustar Premissas de Custo (Fretamento, Combustível e Passagens)
              </h3>
              <p class="text-[11px] text-slate-400">
                Altere as taxas de bilhete aéreo e diárias de fretamento rodoviário em tempo real.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <span>{showPremisesAccordion ? 'Ocultar Premissas' : 'Expandir Ajustes'}</span>
            {#if showPremisesAccordion}
              <ChevronUp class="w-4 h-4 text-indigo-400" />
            {:else}
              <ChevronDown class="w-4 h-4 text-indigo-400" />
            {/if}
          </div>
        </button>

        <!-- Accordion Content (Collapsible with Svelte Slide Transition) -->
        {#if showPremisesAccordion}
          <div transition:slide={{ duration: 250 }} class="px-6 pb-6 pt-2 border-t border-slate-800 space-y-4 bg-slate-950/60">
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              
              <!-- Column 1: Avião (Por Passageiro - N = 30 pax) -->
              <div class="bg-slate-900/60 border border-purple-900/40 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between border-b border-purple-900/50 pb-2">
                  <div class="flex items-center gap-2 text-purple-300 font-extrabold">
                    <Plane class="w-4 h-4 text-purple-400" />
                    <span>Premissas: Avião (Por Passageiro)</span>
                  </div>
                  <span class="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-bold">
                    N = 30 pax
                  </span>
                </div>

                <p class="text-[11px] text-slate-400 leading-relaxed">
                  Fórmula: <code class="font-mono text-purple-300">C_aereo(d) = N × [2 × (c · d + f)]</code> (ida e volta para a delegação de 30 pessoas).
                </p>

                <div class="space-y-3 pt-1">
                  <!-- Slider f_aereo -->
                  <div class="space-y-1">
                    <div class="flex justify-between font-semibold">
                      <span class="text-slate-300">Custo Fixo por Bilhete (f):</span>
                      <span class="font-mono text-purple-400 font-bold">{formatCurrency(flightFixedFee)} / pax</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      bind:value={flightFixedFee}
                      class="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div class="flex justify-between text-[10px] text-slate-500">
                      <span>R$ 0,00</span>
                      <span>Default: R$ 45,00</span>
                      <span>R$ 200,00</span>
                    </div>
                  </div>

                  <!-- Slider c_aereo -->
                  <div class="space-y-1">
                    <div class="flex justify-between font-semibold">
                      <span class="text-slate-300">Custo Variável por Km (c):</span>
                      <span class="font-mono text-purple-400 font-bold">{formatCurrency(flightVarPerKm)} / km / pax</span>
                    </div>
                    <input
                      type="range"
                      min="0.20"
                      max="0.80"
                      step="0.05"
                      bind:value={flightVarPerKm}
                      class="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div class="flex justify-between text-[10px] text-slate-500">
                      <span>R$ 0,20/km</span>
                      <span>Default: R$ 0,40/km</span>
                      <span>R$ 0,80/km</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Column 2: Ônibus (Fretamento do Veículo) -->
              <div class="bg-slate-900/60 border border-blue-900/40 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between border-b border-blue-900/50 pb-2">
                  <div class="flex items-center gap-2 text-blue-300 font-extrabold">
                    <Bus class="w-4 h-4 text-blue-400" />
                    <span>Premissas: Ônibus (Fretamento do Veículo)</span>
                  </div>
                  <span class="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-bold">
                    Veículo Fechado
                  </span>
                </div>

                <p class="text-[11px] text-slate-400 leading-relaxed">
                  Fórmula: <code class="font-mono text-blue-300">C_onibus(d) = (c_bus · 2d) + F_operacional</code> (fretamento por veículo contratado).
                </p>

                <div class="space-y-3 pt-1">
                  <!-- Slider F_operacional -->
                  <div class="space-y-1">
                    <div class="flex justify-between font-semibold">
                      <span class="text-slate-300">Custo Fixo Operacional (F_operacional):</span>
                      <span class="font-mono text-blue-400 font-bold">{formatCurrency(busFixedOperational)} / viagem</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      bind:value={busFixedOperational}
                      class="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div class="flex justify-between text-[10px] text-slate-500">
                      <span>R$ 500,00</span>
                      <span>Default: R$ 1.500,00</span>
                      <span>R$ 3.000,00</span>
                    </div>
                  </div>

                  <!-- Slider c_bus -->
                  <div class="space-y-1">
                    <div class="flex justify-between font-semibold">
                      <span class="text-slate-300">Custo Variável por Km (c_bus):</span>
                      <span class="font-mono text-blue-400 font-bold">{formatCurrency(busVarPerKm)} / km</span>
                    </div>
                    <input
                      type="range"
                      min="2.00"
                      max="12.00"
                      step="0.50"
                      bind:value={busVarPerKm}
                      class="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div class="flex justify-between text-[10px] text-slate-500">
                      <span>R$ 2,00/km</span>
                      <span>Default: R$ 6,00/km</span>
                      <span>R$ 12,00/km</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        {/if}
      </div>

      <!-- 4. Dynamic Interactive Table with Sorting & Micro-Interaction Badge -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
        
        <!-- Table Search & Header Bar -->
        <div class="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div class="space-y-1">
            <div class="flex items-center gap-2 font-bold text-sm text-slate-200">
              <Layers class="w-4 h-4 text-indigo-400" />
              <span>Matriz Comparativa de Médias Logísticas por Jogo (20 Clubes)</span>
              <span class="text-xs text-slate-400 font-normal">({sortedFilteredTeams.length} clubes)</span>
            </div>

            <!-- Micro-Interaction UX Tip Badge -->
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium animate-pulse">
              <span>👉 <strong>Dica:</strong> Clique na linha de qualquer clube para abrir o detalhamento no mapa. Clique nos cabeçalhos para ordenar.</span>
            </div>
          </div>

          <!-- Search Input -->
          <div class="relative min-w-[240px]">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Buscar por clube ou liga..."
              class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Dynamic Sortable Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/90 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                
                <!-- Sortable Header: Clube -->
                <th on:click={() => handleSort('nome')} class="py-3 px-4 cursor-pointer select-none hover:text-white transition-colors">
                  <div class="flex items-center gap-1">
                    <span>Clube</span>
                    {#if sortKey === 'nome'}
                      {#if sortDirection === 'asc'}<ArrowUp class="w-3 h-3 text-indigo-400" />{:else}<ArrowDown class="w-3 h-3 text-indigo-400" />{/if}
                    {:else}
                      <ArrowUpDown class="w-3 h-3 text-slate-600" />
                    {/if}
                  </div>
                </th>

                <!-- Sortable Header: Nova Liga -->
                <th on:click={() => handleSort('liga_proposta')} class="py-3 px-3 cursor-pointer select-none hover:text-white transition-colors">
                  <div class="flex items-center gap-1">
                    <span>Nova Liga</span>
                    {#if sortKey === 'liga_proposta'}
                      {#if sortDirection === 'asc'}<ArrowUp class="w-3 h-3 text-indigo-400" />{:else}<ArrowDown class="w-3 h-3 text-indigo-400" />{/if}
                    {:else}
                      <ArrowUpDown class="w-3 h-3 text-slate-600" />
                    {/if}
                  </div>
                </th>

                <!-- Jogos Fora (CBF / Prop) -->
                <th class="py-3 px-3 text-center">Jogos Fora (CBF / Prop)</th>

                <!-- Sortable Header: Km Médio -->
                <th on:click={() => handleSort('propKmAvg')} class="py-3 px-3 text-right cursor-pointer select-none hover:text-white transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    <span>Km Médio (CBF vs Prop)</span>
                    {#if sortKey === 'propKmAvg'}
                      {#if sortDirection === 'asc'}<ArrowUp class="w-3 h-3 text-indigo-400" />{:else}<ArrowDown class="w-3 h-3 text-indigo-400" />{/if}
                    {:else}
                      <ArrowUpDown class="w-3 h-3 text-slate-600" />
                    {/if}
                  </div>
                </th>

                <!-- Sortable Header: Custo Médio -->
                <th on:click={() => handleSort('propCostAvg')} class="py-3 px-3 text-right cursor-pointer select-none hover:text-white transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    <span>Custo Médio (CBF vs Prop)</span>
                    {#if sortKey === 'propCostAvg'}
                      {#if sortDirection === 'asc'}<ArrowUp class="w-3 h-3 text-indigo-400" />{:else}<ArrowDown class="w-3 h-3 text-indigo-400" />{/if}
                    {:else}
                      <ArrowUpDown class="w-3 h-3 text-slate-600" />
                    {/if}
                  </div>
                </th>

                <!-- Sortable Header: Economia Média -->
                <th on:click={() => handleSort('costAvgSaved')} class="py-3 px-3 text-right cursor-pointer select-none text-emerald-400 hover:text-emerald-300 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    <span>Economia Média / Jogo</span>
                    {#if sortKey === 'costAvgSaved'}
                      {#if sortDirection === 'asc'}<ArrowUp class="w-3 h-3 text-emerald-400" />{:else}<ArrowDown class="w-3 h-3 text-emerald-400" />{/if}
                    {:else}
                      <ArrowUpDown class="w-3 h-3 text-slate-600" />
                    {/if}
                  </div>
                </th>

                <!-- Sortable Header: Eficiência (%) -->
                <th on:click={() => handleSort('costAvgPct')} class="py-3 px-3 text-center cursor-pointer select-none text-emerald-400 hover:text-emerald-300 transition-colors">
                  <div class="flex items-center justify-center gap-1">
                    <span>Eficiência (%) / Jogo</span>
                    {#if sortKey === 'costAvgPct'}
                      {#if sortDirection === 'asc'}<ArrowUp class="w-3 h-3 text-emerald-400" />{:else}<ArrowDown class="w-3 h-3 text-emerald-400" />{/if}
                    {:else}
                      <ArrowUpDown class="w-3 h-3 text-slate-600" />
                    {/if}
                  </div>
                </th>

                <th class="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              {#each sortedFilteredTeams as t (t.key)}
                <tr
                  on:click={() => selectTeam(t.key)}
                  class="cursor-pointer transition-all hover:bg-slate-800/90 even:bg-slate-950/30 group border-l-2 border-l-transparent hover:border-l-indigo-400"
                >
                  <!-- Clube -->
                  <td class="py-3 px-4 flex items-center gap-3">
                    <TeamBadge teamId={t.key} name={t.nome} state={t.estado} size="w-7 h-7" />
                    <div>
                      <span class="font-extrabold text-white text-xs block group-hover:text-indigo-300 transition-colors">
                        {t.nome}
                      </span>
                      <span class="text-[9px] text-slate-500 uppercase font-semibold">{t.estado}</span>
                    </div>
                  </td>

                  <!-- Nova Liga Proposta -->
                  <td class="py-3 px-3 text-slate-300 font-semibold">
                    <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-indigo-300">
                      {t.liga_proposta}
                    </span>
                  </td>

                  <!-- Jogos Fora -->
                  <td class="py-3 px-3 text-center font-mono">
                    <span class="text-rose-400 font-bold">{t.cbfGames}</span>
                    <span class="text-slate-500"> / </span>
                    <span class="text-emerald-400 font-bold">{t.propGames}</span>
                  </td>

                  <!-- Km Médio por Jogo -->
                  <td class="py-3 px-3 text-right font-mono">
                    <span class="text-rose-400 font-semibold block">{formatKm(t.cbfKmAvg)}</span>
                    <span class="text-emerald-400 font-bold block">{formatKm(t.propKmAvg)}</span>
                  </td>

                  <!-- Custo Médio por Jogo -->
                  <td class="py-3 px-3 text-right font-mono">
                    <span class="text-rose-400 font-semibold block">{formatCurrency(t.cbfCostAvg)}</span>
                    <span class="text-emerald-400 font-bold block">{formatCurrency(t.propCostAvg)}</span>
                  </td>

                  <!-- Economia Média por Jogo (R$) -->
                  <td class="py-3 px-3 text-right font-mono text-emerald-300 font-extrabold text-sm">
                    {formatCurrency(t.costAvgSaved)} / jogo
                  </td>

                  <!-- Eficiência Econômica Média (%) -->
                  <td class="py-3 px-3 text-center">
                    <span class={`px-2.5 py-1 rounded-full font-extrabold text-xs border ${
                      t.costAvgPct > 30 ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                      t.costAvgPct > 0 ? 'bg-teal-950 text-teal-400 border-teal-800' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      +{t.costAvgPct.toFixed(1)}%
                    </span>
                  </td>

                  <!-- Action -->
                  <td class="py-3 px-4 text-center">
                    <button
                      on:click|stopPropagation={() => selectTeam(t.key)}
                      class="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-[11px] transition-all inline-flex items-center gap-1 border border-indigo-500/30 shadow-sm"
                    >
                      Analisar <ChevronRight class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

      </div>

    {:else}

      <!-- ================================================================= -->
      <!-- MICRO VIEW: DETAILED CLUB ANALYSIS PANEL & DUAL MAP               -->
      <!-- ================================================================= -->

      {@const teamData = rawData[selectedTeamKey]}
      {@const cbfGames = teamData.baseline?.jogos_fora || teamData.baseline?.partidas?.length || 9}
      {@const propGames = teamData.proposto?.jogos_fora || teamData.proposto?.partidas?.length || 19}

      {@const cbfKmTotal = teamData.baseline?.km_total || 0}
      {@const propKmTotal = teamData.proposto?.km_total || 0}

      {@const cbfKmAvg = cbfKmTotal / cbfGames}
      {@const propKmAvg = propKmTotal / propGames}

      {@const cbfCostTotal = calculateTotalCost(teamData.baseline?.partidas, busVarPerKm, busFixedOperational, flightVarPerKm, flightFixedFee)}
      {@const propCostTotal = calculateTotalCost(teamData.proposto?.partidas, busVarPerKm, busFixedOperational, flightVarPerKm, flightFixedFee)}

      {@const cbfCostAvg = cbfCostTotal / cbfGames}
      {@const propCostAvg = propCostTotal / propGames}

      {@const kmAvgSaved = cbfKmAvg - propKmAvg}
      {@const kmAvgPct = cbfKmAvg > 0 ? (kmAvgSaved / cbfKmAvg) * 100 : 0}

      {@const costAvgSaved = cbfCostAvg - propCostAvg}
      {@const costAvgPct = cbfCostAvg > 0 ? (costAvgSaved / cbfCostAvg) * 100 : 0}

      <!-- Club Header Banner -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div class="flex items-center gap-4">
            <TeamBadge teamId={selectedTeamKey} name={teamData.nome} state={teamData.estado} size="w-14 h-14" />
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-black text-white">{teamData.nome}</h2>
                <span class="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {teamData.estado}
                </span>
              </div>
              <p class="text-xs text-indigo-400 font-semibold mt-0.5">
                Liga Alocada: {teamData.liga_proposta || 'Macro 0 (Série C)'}
              </p>
            </div>
          </div>

          <button
            on:click={backToMacroTable}
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft class="w-4 h-4" /> Voltar à Tabela Geral
          </button>
        </div>

        <!-- 5. Micro View Narrative Subtitle -->
        <div class="bg-slate-950/80 border border-indigo-950/60 rounded-xl p-4 text-xs text-slate-300 leading-relaxed text-justify">
          <span class="font-bold text-indigo-400 block mb-1">Impacto Logístico no {teamData.nome}:</span>
          Compare o cruzamento continental imposto pela CBF (em vermelho) contra a malha regional focada e otimizada pelo nosso modelo (em verde). Observe a drástica redução nos custos médios por partida jogada como visitante. <i>Adota-se o transporte aéreo em jogos como visitante com distância rodoviária superior a 800 km.</i>
        </div>

        <!-- 4 Club Average KPI Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Km Médio CBF -->
          <div class="bg-slate-950/80 border border-rose-900/40 rounded-xl p-4 space-y-1">
            <span class="text-[10px] uppercase font-bold text-rose-400 block">Km Médio / Jogo (CBF)</span>
            <p class="text-lg font-black text-rose-300 font-mono">{formatKm(cbfKmAvg)}</p>
            <span class="text-[10px] text-slate-500">{cbfGames} jogos fora (Total: {formatKm(cbfKmTotal)})</span>
          </div>

          <!-- Card 2: Km Médio Proposto -->
          <div class="bg-slate-950/80 border border-emerald-900/40 rounded-xl p-4 space-y-1">
            <span class="text-[10px] uppercase font-bold text-emerald-400 block">Km Médio / Jogo (Proposto)</span>
            <p class="text-lg font-black text-emerald-300 font-mono">{formatKm(propKmAvg)}</p>
            <span class="text-[10px] text-emerald-400 font-bold">{propGames} jogos fora (Total: {formatKm(propKmTotal)})</span>
          </div>

          <!-- Card 3: Economia Média em Km -->
          <div class="bg-slate-950/80 border border-emerald-900/60 rounded-xl p-4 space-y-1">
            <span class="text-[10px] uppercase font-bold text-emerald-400 block">Redução Média por Viagem</span>
            <p class="text-lg font-black text-emerald-300 font-mono">-{formatKm(kmAvgSaved)} / jogo</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              -{kmAvgPct.toFixed(1)}% por partida
            </span>
          </div>

          <!-- Card 4: Economia Financeira Média -->
          <div class="bg-slate-950/80 border border-indigo-900/60 rounded-xl p-4 space-y-1">
            <span class="text-[10px] uppercase font-bold text-indigo-400 block">Economia Média por Jogo</span>
            <p class="text-lg font-black text-indigo-300 font-mono">{formatCurrency(costAvgSaved)} / jogo</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              -{costAvgPct.toFixed(1)}% de redução no custo por partida
            </span>
          </div>
        </div>

      </div>

      <!-- Dual-Map Section: Leaflet Side-by-Side -->
      <div class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
            <Compass class="w-4 h-4 text-indigo-400" />
            Comparativo de Rotas Geográficas no Mapa (Dual-Map Sincronizado)
          </h3>
          <span class="text-xs text-slate-400">Vermelho: Modelo CBF | Verde: Modelo Otimizado</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Left Map: Modelo CBF -->
          <div class="bg-slate-900 border border-rose-900/60 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div class="px-4 py-2.5 bg-rose-950/80 border-b border-rose-900/60 flex items-center justify-between">
              <span class="font-extrabold text-xs text-rose-200 flex items-center gap-2">
                <Shield class="w-4 h-4 text-rose-400" />
                Modelo CBF (Calendário Oficial 2026)
              </span>
              <span class="text-[10px] font-mono text-rose-300 font-bold">
                Média: {formatCurrency(cbfCostAvg)} / jogo ({formatKm(cbfKmAvg)})
              </span>
            </div>
            <div class="w-full h-[400px] relative">
              <div bind:this={mapCbfElement} class="w-full h-full"></div>
            </div>
          </div>

          <!-- Right Map: Modelo Proposto -->
          <div class="bg-slate-900 border border-emerald-900/60 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div class="px-4 py-2.5 bg-emerald-950/80 border-b border-emerald-900/60 flex items-center justify-between">
              <span class="font-extrabold text-xs text-emerald-200 flex items-center gap-2">
                <Shield class="w-4 h-4 text-emerald-400" />
                Modelo Proposto (Regionalizado Otimizado)
              </span>
              <span class="text-[10px] font-mono text-emerald-300 font-bold">
                Média: {formatCurrency(propCostAvg)} / jogo ({formatKm(propKmAvg)})
              </span>
            </div>
            <div class="w-full h-[400px] relative">
              <div bind:this={mapPropostoElement} class="w-full h-full"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Side-by-Side Detailed Itinerary Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        <!-- Left Table: CBF Baseline Itinerary -->
        <div class="bg-slate-900/90 border border-rose-900/50 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div class="px-4 py-3 bg-rose-950/80 border-b border-rose-900/60 flex items-center justify-between">
            <h4 class="font-extrabold text-xs text-rose-200 flex items-center gap-2">
              <Bus class="w-4 h-4 text-rose-400" />
              Itinerário de Jogos Fora (Modelo CBF)
            </h4>
            <span class="text-[10px] text-rose-300 font-bold">{teamData.baseline?.partidas?.length || 0} Partidas</span>
          </div>

          <div class="overflow-x-auto max-h-[400px] overflow-y-auto flex-1">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider sticky top-0">
                <tr>
                  <th class="py-2.5 px-3">Adversário</th>
                  <th class="py-2.5 px-2 text-center">Modal</th>
                  <th class="py-2.5 px-3 text-right">Distância (Km)</th>
                  <th class="py-2.5 px-3 text-right">Custo Est. (R$)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 font-medium">
                {#each (teamData.baseline?.partidas || []) as match}
                  {@const cost = calculateMatchCost(match, busVarPerKm, busFixedOperational, flightVarPerKm, flightFixedFee)}
                  {@const advParts = match.adversario.split('/')}
                  {@const advName = advParts[0]}
                  {@const advState = advParts[1] || ''}

                  <tr class="hover:bg-slate-800/60 even:bg-slate-950/30">
                    <td class="py-2 px-3 flex items-center gap-2">
                      <TeamBadge teamId={match.adversario} name={advName} state={advState} size="w-5 h-5" />
                      <span class="font-bold text-white text-xs truncate max-w-[130px]">{advName}</span>
                    </td>
                    <td class="py-2 px-2 text-center">
                      {#if match.modal === 'aereo' || match.modal === 'flight'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                          <Plane class="w-3 h-3" /> Aéreo
                        </span>
                      {:else}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                          <Bus class="w-3 h-3" /> Ônibus
                        </span>
                      {/if}
                    </td>
                    <td class="py-2 px-3 text-right font-mono text-rose-400 font-semibold">
                      {formatKm(match.km)}
                    </td>
                    <td class="py-2 px-3 text-right font-mono text-slate-200">
                      {formatCurrency(cost)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-bold shrink-0">
            <div>
              <span class="text-slate-400 block">Total Logística CBF:</span>
              <span class="text-[10px] text-slate-500 font-mono font-normal">Custo Médio / Jogo:</span>
            </div>
            <div class="text-right font-mono">
              <span class="text-rose-400 text-sm block font-bold">{formatCurrency(cbfCostTotal)}</span>
              <span class="text-rose-300 text-xs font-bold">{formatCurrency(cbfCostAvg)} / jogo</span>
            </div>
          </div>
        </div>

        <!-- Right Table: Proposed Model Itinerary -->
        <div class="bg-slate-900/90 border border-emerald-900/50 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div class="px-4 py-3 bg-emerald-950/80 border-b border-emerald-900/60 flex items-center justify-between">
            <h4 class="font-extrabold text-xs text-emerald-200 flex items-center gap-2">
              <Bus class="w-4 h-4 text-emerald-400" />
              Itinerário de Jogos Fora (Modelo Otimizado)
            </h4>
            <span class="text-[10px] text-emerald-300 font-bold">{teamData.proposto?.partidas?.length || 0} Partidas</span>
          </div>

          <div class="overflow-x-auto max-h-[400px] overflow-y-auto flex-1">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider sticky top-0">
                <tr>
                  <th class="py-2.5 px-3">Adversário</th>
                  <th class="py-2.5 px-2 text-center">Modal</th>
                  <th class="py-2.5 px-3 text-right">Distância (Km)</th>
                  <th class="py-2.5 px-3 text-right">Custo Est. (R$)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 font-medium">
                {#each (teamData.proposto?.partidas || []) as match}
                  {@const cost = calculateMatchCost(match, busVarPerKm, busFixedOperational, flightVarPerKm, flightFixedFee)}
                  {@const advParts = match.adversario.split('/')}
                  {@const advName = advParts[0]}
                  {@const advState = advParts[1] || ''}

                  <tr class="hover:bg-slate-800/60 even:bg-slate-950/30">
                    <td class="py-2 px-3 flex items-center gap-2">
                      <TeamBadge teamId={match.adversario} name={advName} state={advState} size="w-5 h-5" />
                      <span class="font-bold text-white text-xs truncate max-w-[130px]">{advName}</span>
                    </td>
                    <td class="py-2 px-2 text-center">
                      {#if match.modal === 'aereo' || match.modal === 'flight'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                          <Plane class="w-3 h-3" /> Aéreo
                        </span>
                      {:else}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                          <Bus class="w-3 h-3" /> Ônibus
                        </span>
                      {/if}
                    </td>
                    <td class="py-2 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {formatKm(match.km)}
                    </td>
                    <td class="py-2 px-3 text-right font-mono text-slate-200">
                      {formatCurrency(cost)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-bold shrink-0">
            <div>
              <span class="text-slate-400 block">Total Logística Proposto:</span>
              <span class="text-[10px] text-slate-500 font-mono font-normal">Custo Médio / Jogo:</span>
            </div>
            <div class="text-right font-mono">
              <span class="text-emerald-400 text-sm block font-bold">{formatCurrency(propCostTotal)}</span>
              <span class="text-emerald-300 text-xs font-bold">{formatCurrency(propCostAvg)} / jogo</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Action to Return -->
      <div class="text-center pt-4">
        <button
          on:click={backToMacroTable}
          class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-950/60 inline-flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" /> Voltar para a Tabela Consolidada de Médias
        </button>
      </div>

    {/if}
  </main>
</div>
