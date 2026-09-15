<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { base } from '$app/paths';
  import 'leaflet/dist/leaflet.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import {
    BarChart3, TrendingDown, TrendingUp, DollarSign, Bus, Plane,
    Search, Shield, MapPin, Loader2,
    Layers, Calculator, Compass, ChevronRight, ChevronDown, ChevronUp,
    Info, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, AlertCircle,
    Building2, Users, CheckCircle2, Calendar, Award, Activity, Filter,
    Scale, Globe, Route, ArrowRight, Eye, RefreshCw
  } from 'lucide-svelte';

  let L;
  let loadingMain = true;
  let errorMsg = null;

  // Master Executive Dataset
  let baselineData = null;

  // Active Division View in "Duelo das Divisões": 'consolidado' | 'serie_c' | 'serie_d' | 'tradeoffs'
  let activeDivisionTab = 'consolidado';

  // Federative Matrix Filter & Search State
  let federativeSearch = '';
  let federativeRegionFilter = 'TODAS';
  let federativeSortKey = 'total_piramide_nacional';
  let federativeSortDirection = 'desc';

  // Emblematic Micro Cases State
  let selectedCaseId = 'GUARANI/sao_paulo';
  let selectedTourId = null; // null = all tours visible
  let mapCbfElement;
  let mapPropostoElement;
  let mapCBF = null;
  let mapProposto = null;
  let mapsLoading = false;
  let propTourLayers = []; // references to Leaflet tour layers

  // Distinct palette for up to 6 tours
  const TOUR_COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];

  onMount(async () => {
    try {
      const basePath = base ? base.replace(/\/$/, '') : '';
      const res = await fetch(`${basePath}/json/case_study_baseline.json`);
      if (!res.ok) {
        throw new Error('Não foi possível carregar case_study_baseline.json');
      }
      baselineData = await res.json();
      loadingMain = false;

      // Initialize dual map for default emblematic case
      await tick();
      await initDualMaps();
    } catch (err) {
      console.error('Erro ao carregar estudo de caso:', err);
      errorMsg = err.message || 'Erro ao carregar dados do estudo de caso.';
      loadingMain = false;
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
    propTourLayers = [];
  }

  // Reactive Selected Emblematic Case
  $: selectedCase = (() => {
    if (!baselineData?.casos_emblematicos) return null;
    return baselineData.casos_emblematicos.find(c => c.id === selectedCaseId) || baselineData.casos_emblematicos[0];
  })();

  // Filtered & Sorted Federative Matrix
  $: filteredFederativeMatrix = (() => {
    if (!baselineData?.matriz_federativa_27_ufs) return [];
    let list = baselineData.matriz_federativa_27_ufs.filter(uf => {
      const matchesSearch = !federativeSearch.trim() ||
        uf.uf_sigla.toLowerCase().includes(federativeSearch.toLowerCase().trim()) ||
        uf.uf_nome.toLowerCase().includes(federativeSearch.toLowerCase().trim());
      const matchesRegion = federativeRegionFilter === 'TODAS' ||
        uf.regiao_macro.toLowerCase() === federativeRegionFilter.toLowerCase();
      return matchesSearch && matchesRegion;
    });

    list.sort((a, b) => {
      let valA = a[federativeSortKey];
      let valB = b[federativeSortKey];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return federativeSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return federativeSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  })();

  function handleFederativeSort(key) {
    if (federativeSortKey === key) {
      federativeSortDirection = federativeSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      federativeSortKey = key;
      federativeSortDirection = 'desc';
    }
  }

  // Switch Emblematic Case
  async function setEmblematicCase(caseId) {
    if (selectedCaseId === caseId) return;
    selectedCaseId = caseId;
    selectedTourId = null;
    await tick();
    await initDualMaps();
  }

  // Map Initialization for Micro View
  async function initDualMaps() {
    if (!selectedCase) return;
    mapsLoading = true;
    destroyMaps();

    if (!L) {
      L = await import('leaflet');
    }

    await tick();
    setTimeout(() => {
      renderMapsForData(selectedCase);
      mapsLoading = false;
    }, 50);
  }

  function renderMapsForData(caseObj) {
    if (!caseObj) return;
    const cbfPartidas = caseObj.baseline?.partidas || [];
    const turnes = caseObj.proposto?.turnes || [];
    propTourLayers = [];

    // ==========================================
    // 1. LEFT MAP: CBF BASELINE (Bate-Volta Radial)
    // ==========================================
    if (mapCbfElement) {
      mapCBF = L.map(mapCbfElement, {
        center: [-14.235, -51.925],
        zoom: 4,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(mapCBF);

      const boundsCBF = L.latLngBounds();

      cbfPartidas.forEach((m, idx) => {
        const rota = m.rota || [];
        if (rota.length >= 2) {
          rota.forEach(pt => boundsCBF.extend(pt));

          const polyline = L.polyline(rota, {
            color: '#ef4444',
            weight: 3,
            opacity: 0.8,
            dashArray: (m.modal === 'aereo' || m.modal === 'flight') ? '5, 5' : null
          });
          polyline.bindTooltip(`<b>Jogo ${idx + 1}: ${m.adversario.split('/')[0]}</b><br/>Bate-volta isolado: ${formatKm(m.km)} (${m.modal})`);
          polyline.addTo(mapCBF);

          const destPt = rota[rota.length - 1];
          const advName = m.adversario.split('/')[0];
          const markerIcon = L.divIcon({
            html: `<div class="w-4 h-4 rounded-full border border-white shadow flex items-center justify-center bg-rose-500 text-[8px] font-bold text-white">${idx + 1}</div>`,
            className: 'custom-cbf-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          L.marker(destPt, { icon: markerIcon })
            .bindPopup(`<b>Jogo ${idx + 1}: ${advName}</b><br/>${formatKm(m.km)} • ${m.modal}<br/><span class="text-xs text-rose-400 font-semibold">Bate-volta individual à sede</span>`)
            .addTo(mapCBF);
        }
      });

      if (cbfPartidas.length > 0 && cbfPartidas[0].rota?.length > 0) {
        const homePt = cbfPartidas[0].rota[0];
        boundsCBF.extend(homePt);
        const homeIcon = L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-rose-400 flex items-center justify-center text-xs shadow-xl">🏠</div>`,
          className: 'home-marker-cbf',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker(homePt, { icon: homeIcon })
          .bindPopup(`<b>Sede: ${caseObj.nome}</b><br/>Ponto de partida e retorno de todos os 9 bate-voltas`)
          .addTo(mapCBF);
      }

      if (boundsCBF.isValid()) {
        mapCBF.fitBounds(boundsCBF, { padding: [25, 25], maxZoom: 7 });
      }
    }

    // ==========================================
    // 2. RIGHT MAP: MODELO PROPOSTO (Circuitos Itinerantes TTP)
    // ==========================================
    if (mapPropostoElement) {
      mapProposto = L.map(mapPropostoElement, {
        center: [-14.235, -51.925],
        zoom: 4,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(mapProposto);

      const boundsProp = L.latLngBounds();

      // Draw each Tour as an interconnected circuit
      turnes.forEach((tour, tIdx) => {
        const color = TOUR_COLORS[tIdx % TOUR_COLORS.length];
        const coords = tour.circuito_coords || [];
        const isHighlight = selectedTourId === null || selectedTourId === tour.tour_id;

        if (coords.length >= 2) {
          coords.forEach(pt => boundsProp.extend(pt));

          const polyline = L.polyline(coords, {
            color: color,
            weight: isHighlight ? 4 : 1.5,
            opacity: isHighlight ? 0.95 : 0.25,
            dashArray: tour.partidas.some(p => p.modal === 'aereo') ? '6, 4' : null
          });

          polyline.bindTooltip(
            `<b>${tour.titulo}</b><br/>` +
            `<span style="font-size:11px">${tour.itinerario_formatado}</span><br/>` +
            `Circuito: <b>${formatKm(tour.km_circuito)}</b> (Economia: -${tour.pct_economia}%)`
          );
          polyline.addTo(mapProposto);

          const tourLayerItem = {
            tourId: tour.tour_id,
            polyline,
            markers: [],
            bounds: L.latLngBounds(coords)
          };

          // Add markers along the tour stops
          tour.partidas.forEach((match, mIdx) => {
            const mPt = match.coords;
            const markerIcon = L.divIcon({
              html: `<div style="background-color: ${color}; opacity: ${isHighlight ? 1 : 0.35}" class="px-1.5 py-0.5 rounded-full border border-white shadow flex items-center justify-center text-[9px] font-black text-slate-950 font-mono">R${match.rodada}</div>`,
              className: 'custom-tour-marker',
              iconSize: [26, 18],
              iconAnchor: [13, 9]
            });

            const marker = L.marker(mPt, { icon: markerIcon })
              .bindPopup(
                `<b>${match.adversario_nome} (${match.uf})</b><br/>` +
                `<span class="text-xs text-emerald-400 font-bold">Rodada ${match.rodada} • ${tour.titulo}</span><br/>` +
                `Cidade: ${match.cidade} • Modal: ${match.modal}<br/>` +
                `Trecho da Turnê: ${formatKm(match.km_trecho)}`
              )
              .addTo(mapProposto);

            tourLayerItem.markers.push(marker);
          });

          propTourLayers.push(tourLayerItem);
        }
      });

      // Fallback: If no tours are defined, draw individual proposed matches
      if (turnes.length === 0 && caseObj.proposto?.partidas) {
        const propPartidas = caseObj.proposto.partidas;
        propPartidas.forEach((m, idx) => {
          const rota = m.rota || [];
          if (rota.length >= 2) {
            rota.forEach(pt => boundsProp.extend(pt));

            const polyline = L.polyline(rota, {
              color: '#10b981',
              weight: 3,
              opacity: 0.85,
              dashArray: (m.modal === 'aereo' || m.modal === 'flight') ? '5, 5' : null
            });
            polyline.bindTooltip(`<b>Jogo ${idx + 1}: ${m.adversario.split('/')[0]}</b><br/>${formatKm(m.km)} (${m.modal})`);
            polyline.addTo(mapProposto);

            const destPt = rota[rota.length - 1];
            const advName = m.adversario.split('/')[0];
            const markerIcon = L.divIcon({
              html: `<div class="w-4 h-4 rounded-full border border-white shadow flex items-center justify-center bg-emerald-500 text-[8px] font-bold text-white">${idx + 1}</div>`,
              className: 'custom-prop-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            L.marker(destPt, { icon: markerIcon })
              .bindPopup(`<b>Jogo ${idx + 1}: ${advName}</b><br/>${formatKm(m.km)} • ${m.modal}`)
              .addTo(mapProposto);
          }
        });

        if (propPartidas.length > 0 && propPartidas[0].rota?.length > 0) {
          const homePt = propPartidas[0].rota[0];
          boundsProp.extend(homePt);
          const homeIcon = L.divIcon({
            html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-xs shadow-xl">🏠</div>`,
            className: 'home-marker-prop',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          L.marker(homePt, { icon: homeIcon })
            .bindPopup(`<b>Sede: ${caseObj.nome}</b>`)
            .addTo(mapProposto);
        }
      }

      // Add Home Marker for Tours
      if (turnes.length > 0 && turnes[0].circuito_coords?.length > 0) {
        const homePt = turnes[0].circuito_coords[0];
        boundsProp.extend(homePt);
        const homeIcon = L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-xs shadow-xl">🏠</div>`,
          className: 'home-marker-prop',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker(homePt, { icon: homeIcon })
          .bindPopup(`<b>Sede: ${caseObj.nome}</b><br/>Base de expedições para as ${turnes.length} turnês regionais`)
          .addTo(mapProposto);
      }

      if (boundsProp.isValid()) {
        mapProposto.fitBounds(boundsProp, { padding: [25, 25], maxZoom: 7 });
      }
    }
  }

  // Highlight / Focus on a specific Tour in the Proposed Map
  function toggleTourHighlight(tourId) {
    if (selectedTourId === tourId) {
      selectedTourId = null; // reset to all
      if (mapProposto && selectedCase) {
        renderMapsForData(selectedCase);
      }
      return;
    }

    selectedTourId = tourId;
    if (!mapProposto || !selectedCase) return;

    // Update opacity and weight of layers
    const targetTour = selectedCase.proposto?.turnes?.find(t => t.tour_id === tourId);
    propTourLayers.forEach(l => {
      const isTarget = l.tourId === tourId;
      l.polyline.setStyle({
        weight: isTarget ? 5 : 1,
        opacity: isTarget ? 1.0 : 0.15
      });
      l.markers.forEach(m => {
        const el = m.getElement();
        if (el) {
          el.style.opacity = isTarget ? '1.0' : '0.2';
        }
      });
      if (isTarget && l.bounds.isValid()) {
        mapProposto.fitBounds(l.bounds, { padding: [40, 40], maxZoom: 8 });
      }
    });
  }

  function formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }

  function formatKm(km) {
    if (km === null || km === undefined || isNaN(km)) return '0 km';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(km) + ' km';
  }
</script>

<svelte:head>
  <title>Estudo de Caso Executivo: CBF 2026 vs. Modelo Otimizado</title>
  <meta name="description" content="Auditoria orçamentária e comparativo logístico entre o sistema tradicional da CBF e a Nova Pirâmide do Futebol Brasileiro." />
</svelte:head>

<Navbar />

<main class="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-6 selection:bg-emerald-500 selection:text-slate-950 font-sans">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

    <!-- CABEÇALHO DA PÁGINA -->
    <header class="space-y-4 border-b border-slate-800/80 pb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Scale class="w-3.5 h-3.5" />
        Auditoria Comparativa & Pesquisa Operacional
      </div>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Estudo de Caso: <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">CBF 2026 vs. Modelo Proposto</span>
          </h1>
          <p class="mt-2 text-slate-400 max-w-4xl text-base sm:text-lg leading-relaxed">
            Avaliação orçamentária rigorosa, escalonamento logístico e garantia de sustentabilidade desportiva para as divisões de acesso do futebol profissional brasileiro.
          </p>
        </div>

        <!-- Badges de Escala -->
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center gap-1.5 shadow-sm">
            <Building2 class="w-3.5 h-3.5 text-emerald-400" />
            <strong>204</strong> Clubes Ativos
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center gap-1.5 shadow-sm">
            <Activity class="w-3.5 h-3.5 text-cyan-400" />
            <strong>1.959</strong> Partidas Oficiais
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center gap-1.5 shadow-sm">
            <Globe class="w-3.5 h-3.5 text-amber-400" />
            <strong>27/27</strong> UFs no Calendário
          </span>
        </div>
      </div>
    </header>

    {#if loadingMain}
      <div class="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 class="w-10 h-10 text-emerald-500 animate-spin" />
        <p class="text-slate-400 text-sm animate-pulse">Carregando métricas auditadas e rotas geoespaciais...</p>
      </div>
    {:else if errorMsg}
      <div class="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-4">
        <AlertCircle class="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h3 class="font-bold text-lg">Erro ao inicializar estudo de caso</h3>
          <p class="text-sm mt-1">{errorMsg}</p>
        </div>
      </div>
    {:else if baselineData}

      <!-- CAMADA 1: A PREMISSA INSTITUCIONAL DO SUBSÍDIO INTEGRAL CBF -->
      <section class="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Shield class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              A Premissa Institucional: Subsídio Logístico 100% CBF
              <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Pilar Regulatório</span>
            </h2>
            <p class="text-sm text-slate-300 mt-1 leading-relaxed">
              No futebol profissional brasileiro, os clubes participantes das <strong>Séries C e D não possuem faturamento</strong> suficiente com direitos de transmissão televisiva ou bilheteria para arcar com fretes aéreos e hotelaria em viagens interestaduais. Por regulamento oficial, a <strong>Confederação Brasileira de Futebol (CBF) banca 100% dos custos de transporte e hospedagem</strong> para delegações padronizadas de <strong>32 integrantes</strong>.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Users class="w-4 h-4" />
              Sustentabilidade de Empregos
            </h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              No formato CBF, mais de 65% dos clubes são eliminados até julho e fecham seus departamentos de futebol. O modelo proposto estende a atividade de <strong>3,8 para 7,8 meses ininterruptos</strong>, assegurando salários para atletas, comissões técnicas e operários de apoio.
            </p>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Building2 class="w-4 h-4" />
              Preservação das Arenas e Estádios
            </h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Estádios municipais e praças esportivas no interior do país sofrem com desuso e custos de manutenção sem receita. A realização de <strong>1.959 partidas (+158,4%)</strong> reativa economias locais com bilheteria, comércio e hotelaria regional.
            </p>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Calculator class="w-4 h-4" />
              Equação de Eficiência CBF
            </h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              A tese não propõe cortar o futebol para economizar, e sim otimizar rotas por Pesquisa Operacional (CP-SAT/TTP): por apenas <strong>+5,46% no orçamento global da CBF</strong>, viabiliza-se <strong>2,6 vezes mais partidas oficiais</strong> em todo o Brasil.
            </p>
          </div>
        </div>

        <!-- Parâmetros Afins Auditados da CBF -->
        <div class="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <Info class="w-4 h-4 text-slate-500" />
            <span><strong>Fórmulas Afins CBF:</strong> Ônibus: R$ 1.500 fixo + R$ 6,00/km • Aéreo: 32 pax × [R$ 45 fixo + R$ 0,40/km] • Limite terrestre: 650 km</span>
          </div>
          <div class="text-slate-500 font-mono text-[11px]">
            Parâmetros de Auditoria Logística • Delegação = 32 PAX
          </div>
        </div>
      </section>

      <!-- CAMADA 2: PLACAR MACRO EXECUTIVO CONSOLIDADO (C + D) -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 class="w-6 h-6 text-emerald-400" />
              Placar Macro Executivo da Pirâmide Nacional
            </h2>
            <p class="text-sm text-slate-400 mt-0.5">
              Comparativo consolidado do ecossistema das Séries C e D (Temporada 1 Proposta vs. Status Quo CBF 2026).
            </p>
          </div>
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <BarChart3 class="w-4 h-4 text-indigo-400" />
            <span>Otimização MILP / CP-SAT + TTP-k</span>
          </div>
        </div>

        <!-- 6 KPI CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Card 1: Clubes -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Clubes com Calendário Nacional</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                +{baselineData.comparativo_macro.variacoes_impacto.clubes_diff_pct}%
              </span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-extrabold text-white">{baselineData.comparativo_macro.modelo_proposto_t1.total_clubes}</span>
              <span class="text-xs text-slate-500 line-through">CBF: {baselineData.comparativo_macro.cbf_status_quo.total_clubes}</span>
            </div>
            <p class="text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
              Expansão de <strong>+88 agremiações</strong> profissionais ativas, eliminando o isolamento desportivo de dezenas de municípios.
            </p>
          </div>

          <!-- Card 2: Partidas -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Partidas Oficiais Realizadas</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                +{baselineData.comparativo_macro.variacoes_impacto.jogos_diff_pct}%
              </span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-extrabold text-white">{baselineData.comparativo_macro.modelo_proposto_t1.total_jogos.toLocaleString('pt-BR')}</span>
              <span class="text-xs text-slate-500 line-through">CBF: {baselineData.comparativo_macro.cbf_status_quo.total_jogos.toLocaleString('pt-BR')}</span>
            </div>
            <p class="text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
              Salto de <strong>+1.201 jogos no ano</strong> (~2,6x mais atividade), alimentando o ecossistema comercial e os direitos locais.
            </p>
          </div>

          <!-- Card 3: Orçamento Global CBF -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Orçamento Logístico Anual CBF</span>
              <span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                +{baselineData.comparativo_macro.variacoes_impacto.custo_total_diff_pct}%
              </span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-extrabold text-white">{formatCurrency(baselineData.comparativo_macro.modelo_proposto_t1.custo_total_brl)}</span>
              <span class="text-xs text-slate-500 line-through">{formatCurrency(baselineData.comparativo_macro.cbf_status_quo.custo_total_brl)}</span>
            </div>
            <p class="text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
              Variação controlada de apenas <strong>+R$ 4,35 milhões</strong> para viabilizar um torneio com 2,6 vezes mais confrontos.
            </p>
          </div>

          <!-- Card 4: Custo Médio Unitário / Jogo -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Custo Médio Unitário / Jogo</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {baselineData.comparativo_macro.variacoes_impacto.custo_medio_jogo_diff_pct}%
              </span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-extrabold text-emerald-400">{formatCurrency(baselineData.comparativo_macro.modelo_proposto_t1.custo_medio_jogo_brl)}</span>
              <span class="text-xs text-slate-500 line-through">{formatCurrency(baselineData.comparativo_macro.cbf_status_quo.custo_medio_jogo_brl)}</span>
            </div>
            <p class="text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
              Redução unitária de <strong>R$ 62.174 por partida</strong> devido à regionalização e eliminação de conexões aéreas ociosas.
            </p>
          </div>

          <!-- Card 5: Distância Média por Confronto -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Distância Média por Confronto</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {baselineData.comparativo_macro.variacoes_impacto.distancia_media_jogo_diff_pct}%
              </span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-extrabold text-emerald-400">{formatKm(baselineData.comparativo_macro.modelo_proposto_t1.distancia_media_jogo_km)}</span>
              <span class="text-xs text-slate-500 line-through">{formatKm(baselineData.comparativo_macro.cbf_status_quo.distancia_media_jogo_km)}</span>
            </div>
            <p class="text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
              Desgaste físico mitigado em <strong>-808 km por viagem</strong>, aumentando a integridade física de atletas e reduzindo emissões.
            </p>
          </div>

          <!-- Card 6: Economia de Turnês TTP -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Economia Gerada por Turnês TTP</span>
              <span class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                Travelling Tournament
              </span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-extrabold text-cyan-400">{formatCurrency(baselineData.comparativo_macro.modelo_proposto_t1.economia_turnes_ttp_brl)}</span>
            </div>
            <p class="text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
              Economia direta auferida encadeando 2 ou mais jogos fora consecutivos (TTP-2 até TTP-6), eliminando viagens de retorno intermediárias à sede.
            </p>
          </div>
        </div>
      </section>

      <!-- CAMADA 3: O DUELO DAS DIVISÕES (SÉRIE C vs SÉRIE D & ANÁLISE DE TRADE-OFFS) -->
      <section class="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
              <Layers class="w-6 h-6 text-emerald-400" />
              O Duelo das Divisões: Decomposição e Trade-offs
            </h2>
            <p class="text-sm text-slate-400 mt-1">
              Avaliação detalhada da Série C, da Série D e da compensação orçamentária entre divisões.
            </p>
          </div>

          <!-- Seletor de Abas da Divisão -->
          <div class="flex flex-wrap p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              class="px-4 py-2 rounded-lg font-semibold transition {activeDivisionTab === 'consolidado' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
              on:click={() => activeDivisionTab = 'consolidado'}
            >
              Visão Geral
            </button>
            <button
              class="px-4 py-2 rounded-lg font-semibold transition {activeDivisionTab === 'serie_c' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
              on:click={() => activeDivisionTab = 'serie_c'}
            >
              Série C (60 Clubes)
            </button>
            <button
              class="px-4 py-2 rounded-lg font-semibold transition {activeDivisionTab === 'serie_d' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
              on:click={() => activeDivisionTab = 'serie_d'}
            >
              Série D (144 Clubes)
            </button>
            <button
              class="px-4 py-2 rounded-lg font-semibold transition {activeDivisionTab === 'tradeoffs' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
              on:click={() => activeDivisionTab = 'tradeoffs'}
            >
              Matriz de Prós e Contras
            </button>
          </div>
        </div>

        {#if activeDivisionTab === 'consolidado'}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8" transition:fade={{ duration: 150 }}>
            <!-- Card Comparativo Série C -->
            <div class="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Divisão de Acesso Intermediária</span>
                <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">60 Clubes • 4 Conferências</span>
              </div>
              <h3 class="text-xl font-bold text-white">Nova Série C: Quadruplicação de Jogos</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                {baselineData.divisoes.serie_c.resumo_academico}
              </p>

              <div class="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span class="text-slate-500 block">Clubes Participantes</span>
                  <span class="text-base font-bold text-white">20 → 60 (+200%)</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Total de Partidas</span>
                  <span class="text-base font-bold text-white">216 → 863 (+299%)</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Custo Total da Divisão</span>
                  <span class="text-base font-bold text-amber-400">R$ 34,7M → R$ 50,7M (+46%)</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Custo Unitário / Jogo</span>
                  <span class="text-base font-bold text-emerald-400">R$ 160,8k → R$ 58,8k (-63,4%)</span>
                </div>
              </div>
            </div>

            <!-- Card Comparativo Série D -->
            <div class="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Base da Pirâmide Profissional</span>
                <span class="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">Economia Direta de R$ 11,66M</span>
              </div>
              <h3 class="text-xl font-bold text-white">Nova Série D: A Alavanca de Eficiência</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                {baselineData.divisoes.serie_d.resumo_academico}
              </p>

              <div class="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span class="text-slate-500 block">Clubes Participantes</span>
                  <span class="text-base font-bold text-white">96 → 144 (+50%)</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Total de Partidas</span>
                  <span class="text-base font-bold text-white">542 → 1.096 (+102%)</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Custo Total da Divisão</span>
                  <span class="text-base font-bold text-emerald-400">R$ 44,9M → R$ 33,2M (-26,0%)</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Custo Unitário / Jogo</span>
                  <span class="text-base font-bold text-emerald-400">R$ 82,8k → R$ 30,3k (-63,4%)</span>
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if activeDivisionTab === 'serie_c'}
          <div class="space-y-6" transition:fade={{ duration: 150 }}>
            <div class="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                Série C: Decomposição Orçamentária e Estrutura de Conferências
              </h4>
              <p class="text-sm text-slate-300 leading-relaxed">
                A Série C da CBF opera hoje em fase única de grupo continental (20 clubes, 19 rodadas) seguida de 2 quadrangulares nacionais. No modelo proposto, <strong>60 clubes são organizados em 4 Conferências Regionais</strong> (Sudeste 16, Nordeste 16, Sul 14 e Norte-Centro 14) com turno e returno completos.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-xs text-slate-400 block">Fase Regular</span>
                <span class="text-xl font-bold text-white mt-1 block">{formatCurrency(baselineData.divisoes.serie_c.modelo_proposto.custo_fase_regular_brl)}</span>
                <span class="text-xs text-slate-500">844 partidas em 4 conferências regionais</span>
              </div>
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-xs text-slate-400 block">Playoffs Esperados (Monte Carlo)</span>
                <span class="text-xl font-bold text-white mt-1 block">{formatCurrency(baselineData.divisoes.serie_c.modelo_proposto.custo_playoffs_esperado_brl)}</span>
                <span class="text-xs text-slate-500">Mata-mata de acesso nacional</span>
              </div>
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-xs text-slate-400 block">Economia por Turnês TTP</span>
                <span class="text-xl font-bold text-cyan-400 mt-1 block">{formatCurrency(baselineData.divisoes.serie_c.modelo_proposto.economia_turnes_ttp_brl)}</span>
                <span class="text-xs text-slate-500">Viagens consecutivas de visitante</span>
              </div>
            </div>
          </div>
        {/if}

        {#if activeDivisionTab === 'serie_d'}
          <div class="space-y-6" transition:fade={{ duration: 150 }}>
            <div class="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-cyan-400"></span>
                Série D: 18 Ligas Regionais Bounded-Radius (A Prova de Eficiência)
              </h4>
              <p class="text-sm text-slate-300 leading-relaxed">
                A Série D atual da CBF cruza times de regiões distantes precocemente, gerando custos de R$ 44,89 milhões para apenas 96 equipes. Ao subdividir a Série D em <strong>18 Ligas Regionais de raio restrito</strong>, <strong>75,9% dos trajetos passam a ser 100% rodoviários</strong> em ônibus leito fretado.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-xs text-slate-400 block">Economia Direta para a CBF</span>
                <span class="text-xl font-bold text-emerald-400 mt-1 block">R$ 11.662.805,74</span>
                <span class="text-xs text-slate-500">-26,0% em relação ao gasto atual da CBF</span>
              </div>
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-xs text-slate-400 block">Participação Rodoviária</span>
                <span class="text-xl font-bold text-white mt-1 block">75,9% dos confrontos</span>
                <span class="text-xs text-slate-500">Ônibus leito com limite operacional de 650 km</span>
              </div>
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-xs text-slate-400 block">Custo Médio Unitário / Jogo</span>
                <span class="text-xl font-bold text-emerald-400 mt-1 block">{formatCurrency(baselineData.divisoes.serie_d.modelo_proposto.custo_medio_jogo_brl)}</span>
                <span class="text-xs text-slate-500">Queda de 63,4% vs R$ 82,8k da CBF</span>
              </div>
            </div>
          </div>
        {/if}

        {#if activeDivisionTab === 'tradeoffs'}
          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-1" transition:fade={{ duration: 150 }}>
            <table class="w-full text-left text-xs border-collapse table-fixed">
              <colgroup>
                <col class="w-[22%]" />
                <col class="w-[39%]" />
                <col class="w-[39%]" />
              </colgroup>
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/90">
                  <th class="py-3.5 px-5">Dimensão de Análise</th>
                  <th class="py-3.5 px-5 text-emerald-400">Pontos Positivos & Ganhos Sistêmicos</th>
                  <th class="py-3.5 px-5 text-amber-400">Pontos Críticos & Custos de Oportunidade (Trade-offs)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr class="hover:bg-slate-900/40 transition">
                  <td class="py-4 px-5 align-top">
                    <div class="font-bold text-white text-sm">Série C</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">60 Clubes • 4 Conferências</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• <strong>Triplicação de agremiações</strong> participantes (de 20 para 60 clubes).</div>
                    <div>• <strong>Custo unitário por jogo despenca 63,4%</strong> (R$ 58,8k vs R$ 160,8k da CBF).</div>
                    <div>• Calendário anual regular garantido com 26 a 37 partidas oficiais por clube.</div>
                    <div>• Conferências regionais fomentam rivalidades estaduais e interestaduais contíguas.</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• <strong>Aumento do custo absoluto da divisão:</strong> O gasto total da Série C sobe de R$ 34,7M para R$ 50,7M (+46,1%). A CBF precisará alocar mais recursos brutos nesta divisão devido ao quadruplicamento do total de confrontos (216 para 863 partidas).</div>
                  </td>
                </tr>

                <tr class="hover:bg-slate-900/40 transition">
                  <td class="py-4 px-5 align-top">
                    <div class="font-bold text-white text-sm">Série D</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">144 Clubes • 18 Ligas Regionais</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• <strong>Economia líquida direta de R$ 11,66 milhões (-26,0%)</strong> para os cofres da CBF.</div>
                    <div>• Inclusão de mais 48 clubes (+50%) e mais que o dobro de partidas (1.096 vs 542).</div>
                    <div>• <strong>75,9% dos confrontos</strong> operados em transporte rodoviário (ônibus leito fretado).</div>
                    <div>• Amortização que viabiliza financeiramente o sistema nacional consolidado.</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• <strong>Deslocamentos terrestres mais longos:</strong> O uso extensivo de ônibus leito com rotas de até 650 km exige planejamento logístico e repouso dos atletas, demandando rotinas de recuperação física superiores às de pontes aéreas diretas.</div>
                  </td>
                </tr>

                <tr class="hover:bg-slate-900/40 transition">
                  <td class="py-4 px-5 align-top">
                    <div class="font-bold text-white text-sm">Logística e Fisiologia</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Travelling Tournament (TTP-k)</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• <strong>R$ 31,14 milhões economizados</strong> encadeando confrontos consecutivos sem retorno à sede.</div>
                    <div>• Redução de <strong>63,8% na distância média por viagem</strong> (1.267 km para 458 km).</div>
                    <div>• Mitigação substancial da pegada de carbono com a redução de voos comerciais isolados.</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5 text-amber-300/90">
                    <div>• <strong>Janelas Estendidas de Turnê (TTP até 6) no Norte-Centro:</strong> Para viabilizar a redução de custos em regiões com malha logística rarefeita e distâncias continentais (notadamente Norte e Centro-Oeste), o modelo adota turnês de até 6 jogos consecutivos como visitante. Isso impõe um desafio operacional e fisiológico evidente: atletas e comissões técnicas passam semanas em regime itinerante longe de suas cidades para evitar múltiplos voos de retorno à sede, que seriam financeiramente proibitivos.</div>
                  </td>
                </tr>

                <tr class="hover:bg-slate-900/40 transition">
                  <td class="py-4 px-5 align-top">
                    <div class="font-bold text-white text-sm">Orçamento Consolidado CBF</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Séries C + D Integradas</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• Variação líquida contida de <strong>apenas +5,46% (+R$ 4,35M)</strong> no orçamento global anual.</div>
                    <div>• A economia da Série D cobre aproximadamente 73% do investimento adicional da Série C.</div>
                    <div>• Estabilidade contratual para negociação antecipada de lotes de passagens e ônibus fretados.</div>
                  </td>
                  <td class="py-4 px-5 align-top leading-relaxed space-y-1.5">
                    <div>• <strong>Rigor Regulatório do Elevador Fechado:</strong> O modelo requer a manutenção estrita da regra de cardinalidade regional (&Delta;K = 0) entre promoções e rebaixamentos para evitar contaminação orçamentária entre conferências ao longo das temporadas.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
      </section>

      <!-- CAMADA 4: MATRIZ FEDERATIVA DAS 27 UFs (EQUITATIVA E SEM DESERTOS) -->
      <section class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
              <Globe class="w-6 h-6 text-emerald-400" />
              Matriz Federativa das 27 UFs: O Fim dos Desertos Desportivos
            </h2>
            <p class="text-sm text-slate-400 mt-1">
              Distribuição geográfica equilibrada: garantia de ao menos 2 clubes na Série D para todas as 27 Unidades da Federação.
            </p>
          </div>

          <!-- Filtros da Matriz Federativa -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative">
              <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar estado ou UF..."
                bind:value={federativeSearch}
                class="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              bind:value={federativeRegionFilter}
              class="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODAS">Todas as Regiões</option>
              <option value="Sudeste">Sudeste</option>
              <option value="Sul">Sul</option>
              <option value="Nordeste">Nordeste</option>
              <option value="Norte">Norte</option>
              <option value="Centro-Oeste">Centro-Oeste</option>
            </select>
          </div>
        </div>

        <div class="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div class="overflow-x-auto max-h-[440px] overflow-y-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 z-10">
                <tr class="text-slate-400 uppercase tracking-wider font-semibold">
                  <th class="py-3 px-4 cursor-pointer hover:text-white" on:click={() => handleFederativeSort('uf_sigla')}>
                    UF <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-4 cursor-pointer hover:text-white" on:click={() => handleFederativeSort('uf_nome')}>
                    Estado <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-4 cursor-pointer hover:text-white" on:click={() => handleFederativeSort('regiao_macro')}>
                    Região <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-4 text-right cursor-pointer hover:text-white" on:click={() => handleFederativeSort('populacao_ibge_2022')}>
                    População IBGE <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-3 text-center">Série A</th>
                  <th class="py-3 px-3 text-center">Série B</th>
                  <th class="py-3 px-3 text-center font-bold text-emerald-400 cursor-pointer hover:text-emerald-300" on:click={() => handleFederativeSort('clubes_serie_c_proposta')}>
                    Série C <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-3 text-center font-bold text-cyan-400 cursor-pointer hover:text-cyan-300" on:click={() => handleFederativeSort('clubes_serie_d_proposta')}>
                    Série D <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-4 text-center font-bold text-white cursor-pointer hover:text-emerald-400" on:click={() => handleFederativeSort('total_piramide_nacional')}>
                    Total Pirâmide <ArrowUpDown class="w-3 h-3 inline ml-1 opacity-60" />
                  </th>
                  <th class="py-3 px-4 text-center">Cota Série D</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                {#each filteredFederativeMatrix as uf}
                  <tr class="hover:bg-slate-800/40 transition font-mono">
                    <td class="py-3 px-4 font-bold text-emerald-400">{uf.uf_sigla}</td>
                    <td class="py-3 px-4 font-sans font-medium text-white">{uf.uf_nome}</td>
                    <td class="py-3 px-4 font-sans text-slate-400">{uf.regiao_macro}</td>
                    <td class="py-3 px-4 text-right text-slate-400">{uf.populacao_ibge_2022.toLocaleString('pt-BR')} ({uf.pct_pop_brasil}%)</td>
                    <td class="py-3 px-3 text-center text-slate-500">{uf.clubes_serie_a}</td>
                    <td class="py-3 px-3 text-center text-slate-500">{uf.clubes_serie_b}</td>
                    <td class="py-3 px-3 text-center font-bold text-emerald-400">{uf.clubes_serie_c_proposta}</td>
                    <td class="py-3 px-3 text-center font-bold text-cyan-400">{uf.clubes_serie_d_proposta}</td>
                    <td class="py-3 px-4 text-center font-bold text-white bg-slate-950/40">{uf.total_piramide_nacional}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 class="w-3 h-3" />
                        &ge; 2 Clubes
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4">
            <span>Exibindo {filteredFederativeMatrix.length} de 27 Unidades da Federação auditadas.</span>
            <span class="text-emerald-400 font-semibold">Todas as 27 Unidades da Federação possuem ao menos 2 clubes garantidos com calendário nacional.</span>
          </div>
        </div>
      </section>

      <!-- CAMADA 5: ANÁLISE MICRO POR CLUBE (CASOS EMBLEMÁTICOS & MAPAS LEAFLET) -->
      <section id="micro-map-section" class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
              <Compass class="w-6 h-6 text-emerald-400" />
              Análise Micro por Clube
            </h2>
            <p class="text-sm text-slate-400 mt-1">
              Visualização cartográfica comparativa: rotas dispersas da CBF (em vermelho) vs. circuitos otimizados com turnês TTP (em verde).
            </p>
          </div>
        </div>

        <!-- Alertas Metodológicos: Fase de Grupos & Engenharia de Dados Multimodal -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-3 shadow-md">
            <Info class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div class="leading-relaxed">
              <strong class="text-white">Fase de Grupos Regular:</strong>
              Esta análise quantifica estritamente a <strong>fase inicial em grupos (jogos mínimos garantidos no calendário anual)</strong>. O cálculo <strong>não inclui</strong> eventuais partidas de mata-matas, play-ins ou fases eliminatórias subsequentes.
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-3 shadow-md">
            <Route class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div class="leading-relaxed">
              <strong class="text-white">Engenharia de Dados Real (Sem Linhas Retas):</strong>
              O solver CP-SAT utilizou <strong>malha rodoviária real OSRM</strong> (asfalto, relevo e balsas) e <strong>grafo aéreo oficial da ANAC (GeoFlight-BR)</strong> com algoritmo de Dijkstra sobre voos regulares comerciais ativos (&ge; 52 ops/ano), eliminando "voos fantasmas" e aproximações euclidianas.
            </div>
          </div>
        </div>

        <!-- Seletor dos 6 Casos Emblemáticos por Região -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {#each baselineData.casos_emblematicos as caso}
            <button
              class="p-3.5 rounded-xl text-left transition border {selectedCaseId === caso.id ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'}"
              on:click={() => setEmblematicCase(caso.id)}
            >
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <span>{caso.regiao}</span>
                <span class="px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 font-mono">Série {caso.divisao}</span>
              </div>
              <div class="font-bold text-sm text-white truncate">{caso.nome}</div>
              <div class="text-[11px] text-slate-400 mt-1 font-mono">
                {caso.baseline.jogos_fora}j → <strong class="text-emerald-400">{caso.proposto.jogos_fora}j</strong>
              </div>
            </button>
          {/each}
        </div>

        <!-- Resumo Executivo do Caso Selecionado -->
        {#if selectedCase}
          <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Análise do Caso Selecionado</span>
                <h3 class="text-xl font-extrabold text-white mt-0.5">{selectedCase.titulo || selectedCase.nome}</h3>
                <p class="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {selectedCase.destaque}
                </p>
              </div>

              <div class="flex items-center gap-4 text-xs font-mono shrink-0">
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span class="text-slate-500 block text-[10px] uppercase font-sans">Km Média / Jogo</span>
                  <span class="text-slate-400 line-through text-[11px]">{formatKm(selectedCase.baseline.km_medio || (selectedCase.baseline.km_total / selectedCase.baseline.jogos_fora))}</span>
                  <span class="text-emerald-400 font-bold block text-sm">{formatKm(selectedCase.proposto.km_medio)}</span>
                </div>

                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span class="text-slate-500 block text-[10px] uppercase font-sans">Expedições / Turnês</span>
                  <span class="text-slate-400 line-through text-[11px]">{selectedCase.baseline.jogos_fora} bate-voltas</span>
                  <span class="text-cyan-400 font-bold block text-sm">{(selectedCase.proposto.total_turnes || selectedCase.proposto.turnes?.length || selectedCase.proposto.partidas?.length || 0)} {selectedCase.proposto.turnes ? 'turnês' : 'jogos'}</span>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- DUAL LEAFLET MAPS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Mapa Esquerdo: CBF Baseline -->
          <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl flex flex-col h-[480px]">
            <div class="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                <span class="font-bold text-sm text-white">Status Quo CBF 2026 (Sem Turnês)</span>
              </div>
              <span class="text-xs text-slate-400 font-mono">
                {selectedCase?.baseline?.jogos_fora} bate-voltas • {formatKm(selectedCase?.baseline?.km_total)}
              </span>
            </div>
            <div class="relative flex-1 bg-slate-950">
              <div bind:this={mapCbfElement} class="w-full h-full"></div>
              <div class="absolute bottom-3 left-3 z-[400] px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur shadow">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span>
                Linhas radiais: viagens isoladas de ida e volta à sede
              </div>
            </div>
          </div>

          <!-- Mapa Direito: Modelo Proposto Otimizado (Turnês TTP) -->
          <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl flex flex-col h-[480px]">
            <div class="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span class="font-bold text-sm text-white">Modelo Proposto (Circuitos de Turnê TTP)</span>
              </div>
              <div class="flex items-center gap-3">
                {#if selectedTourId}
                  <button
                    class="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    on:click={() => toggleTourHighlight(selectedTourId)}
                  >
                    <RefreshCw class="w-3 h-3" /> Ver todas as turnês
                  </button>
                {/if}
                <span class="text-xs text-emerald-400 font-mono font-bold">
                  {(selectedCase?.proposto?.total_turnes || selectedCase?.proposto?.turnes?.length || selectedCase?.proposto?.partidas?.length || 0)} {selectedCase?.proposto?.turnes ? 'turnês' : 'jogos'} • {formatKm(selectedCase?.proposto?.km_total)}
                </span>
              </div>
            </div>
            <div class="relative flex-1 bg-slate-950">
              <div bind:this={mapPropostoElement} class="w-full h-full"></div>
              <div class="absolute bottom-3 left-3 z-[400] px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur shadow flex items-center gap-2">
                <Route class="w-3.5 h-3.5 text-emerald-400" />
                <span>Circuitos fechados com turnês itinerantes consecutivas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DETALHAMENTO DAS TURNÊS / EXPEDIÇÕES DO MODELO PROPOSTO -->
        {#if selectedCase && selectedCase.proposto?.turnes}
          <div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <Route class="w-5 h-5 text-emerald-400" />
                  Sequenciamento das Turnês Itinerantes: {selectedCase.nome}
                </h3>
                <p class="text-xs text-slate-400 mt-1">
                  Exibição das {selectedCase.proposto.turnes.length} expedições com as respectivas rodadas, itinerários fechados e economia de quilometragem gerada pelo encadeamento.
                </p>
              </div>

              <span class="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Total de Jogos Fora: <strong>{selectedCase.proposto.jogos_fora} partidas</strong> em <strong>{selectedCase.proposto.turnes.length} expedições</strong>
              </span>
            </div>

            <!-- Grid de Cards das Turnês -->
            <div class="grid grid-cols-1 gap-5">
              {#each selectedCase.proposto.turnes as tour, tIdx}
                {@const tourColor = TOUR_COLORS[tIdx % TOUR_COLORS.length]}
                {@const isSelected = selectedTourId === tour.tour_id}
                <div class="p-5 rounded-xl border transition {isSelected ? 'bg-slate-900/90 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg' : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'}">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div class="flex items-center gap-3">
                      <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background-color: {tourColor}"></span>
                      <div>
                        <h4 class="font-bold text-sm text-white flex items-center gap-2">
                          {tour.titulo}
                          {#if tour.total_jogos > 1}
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              TTP-{tour.total_jogos} ({tour.total_jogos} jogos seguidos fora)
                            </span>
                          {:else}
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                              Bate-Volta Isolado
                            </span>
                          {/if}
                        </h4>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 font-mono text-xs">
                      <div class="text-right">
                        <span class="text-slate-400 block text-[11px]">Circuito da Turnê</span>
                        <strong class="text-white text-sm">{formatKm(tour.km_circuito)}</strong>
                      </div>
                      {#if tour.pct_economia > 0}
                        <div class="text-right pl-3 border-l border-slate-800">
                          <span class="text-slate-400 block text-[11px]">Economia vs Bate-Volta</span>
                          <strong class="text-emerald-400 text-sm">-{tour.pct_economia}% ({formatKm(tour.km_economizada)})</strong>
                        </div>
                      {/if}

                      <button
                        class="px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition ml-2 {isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                        on:click={() => toggleTourHighlight(tour.tour_id)}
                      >
                        {isSelected ? 'Turnê em Destaque' : 'Destacar no Mapa'}
                      </button>
                    </div>
                  </div>

                  <!-- Itinerário em Linha de Fluxo -->
                  <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2 overflow-x-auto font-mono mb-4">
                    <MapPin class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span class="truncate">{tour.itinerario_formatado}</span>
                  </div>

                  <!-- Tabela das Partidas da Turnê -->
                  <div class="overflow-x-auto rounded-lg border border-slate-800/60">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="bg-slate-900 text-slate-400 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th class="py-2.5 px-3 w-20">Rodada</th>
                          <th class="py-2.5 px-3">Adversário Visitado</th>
                          <th class="py-2.5 px-3">Cidade / UF</th>
                          <th class="py-2.5 px-3 text-right">Distância do Trecho</th>
                          <th class="py-2.5 px-3 text-right">Distância da Sede</th>
                          <th class="py-2.5 px-3 text-center">Modal</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {#each tour.partidas as p}
                          <tr class="hover:bg-slate-900/50">
                            <td class="py-2 px-3">
                              <span class="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-[11px]">
                                R{p.rodada}
                              </span>
                            </td>
                            <td class="py-2 px-3 font-sans font-semibold text-white">{p.adversario_nome}</td>
                            <td class="py-2 px-3 font-sans text-slate-400">{p.cidade} - {p.uf}</td>
                            <td class="py-2 px-3 text-right text-emerald-400 font-bold">{formatKm(p.km_trecho)}</td>
                            <td class="py-2 px-3 text-right text-slate-400">{formatKm(p.km_direto_sede)}</td>
                            <td class="py-2 px-3 text-center font-sans">
                              {#if p.modal === 'local'}
                                <span class="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-flex items-center gap-1 font-bold">
                                  <MapPin class="w-3 h-3" /> Urbano / Local
                                </span>
                              {:else if p.modal === 'aereo'}
                                <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1">
                                  <Plane class="w-3 h-3" /> Aéreo
                                </span>
                              {:else if p.modal === 'bate_volta'}
                                <span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                  <Bus class="w-3 h-3" /> Bate-Volta
                                </span>
                              {:else}
                                <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                  <Bus class="w-3 h-3" /> Ônibus
                                </span>
                              {/if}
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </section>

    {/if}
  </div>
</main>
