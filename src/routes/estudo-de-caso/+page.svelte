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
    Scale, Globe, Route, ArrowRight, Eye, RefreshCw, Table2
  } from 'lucide-svelte';

  let L;
  let loadingMain = true;
  let errorMsg = null;

  // Master Executive Dataset
  let baselineData = null;

  // Formatos Oficiais CBF 2026 (Dataset Estruturado)
  $: officialFormats = baselineData?.formatos_oficiais_cbf_2026 || null;
  $: serieCFormats = officialFormats?.serie_c_cbf_2026 || null;
  $: serieDFormats = officialFormats?.serie_d_cbf_2026 || null;

  // Explorador Interativo de Tabelas e Grupos da 1ª Fase
  let selectedGroupDIdx = 0; // 0 to 15 (A1 to A16)
  let selectedConfCIdx = 0; // 0 to 3 (Sudeste, Sul, Nordeste, Norte-Centro)
  let serieCTableViewMode = 'cbf'; // 'cbf' | 'proposto'
  let serieDTableViewMode = 'cbf'; // 'cbf' | 'proposto'
  let selectedLigaDIdx = 0; // 0 to 17

  $: tabelasFase1 = baselineData?.tabelas_fase1 || null;
  $: gruposSerieDCbf = tabelasFase1?.serie_d_cbf_grupos || [];
  $: clubesSerieCCbf = tabelasFase1?.serie_c_cbf_clubes || [];
  $: confsSerieCProp = tabelasFase1?.serie_c_proposto_conferencias || [];
  $: ligasSerieDProp = tabelasFase1?.serie_d_proposto_ligas || [];

  $: currentGroupD = gruposSerieDCbf[selectedGroupDIdx] || null;
  $: currentConfC = confsSerieCProp[selectedConfCIdx] || null;
  $: currentLigaD = ligasSerieDProp[selectedLigaDIdx] || null;

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
          <div class="space-y-8" transition:fade={{ duration: 150 }}>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <span class="text-base font-bold text-white">610 → 1.096 (+79,7%)</span>
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

            <!-- Síntese Sistêmica das Duas Divisões Combinadas -->
            {#if baselineData.comparativo_macro}
              <div class="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 class="text-sm font-bold text-white flex items-center gap-2">
                      <Scale class="w-4 h-4 text-emerald-400" />
                      Balanço Macroeconômico Consolidado (Séries C e D Combinadas)
                    </h4>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Comparação entre o orçamento consolidado CBF 2026 e o modelo otimizado com turnês TTP.
                    </p>
                  </div>
                  <span class="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    204 Clubes • 1.959 Partidas
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="text-slate-500 block text-[11px]">Clubes no Sistema</span>
                    <span class="text-base font-bold text-white font-mono mt-0.5 block">116 → 204</span>
                    <span class="text-[10px] text-emerald-400 font-semibold">+75,9% inclusão</span>
                  </div>
                  <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="text-slate-500 block text-[11px]">Partidas Disputadas</span>
                    <span class="text-base font-bold text-white font-mono mt-0.5 block">758 → 1.959</span>
                    <span class="text-[10px] text-emerald-400 font-semibold">+158,4% volume</span>
                  </div>
                  <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="text-slate-500 block text-[11px]">Custo Total Logístico</span>
                    <span class="text-base font-bold text-white font-mono mt-0.5 block">R$ 79,6M → R$ 84,0M</span>
                    <span class="text-[10px] text-amber-400 font-semibold">+5,5% variação líquida</span>
                  </div>
                  <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="text-slate-500 block text-[11px]">Custo Médio / Partida</span>
                    <span class="text-base font-bold text-emerald-400 font-mono mt-0.5 block">R$ 105k → R$ 42,9k</span>
                    <span class="text-[10px] text-emerald-400 font-semibold">-59,2% eficiência</span>
                  </div>
                  <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="text-slate-500 block text-[11px]">Distância Média / Jogo</span>
                    <span class="text-base font-bold text-emerald-400 font-mono mt-0.5 block">1.268 → 459 km</span>
                    <span class="text-[10px] text-emerald-400 font-semibold">-63,8% km viajado</span>
                  </div>
                  <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="text-slate-500 block text-[11px]">Calendário Ativo Médio</span>
                    <span class="text-base font-bold text-cyan-400 font-mono mt-0.5 block">3,8 → 7,8 meses</span>
                    <span class="text-[10px] text-cyan-400 font-semibold">+105% perenidade</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        {#if activeDivisionTab === 'serie_c'}
          <div class="space-y-8" transition:fade={{ duration: 150 }}>
            <!-- 1. Header & Contexto Regulamentar -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Shield class="w-3.5 h-3.5" />
                  Divisão de Acesso Intermediária • Auditoria Oficial REC CBF 2026
                </div>
                <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                  20 Clubes Oficiais ➔ 60 Clubes Propostos
                </span>
              </div>

              <div>
                <h3 class="text-xl font-bold text-white">
                  Série C: Diagnóstico Estrutural CBF 2026 vs. Modelo de 4 Conferências
                </h3>
                <p class="text-sm text-slate-300 mt-2 leading-relaxed">
                  No formato oficial da CBF para 2026, a Série C é estruturada em <strong>grupo único continental</strong> com 20 clubes disputando 19 rodadas em turno desbalanceado, seguido por quadrangulares de acesso. Apesar de ser o terceiro escalão nacional, o modelo replica distâncias de primeira divisão com alto custo unitário e causa desmobilização prematura de 60% das agremiações.
                </p>
              </div>

              <!-- Indicadores Macroeconômicos CBF 2026 -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800/80 text-xs">
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Clubes Participantes</span>
                  <span class="text-base font-bold text-white font-mono mt-0.5 block">20 clubes</span>
                  <span class="text-[10px] text-slate-500">19 a 27 jogos/clube</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Total de Partidas</span>
                  <span class="text-base font-bold text-white font-mono mt-0.5 block">216 jogos</span>
                  <span class="text-[10px] text-slate-500">27 datas (Abr-Out)</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Custo Total CBF</span>
                  <span class="text-base font-bold text-amber-400 font-mono mt-0.5 block">R$ 34,73M</span>
                  <span class="text-[10px] text-slate-500">Subsídio centralizado</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Custo Médio / Jogo</span>
                  <span class="text-base font-bold text-rose-400 font-mono mt-0.5 block">R$ 160.766</span>
                  <span class="text-[10px] text-slate-500">Viagens isoladas</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Divisão Modal CBF</span>
                  <span class="text-base font-bold text-cyan-400 font-mono mt-0.5 block">71,5% Aéreo</span>
                  <span class="text-[10px] text-slate-500">28,5% rodoviário</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Distância Média</span>
                  <span class="text-base font-bold text-white font-mono mt-0.5 block">1.580 km</span>
                  <span class="text-[10px] text-slate-500">Média por deslocamento</span>
                </div>
              </div>

              <!-- Critérios de Entrada -->
              <div class="p-3 rounded-lg bg-slate-900/40 border border-slate-800/40 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400">
                <span class="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" /> Critérios de Entrada Oficiais:
                </span>
                <span>• 4 rebaixados da Série B (2025)</span>
                <span>• 12 remanescentes da Série C (5º ao 16º)</span>
                <span>• 4 semifinalistas promovidos da Série D (2025)</span>
              </div>
            </div>

            <!-- 2. Linha do Tempo das Fases & Gargalos Estruturais -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 class="text-base font-bold text-white flex items-center gap-2">
                    <Activity class="w-4 h-4 text-emerald-400" />
                    Fluxo das Fases Oficiais & Diagnóstico de Gargalos da Série C (CBF 2026)
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Decomposição passo a passo das 3 fases regulamentares e os impactos de ociosidade e custo.
                  </p>
                </div>
                <span class="text-[11px] px-2.5 py-1 rounded bg-slate-900 text-slate-400 font-mono border border-slate-800">
                  3 Fases • 27 Rodadas
                </span>
              </div>

              <div class="space-y-4">
                <!-- Fase 1 -->
                <div class="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">1</span>
                      <span class="text-sm font-bold text-white">Primeira Fase: Grupo Único Continental</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">20 clubes • 19 rodadas • 190 partidas</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Disputada em turno único simples com todos os 20 clubes se enfrentando apenas uma vez. Os 8 primeiros avançam para a 2ª fase, os classificados de 9º a 16º permanecem na divisão mas encerram sua temporada, e os 4 últimos (17º a 20º) são rebaixados à Série D.
                  </p>

                  <!-- Alertas de Gargalos -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <AlertCircle class="w-3.5 h-3.5" /> Assimetria de Mandos
                      </div>
                      <p class="text-[11px] text-slate-300 leading-relaxed">
                        10 clubes jogam 10 vezes em casa e 9 fora, enquanto os outros 10 jogam 9 em casa e 10 fora por sorteio técnico, rompendo a isonomia esportiva primária.
                      </p>
                    </div>
                    <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertCircle class="w-3.5 h-3.5" /> Inatividade Precoce (60%)
                      </div>
                      <p class="text-[11px] text-slate-300 leading-relaxed">
                        12 das 20 agremiações (60%) encerram as atividades em agosto com apenas 19 partidas, enfrentando 8 meses ininterruptos sem futebol oficial ou receitas de bilheteria.
                      </p>
                    </div>
                    <div class="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        <AlertCircle class="w-3.5 h-3.5" /> Custo Unitário Elevado
                      </div>
                      <p class="text-[11px] text-slate-300 leading-relaxed">
                        Deslocamentos radiais isolados de até 3.500 km sem agrupamento em turnês geram um custo médio por partida de R$ 160.766,43 (71,5% em modal aéreo comercial).
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Fase 2 -->
                <div class="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">2</span>
                      <span class="text-sm font-bold text-white">Segunda Fase: Quadrangulares do Acesso</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">8 clubes • 2 grupos de 4 • 6 rodadas • 24 partidas</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Os 8 melhores clubes são divididos em 2 chaves (Grupo B: 1º, 4º, 5º, 8º | Grupo C: 2º, 3º, 6º, 7º) em turno e returno (6 partidas). Os 2 melhores de cada grupo garantem acesso à Série B (4 promovidos), e o líder de cada grupo avança à grande final.
                  </p>
                  <div class="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-2">
                    <Info class="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Apenas 8 equipes usufruem do calendário de setembro e outubro; as demais 12 amargam a desmobilização forçada de suas comissões técnicas.</span>
                  </div>
                </div>

                <!-- Fase 3 -->
                <div class="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">3</span>
                      <span class="text-sm font-bold text-white">Terceira Fase: Grande Final Nacional</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">2 clubes • Ida e volta (180 min) • 2 partidas</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Confronto direto eliminatório de ida e volta entre os dois líderes dos quadrangulares. O clube com melhor pontuação acumulada decide em casa. O campeão garante vaga direta na 3ª Fase da Copa do Brasil subsequente.
                  </p>
                </div>
              </div>
            </div>

            <!-- Explorador Interativo de Clubes e Chaves da 1ª Fase da Série C -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h4 class="text-base font-bold text-white flex items-center gap-2">
                    <Table2 class="w-4 h-4 text-emerald-400" />
                    Explorador de Clubes e Chaves da 1ª Fase (Série C)
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Compare os 20 clubes no grupo único continental da CBF contra as 4 Conferências Regionais propostas.
                  </p>
                </div>

                <!-- Toggle CBF Oficial vs Modelo Proposto -->
                <div class="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0">
                  <button
                    class="px-3 py-1.5 rounded-lg font-semibold transition {serieCTableViewMode === 'cbf' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
                    on:click={() => serieCTableViewMode = 'cbf'}
                  >
                    Oficial CBF (Grupo Único - 20 Clubes)
                  </button>
                  <button
                    class="px-3 py-1.5 rounded-lg font-semibold transition {serieCTableViewMode === 'proposto' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
                    on:click={() => serieCTableViewMode = 'proposto'}
                  >
                    Modelo Proposto (4 Conferências - 60 Clubes)
                  </button>
                </div>
              </div>

              {#if serieCTableViewMode === 'cbf'}
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-xs text-slate-400">
                    <span>A tabela abaixo expõe a <strong>assimetria de mandos</strong> sorteada pela CBF (10 em casa vs 9 em casa):</span>
                    <span class="font-mono text-emerald-400">20 Clubes Continentais</span>
                  </div>

                  <div class="overflow-x-auto rounded-xl border border-slate-800/80 max-h-[460px] overflow-y-auto">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="sticky top-0 z-10">
                        <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900">
                          <th class="py-2.5 px-4 w-12 text-center">#</th>
                          <th class="py-2.5 px-4">Clube</th>
                          <th class="py-2.5 px-4">UF / Cidade</th>
                          <th class="py-2.5 px-4 text-center">Mandos (Casa / Fora)</th>
                          <th class="py-2.5 px-4">Km Total Fora</th>
                          <th class="py-2.5 px-4">Modal CBF</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-slate-300">
                        {#each clubesSerieCCbf as clube, idx}
                          <tr class="hover:bg-slate-900/40 transition">
                            <td class="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td class="py-2.5 px-4 font-bold text-white">{clube.nome}</td>
                            <td class="py-2.5 px-4 text-slate-300">
                              <span class="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 mr-1.5">{clube.uf}</span>
                              {clube.cidade}
                            </td>
                            <td class="py-2.5 px-4 text-center font-mono">
                              <span class="px-2 py-0.5 rounded font-bold {clube.mandos_casa === 10 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">
                                {clube.mandos_casa} Casa / {clube.mandos_fora} Fora
                              </span>
                            </td>
                            <td class="py-2.5 px-4 font-mono text-slate-200">
                              {formatKm(clube.km_total)}
                            </td>
                            <td class="py-2.5 px-4">
                              <span class="px-2 py-0.5 rounded text-[10px] font-medium {clube.modal.includes('Rodoviário') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}">
                                {clube.modal}
                              </span>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>
              {:else}
                <!-- Conferências do Modelo Proposto com Slider / Seletor -->
                {#if confsSerieCProp.length > 0}
                  <div class="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <button
                          class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-30"
                          disabled={selectedConfCIdx === 0}
                          on:click={() => selectedConfCIdx = Math.max(0, selectedConfCIdx - 1)}
                        >
                          ◀ Anterior
                        </button>
                        <span class="text-sm font-bold text-white font-mono">
                          {currentConfC?.nome} <span class="text-xs text-emerald-400 font-bold">({currentConfC?.total_clubes} agremiações)</span>
                        </span>
                        <button
                          class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-30"
                          disabled={selectedConfCIdx === confsSerieCProp.length - 1}
                          on:click={() => selectedConfCIdx = Math.min(confsSerieCProp.length - 1, selectedConfCIdx + 1)}
                        >
                          Próximo ▶
                        </button>
                      </div>

                      <span class="text-xs text-slate-400">
                        Navegue pelas 4 Conferências Regionais contíguas:
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={confsSerieCProp.length - 1}
                      bind:value={selectedConfCIdx}
                      class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />

                    <div class="flex flex-wrap gap-2 pt-1">
                      {#each confsSerieCProp as conf, idx}
                        <button
                          class="px-3 py-1 rounded-lg text-xs font-mono font-bold transition {selectedConfCIdx === idx ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}"
                          on:click={() => selectedConfCIdx = idx}
                        >
                          {conf.id} ({conf.total_clubes})
                        </button>
                      {/each}
                    </div>
                  </div>

                  {#if currentConfC}
                    <div class="overflow-x-auto rounded-xl border border-slate-800/80 max-h-[420px] overflow-y-auto">
                      <table class="w-full text-left text-xs border-collapse">
                        <thead class="sticky top-0 z-10">
                          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900">
                            <th class="py-2.5 px-4 w-12 text-center">#</th>
                            <th class="py-2.5 px-4">Clube</th>
                            <th class="py-2.5 px-4">UF / Cidade</th>
                            <th class="py-2.5 px-4 text-right">Calendário Regular Garantido</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-slate-300">
                          {#each currentConfC.clubes as clube, cIdx}
                            <tr class="hover:bg-slate-900/40 transition">
                              <td class="py-2.5 px-4 text-center font-mono text-slate-400">{cIdx + 1}</td>
                              <td class="py-2.5 px-4 font-bold text-white">{clube.nome}</td>
                              <td class="py-2.5 px-4 text-slate-300">
                                <span class="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 mr-1.5">{clube.uf}</span>
                                {clube.cidade}
                              </td>
                              <td class="py-2.5 px-4 text-right text-emerald-400 font-mono text-[11px]">
                                {currentConfC.total_clubes === 16 ? '30 jogos (turno/returno)' : '26 jogos (turno/returno)'}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {/if}
                {/if}
              {/if}
            </div>

            <!-- 3. A Resposta do Modelo Proposto: Otimização Operacional -->
            <div class="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5" /> Solução pelo Modelo Proposto (Pesquisa Operacional)
                </span>
                <span class="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  60 Clubes • 4 Conferências
                </span>
              </div>
              <h4 class="text-lg font-bold text-white">
                Como a Otimização Transforma a Série C
              </h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Ao reorganizar 60 clubes em <strong>4 Conferências Regionais contíguas</strong> (Sudeste 16, Nordeste 16, Sul 14 e Norte-Centro 14), eliminam-se os bate-voltas isolados. Clubes disputam turno e returno intra-conferência com <strong>26 a 30 partidas regulares garantidas</strong> (contra apenas 19 na CBF). Graças ao encadeamento de turnês TTP (Travelling Tournament Problem de 2 a 6 jogos fora), o <strong>custo médio por partida despenca 63,4% (de R$ 160,8k para R$ 58,8k)</strong>, permitindo que a CBF triplique os clubes atendidos e quadruplique o volume de confrontos (863 vs 216) com absorção sustentável do orçamento global.
              </p>
            </div>

            <!-- 4. Tabela Comparativa Sintética -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 class="text-base font-bold text-white flex items-center gap-2">
                    <Scale class="w-4 h-4 text-emerald-400" />
                    Comparativo Estrutural Sintético: Série C
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Confronto direto entre o regulamento oficial CBF 2026 e o modelo otimizado por Pesquisa Operacional.
                  </p>
                </div>
                <span class="text-xs text-slate-400 font-mono">8 Dimensões Auditadas</span>
              </div>

              {#if officialFormats?.comparativo_estrutural_sintetico?.serie_c?.dimensoes}
                <div class="overflow-x-auto rounded-xl border border-slate-800/80">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/90">
                        <th class="py-3 px-4 w-1/5">Dimensão</th>
                        <th class="py-3 px-4 w-1/4 text-rose-300">CBF Oficial 2026 (REC)</th>
                        <th class="py-3 px-4 w-1/4 text-emerald-400">Modelo Proposto</th>
                        <th class="py-3 px-4 w-[30%] text-cyan-300">Impacto Estrutural</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300">
                      {#each officialFormats.comparativo_estrutural_sintetico.serie_c.dimensoes as item}
                        <tr class="hover:bg-slate-900/40 transition">
                          <td class="py-3 px-4 font-semibold text-white">{item.dimensao}</td>
                          <td class="py-3 px-4 text-slate-300">{item.cbf_oficial_2026}</td>
                          <td class="py-3 px-4 font-semibold text-emerald-300">{item.modelo_proposto_fgv}</td>
                          <td class="py-3 px-4 text-xs text-slate-300 leading-relaxed">
                            <span class="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                              {item.impacto}
                            </span>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if activeDivisionTab === 'serie_d'}
          <div class="space-y-8" transition:fade={{ duration: 150 }}>
            <!-- 1. Header & Contexto Regulamentar -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Shield class="w-3.5 h-3.5" />
                  Base da Pirâmide Nacional • Novo Formato Oficial de 96 Clubes CBF 2026
                </div>
                <span class="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                  Economia Direta CBF: R$ 11,66M (-26,0%)
                </span>
              </div>

              <div>
                <h3 class="text-xl font-bold text-white">
                  Série D: Diagnóstico da Expansão CBF 2026 (96 Clubes) vs. 18 Ligas Regionais (144 Clubes)
                </h3>
                <p class="text-sm text-slate-300 mt-2 leading-relaxed">
                  Em 2026, a CBF implementa a ampliação histórica da Série D de 64 para 96 clubes. No entanto, o regulamento mantém <strong>dois gargalos estruturais severos</strong>: 32 clubes são eliminados prematuramente com apenas 10 jogos em junho/julho, e, nas Quartas de Final, a CBF <strong>abandona completamente a regionalização</strong>, gerando cruzamentos transcontinentais de véspera que elevam os custos de mata-mata a mais de R$ 8,10 milhões.
                </p>
              </div>

              <!-- Indicadores Macroeconômicos CBF 2026 -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800/80 text-xs">
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Clubes Participantes</span>
                  <span class="text-base font-bold text-white font-mono mt-0.5 block">96 clubes</span>
                  <span class="text-[10px] text-slate-500">10 a 22 jogos/clube</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Total de Partidas</span>
                  <span class="text-base font-bold text-white font-mono mt-0.5 block">610 jogos</span>
                  <span class="text-[10px] text-slate-500">24 datas (Abr-Set)</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Custo Total CBF</span>
                  <span class="text-base font-bold text-amber-400 font-mono mt-0.5 block">R$ 44,89M</span>
                  <span class="text-[10px] text-slate-500">Subsídio integral</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Custo Mata-mata CBF</span>
                  <span class="text-base font-bold text-rose-400 font-mono mt-0.5 block">R$ 8,10M</span>
                  <span class="text-[10px] text-slate-500">18,0% do custo da D</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Modal Aéreo CBF</span>
                  <span class="text-base font-bold text-cyan-400 font-mono mt-0.5 block">53,8% Aéreo</span>
                  <span class="text-[10px] text-slate-500">46,2% rodoviário</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span class="text-slate-400 block text-[11px]">Custo Médio / Jogo</span>
                  <span class="text-base font-bold text-white font-mono mt-0.5 block">R$ 82.827</span>
                  <span class="text-[10px] text-slate-500">Média CBF por partida</span>
                </div>
              </div>

              <!-- 4 Critérios de Entrada -->
              <div class="space-y-2 pt-2">
                <span class="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 class="w-3.5 h-3.5 text-cyan-400" /> Os 4 Critérios Oficiais de Entrada da Série D (CBF 2026):
                </span>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="font-bold text-white block">Critério 1: Rebaixamento C</span>
                    <span class="text-slate-400 text-[11px]">4 clubes despromovidos da Série C de 2025.</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="font-bold text-white block">Critério 2: Estaduais 2025</span>
                    <span class="text-slate-400 text-[11px]">64 vagas pelo RNF (SP 4; RJ/MG/RS/PR/CE/GO/SC/BA 3; demais 2).</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="font-bold text-white block">Critério 3: Remanescentes</span>
                    <span class="text-slate-400 text-[11px]">28 vagas para clubes que alcançaram a 2ª fase da Série D 2025.</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span class="font-bold text-white block">Critério 4: Ranking CBF</span>
                    <span class="text-slate-400 text-[11px]">Vagas excedentes redistribuídas pelos melhores sem divisão no RNC.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Linha do Tempo das Fases & O Ponto Crítico de Inflexão Logística -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 class="text-base font-bold text-white flex items-center gap-2">
                    <Activity class="w-4 h-4 text-cyan-400" />
                    Fluxo das 7 Fases da Série D & O Ponto Crítico de Inflexão Logística (REC CBF 2026)
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Como a mudança de regra a partir das Quartas de Final rompe o isolamento geográfico e inflaciona os custos operacionais.
                  </p>
                </div>
                <span class="text-[11px] px-2.5 py-1 rounded bg-slate-900 text-slate-400 font-mono border border-slate-800">
                  7 Fases • 24 Datas
                </span>
              </div>

              <div class="space-y-4">
                <!-- Fase 1 -->
                <div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">1</span>
                      <span class="text-sm font-bold text-white">Primeira Fase: 16 Grupos Regionalizados</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">96 clubes • 16 grupos de 6 • 10 rodadas • 480 partidas</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Disputa em turno e returno intra-grupo. Os 4 primeiros de cada chave avançam ao mata-mata (64 clubes).
                  </p>
                  <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs">
                    <AlertCircle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong class="text-amber-300">Gargalo de Eliminação Prematura:</strong>
                      <span class="text-slate-300"> 32 agremiações (33,3% do torneio) disputam apenas 10 partidas no ano todo e encerram suas atividades já entre junho e julho, gerando um calendário profissional ativo de menos de 3 meses para um terço da competição.</span>
                    </div>
                  </div>
                </div>

                <!-- Fases 2 e 3 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">2</span>
                      <span class="text-sm font-bold text-white">Segunda Fase: Mata-mata de 64</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono block">32 confrontos de ida e volta • 64 jogos</span>
                    <p class="text-xs text-slate-300 leading-relaxed">
                      Cruzamento regional direcionado entre chaves adjacentes (ex: 1º Grupo 1 x 4º Grupo 2). Os 32 classificados garantem vaga assegurada na Série D de 2027.
                    </p>
                  </div>

                  <div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">3</span>
                      <span class="text-sm font-bold text-white">Terceira Fase: Oitavas de Final (32 Clubes)</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono block">16 confrontos de ida e volta • 32 jogos</span>
                    <p class="text-xs text-slate-300 leading-relaxed">
                      Manutenção dos ramais regionais pré-definidos. 16 vencedores avançam para as Quartas de Final.
                    </p>
                  </div>
                </div>

                <!-- Fase 4: O PONTO CRÍTICO DE INFLEXÃO -->
                <div class="p-5 rounded-xl bg-rose-950/30 border-2 border-rose-500/40 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs">4</span>
                      <span class="text-sm font-bold text-rose-200 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle class="w-4 h-4 text-rose-400" />
                        Quartas de Final (Mata-mata de 16): O Ponto Crítico de Inflexão Logística
                      </span>
                    </div>
                    <span class="text-xs font-mono text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded border border-rose-500/30">
                      8 confrontos • 16 partidas
                    </span>
                  </div>

                  <p class="text-xs text-slate-200 leading-relaxed">
                    <strong>Regra Regulamentar CBF:</strong> O CHAVEAMENTO REGIONAL É ABANDONADO. Os confrontos passam a ser determinados estritamente pela <strong>Campanha Geral acumulada</strong> de todas as fases anteriores (1º x 16º, 2º x 15º, etc.).
                  </p>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    <div class="p-3 rounded-lg bg-slate-950/70 border border-rose-500/30 space-y-1">
                      <span class="font-bold text-rose-300 block text-[11px]">Cruzamentos Continentais Imprevisíveis</span>
                      <p class="text-slate-300 text-[11px] leading-relaxed">
                        Provoca viagens transcontinentais extremas (ex: interior do RS vs Amapá ou Roraima) para agremiações de menor porte sem malha aérea direta.
                      </p>
                    </div>
                    <div class="p-3 rounded-lg bg-slate-950/70 border border-rose-500/30 space-y-1">
                      <span class="font-bold text-rose-300 block text-[11px]">Explosão de Custos em Passagens Aéreas de Véspera</span>
                      <p class="text-slate-300 text-[11px] leading-relaxed">
                        Passagens comerciais emitidas com prazos exíguos de 4 a 6 dias para delegações inteiras de 32 passageiros. Apenas os mata-matas da Série D consomem <strong>R$ 8,10 milhões</strong> dos cofres da CBF.
                      </p>
                    </div>
                  </div>

                  <div class="text-[11px] text-slate-300 border-t border-rose-500/20 pt-2 flex items-center justify-between">
                    <span><strong>Desfecho Esportivo:</strong> Os 4 vencedores sobem direto à Série C de 2027. Os 4 eliminados disputam os Playoffs de Acesso.</span>
                  </div>
                </div>

                <!-- Fases 5, 6 e 7 -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">5</span>
                      <strong class="text-white">Playoffs de Acesso à Série C</strong>
                    </div>
                    <p class="text-slate-400 text-[11px] leading-relaxed">
                      Repescagem entre os 4 eliminados das quartas (1º x 4º, 2º x 3º da campanha). Os 2 vencedores garantem a 5ª e 6ª vagas de acesso à Série C.
                    </p>
                  </div>

                  <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">6</span>
                      <strong class="text-white">Semifinais (4 Clubes)</strong>
                    </div>
                    <p class="text-slate-400 text-[11px] leading-relaxed">
                      2 confrontos de ida e volta entre os 4 semifinalistas já promovidos. Vencedores disputam o título nacional.
                    </p>
                  </div>

                  <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">7</span>
                      <strong class="text-white">Grande Final Nacional</strong>
                    </div>
                    <p class="text-slate-400 text-[11px] leading-relaxed">
                      Confronto em ida e volta. Campeão garante vaga direta na 3ª Fase da Copa do Brasil de 2027.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Explorador Interativo de Grupos da 1ª Fase (Série D) -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h4 class="text-base font-bold text-white flex items-center gap-2">
                    <Table2 class="w-4 h-4 text-cyan-400" />
                    Explorador de Grupos e Tabelas da 1ª Fase (Série D)
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Navegue pelos 16 grupos oficiais da CBF (A1 a A16) ou pelas 18 Ligas Regionais do Modelo Proposto.
                  </p>
                </div>

                <!-- Toggle CBF Oficial vs Modelo Proposto -->
                <div class="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0">
                  <button
                    class="px-3 py-1.5 rounded-lg font-semibold transition {serieDTableViewMode === 'cbf' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
                    on:click={() => serieDTableViewMode = 'cbf'}
                  >
                    Oficial CBF (Grupos A1 a A16)
                  </button>
                  <button
                    class="px-3 py-1.5 rounded-lg font-semibold transition {serieDTableViewMode === 'proposto' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}"
                    on:click={() => serieDTableViewMode = 'proposto'}
                  >
                    Modelo Proposto (18 Ligas)
                  </button>
                </div>
              </div>

              {#if serieDTableViewMode === 'cbf'}
                {#if gruposSerieDCbf.length > 0}
                  <!-- Slider / Stepper Bar para A1 a A16 -->
                  <div class="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <button
                          class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-30"
                          disabled={selectedGroupDIdx === 0}
                          on:click={() => selectedGroupDIdx = Math.max(0, selectedGroupDIdx - 1)}
                        >
                          ◀ Anterior
                        </button>
                        <span class="text-sm font-bold text-white font-mono">
                          {currentGroupD?.nome} <span class="text-xs text-slate-400 font-normal">({selectedGroupDIdx + 1} de 16)</span>
                        </span>
                        <button
                          class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-30"
                          disabled={selectedGroupDIdx === gruposSerieDCbf.length - 1}
                          on:click={() => selectedGroupDIdx = Math.min(gruposSerieDCbf.length - 1, selectedGroupDIdx + 1)}
                        >
                          Próximo ▶
                        </button>
                      </div>

                      <span class="text-xs text-slate-400">
                        Use o slider ou clique nos botões para navegar entre as chaves:
                      </span>
                    </div>

                    <!-- Range slider -->
                    <input
                      type="range"
                      min="0"
                      max={gruposSerieDCbf.length - 1}
                      bind:value={selectedGroupDIdx}
                      class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />

                    <!-- Pills A1 a A16 -->
                    <div class="flex flex-wrap gap-1.5 pt-1">
                      {#each gruposSerieDCbf as g, idx}
                        <button
                          class="px-2 py-1 rounded text-[11px] font-mono font-bold transition {selectedGroupDIdx === idx ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-400/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}"
                          on:click={() => selectedGroupDIdx = idx}
                        >
                          {g.id}
                        </button>
                      {/each}
                    </div>
                  </div>

                  <!-- Tabela do Grupo Selecionado -->
                  {#if currentGroupD}
                    <div class="overflow-x-auto rounded-xl border border-slate-800/80">
                      <table class="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/90">
                            <th class="py-2.5 px-4 w-12 text-center">#</th>
                            <th class="py-2.5 px-4">Clube</th>
                            <th class="py-2.5 px-4">UF / Cidade</th>
                            <th class="py-2.5 px-4">Km Total Fora</th>
                            <th class="py-2.5 px-4">Modal CBF</th>
                            <th class="py-2.5 px-4 text-right">Desfecho Esportivo 1ª Fase</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-slate-300">
                          {#each currentGroupD.clubes as clube, cIdx}
                            <tr class="hover:bg-slate-900/40 transition">
                              <td class="py-2.5 px-4 text-center font-mono font-bold {cIdx < 4 ? 'text-emerald-400' : 'text-rose-400'}">
                                {cIdx + 1}º
                              </td>
                              <td class="py-2.5 px-4 font-bold text-white">
                                {clube.nome}
                              </td>
                              <td class="py-2.5 px-4 text-slate-300">
                                <span class="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 mr-1.5">{clube.uf}</span>
                                {clube.cidade}
                              </td>
                              <td class="py-2.5 px-4 font-mono text-slate-200">
                                {formatKm(clube.km_total)}
                              </td>
                              <td class="py-2.5 px-4">
                                <span class="px-2 py-0.5 rounded text-[10px] font-medium {clube.modal.includes('100%') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}">
                                  {clube.modal}
                                </span>
                              </td>
                              <td class="py-2.5 px-4 text-right font-mono text-[11px]">
                                {#if cIdx < 4}
                                  <span class="text-emerald-400">Classifica ao Mata-mata de 64</span>
                                {:else}
                                  <span class="text-rose-400">Eliminado precocemente (jun/jul)</span>
                                {/if}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {/if}
                {/if}
              {:else}
                <!-- Tabela do Modelo Proposto (18 Ligas Regionais) -->
                {#if ligasSerieDProp.length > 0}
                  <div class="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <button
                          class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-30"
                          disabled={selectedLigaDIdx === 0}
                          on:click={() => selectedLigaDIdx = Math.max(0, selectedLigaDIdx - 1)}
                        >
                          ◀ Anterior
                        </button>
                        <span class="text-sm font-bold text-white font-mono">
                          {currentLigaD?.nome} <span class="text-xs text-slate-400 font-normal">({selectedLigaDIdx + 1} de 18)</span>
                        </span>
                        <button
                          class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-30"
                          disabled={selectedLigaDIdx === ligasSerieDProp.length - 1}
                          on:click={() => selectedLigaDIdx = Math.min(ligasSerieDProp.length - 1, selectedLigaDIdx + 1)}
                        >
                          Próximo ▶
                        </button>
                      </div>
                      <span class="text-xs text-slate-400">
                        18 Ligas compactas de raio limitado (ônibus leito até 650 km):
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={ligasSerieDProp.length - 1}
                      bind:value={selectedLigaDIdx}
                      class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />

                    <div class="flex flex-wrap gap-1.5 pt-1">
                      {#each ligasSerieDProp as l, idx}
                        <button
                          class="px-2 py-1 rounded text-[10px] font-mono font-bold transition {selectedLigaDIdx === idx ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-400/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}"
                          on:click={() => selectedLigaDIdx = idx}
                        >
                          L{idx + 1}
                        </button>
                      {/each}
                    </div>
                  </div>

                  {#if currentLigaD}
                    <div class="overflow-x-auto rounded-xl border border-slate-800/80">
                      <table class="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/90">
                            <th class="py-2.5 px-4 w-12 text-center">#</th>
                            <th class="py-2.5 px-4">Clube</th>
                            <th class="py-2.5 px-4">UF / Cidade</th>
                            <th class="py-2.5 px-4 text-right">Formato Desportivo</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-slate-300">
                          {#each currentLigaD.clubes as clube, cIdx}
                            <tr class="hover:bg-slate-900/40 transition">
                              <td class="py-2.5 px-4 text-center font-mono text-slate-400">{cIdx + 1}</td>
                              <td class="py-2.5 px-4 font-bold text-white">{clube.nome}</td>
                              <td class="py-2.5 px-4 text-slate-300">
                                <span class="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 mr-1.5">{clube.uf}</span>
                                {clube.cidade}
                              </td>
                              <td class="py-2.5 px-4 text-right text-emerald-400 font-mono text-[11px]">
                                Turno e returno regionalizado + Playoffs Concêntricos
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {/if}
                {/if}
              {/if}
            </div>

            <!-- 3. A Solução pelo Modelo Proposto: 18 Ligas Regionais Bounded-Radius -->
            <div class="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-500/30 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5" /> Solução pelo Modelo Proposto (Pesquisa Operacional)
                </span>
                <span class="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Economia Líquida CBF: R$ 11.662.805,74 (-26,0%)
                </span>
              </div>
              <h4 class="text-lg font-bold text-white">
                18 Ligas Regionais Bounded-Radius: Mais Clubes por um Menor Custo Global
              </h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Ao estruturar 144 agremiações em <strong>18 Ligas Regionais de raio compacto</strong> com limite rodoviário operacional de 650 km em ônibus leito fretado, o modelo proposto viabiliza que <strong>75,9% de todos os confrontos sejam operados por malha terrestre</strong> (contra apenas 46,2% na CBF). Além disso, os <strong>Playoffs Concêntricos 100% Regionais até as semifinais</strong> eliminam completamente a explosão de gastos com voos transcontinentais prematuros. O resultado é a expansão da base profissional para 144 polos esportivos (+50%) e 1.096 partidas (+79,7%), gerando uma <strong>economia líquida direta de R$ 11,66 milhões para os cofres da CBF</strong>, alavanca orçamentária que subsidia com folga a reestruturação da Série C.
              </p>
            </div>

            <!-- 4. Tabela Comparativa Sintética -->
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 class="text-base font-bold text-white flex items-center gap-2">
                    <Scale class="w-4 h-4 text-cyan-400" />
                    Comparativo Estrutural Sintético: Série D
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Confronto analítico entre a nova Série D de 96 clubes da CBF e o modelo de 18 Ligas Regionais.
                  </p>
                </div>
                <span class="text-xs text-slate-400 font-mono">8 Dimensões Auditadas</span>
              </div>

              {#if officialFormats?.comparativo_estrutural_sintetico?.serie_d?.dimensoes}
                <div class="overflow-x-auto rounded-xl border border-slate-800/80">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/90">
                        <th class="py-3 px-4 w-1/5">Dimensão</th>
                        <th class="py-3 px-4 w-1/4 text-rose-300">CBF Oficial 2026 (96 Clubes)</th>
                        <th class="py-3 px-4 w-1/4 text-cyan-300">Modelo Proposto (144 Clubes)</th>
                        <th class="py-3 px-4 w-[30%] text-emerald-400">Impacto Estrutural & Orçamentário</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300">
                      {#each officialFormats.comparativo_estrutural_sintetico.serie_d.dimensoes as item}
                        <tr class="hover:bg-slate-900/40 transition">
                          <td class="py-3 px-4 font-semibold text-white">{item.dimensao}</td>
                          <td class="py-3 px-4 text-slate-300">{item.cbf_oficial_2026}</td>
                          <td class="py-3 px-4 font-semibold text-cyan-300">{item.modelo_proposto_fgv}</td>
                          <td class="py-3 px-4 text-xs text-slate-300 leading-relaxed">
                            <span class="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                              {item.impacto}
                            </span>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
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
