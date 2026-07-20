<script>
  import { tick, onMount, onDestroy } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import { showWizardModal, wizardDataStore, teamsDb, currentSeason } from '$lib/stores/gameStore.js';
  import { computeConvexHull } from '$lib/utils/geoUtils.js';
  import { getMacroName, getMicroName } from '$lib/utils/leagueNames.js';
  import { Cpu, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-svelte';

  let mapElement;
  let L;
  let map;
  let markersLayer;
  let centroidLayer;
  let hullLayer;

  let currentStep = 1; // Steps 1 to 8

  // Color palette for macro-regions (Serie C)
  const macroColors = {
    macro_0: '#3b82f6', // Blue
    macro_1: '#10b981', // Emerald
    macro_2: '#f59e0b', // Amber
    macro_3: '#a855f7'  // Purple
  };

  // Color palette for micro-regions (Serie D)
  const microColors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'
  ];

  function getMicroColor(idx) {
    return microColors[idx % microColors.length];
  }

  $: data = $wizardDataStore;

  // Reactively initialize map when wizard modal opens
  $: if ($showWizardModal && data) {
    initWizardMap();
  }

  async function initWizardMap() {
    await tick(); // Wait for Svelte DOM modal mounting
    if (!mapElement) return;

    if (!L) {
      L = await import('leaflet');
    }

    if (!map) {
      console.log('[Wizard Map] Initializing new Leaflet map instance...');
      map = L.map(mapElement, {
        center: [-14.235, -51.925],
        zoom: 4,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      hullLayer = L.layerGroup().addTo(map);
      markersLayer = L.layerGroup().addTo(map);
      centroidLayer = L.layerGroup().addTo(map);
    }

    // Force size recalculation after modal CSS transition
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        renderStep(currentStep);
      }
    }, 150);
  }

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  function nextStep() {
    if (currentStep < 8) {
      currentStep++;
      renderStep(currentStep);
    } else {
      closeWizard();
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      renderStep(currentStep);
    }
  }

  function closeWizard() {
    showWizardModal.set(false);
    currentStep = 1;
    if (map) {
      map.remove();
      map = null;
    }
  }

  function renderStep(step) {
    if (!map || !L || !markersLayer || !data) return;

    hullLayer.clearLayers();
    markersLayer.clearLayers();
    centroidLayer.clearLayers();

    const tDb = $teamsDb || {};
    const bounds = L.latLngBounds();

    console.log(`[Wizard] Rendering Step ${step}/8...`);

    if (step <= 4) {
      // -----------------------------------------------------------
      // SERIE C ANIMATION (STEPS 1 - 4)
      // -----------------------------------------------------------
      const oldTeamsByMacro = data.oldTeamsCByMacro || {};
      const oldCentroids = data.oldCentroidsC || {};
      const removedSet = new Set(data.removedTeamsC || []);
      const incomingSet = new Set(data.incomingTeamsC || []);
      const newLeaguesC = data.newLeaguesC || {};
      const newCentroids = data.newCentroidsC || {};

      let activeTeamsToPlot = [];

      if (step === 1) {
        Object.keys(oldTeamsByMacro).forEach(mKey => {
          (oldTeamsByMacro[mKey] || []).forEach(teamId => {
            activeTeamsToPlot.push({ id: teamId, regionKey: mKey, color: macroColors[mKey], label: getMacroName(mKey) });
          });
        });
        plotCentroids(oldCentroids, true);
      } else if (step === 2) {
        Object.keys(oldTeamsByMacro).forEach(mKey => {
          (oldTeamsByMacro[mKey] || []).forEach(teamId => {
            if (!removedSet.has(teamId)) {
              activeTeamsToPlot.push({ id: teamId, regionKey: mKey, color: macroColors[mKey], label: getMacroName(mKey) });
            }
          });
        });
        plotCentroids(oldCentroids, true);
      } else if (step === 3) {
        Object.keys(oldTeamsByMacro).forEach(mKey => {
          (oldTeamsByMacro[mKey] || []).forEach(teamId => {
            if (!removedSet.has(teamId)) {
              activeTeamsToPlot.push({ id: teamId, regionKey: mKey, color: macroColors[mKey], label: getMacroName(mKey) });
            }
          });
        });
        Array.from(incomingSet).forEach(teamId => {
          activeTeamsToPlot.push({ id: teamId, regionKey: 'unassigned', color: '#94a3b8', label: 'Novo Entrante', isNew: true });
        });
        plotCentroids(oldCentroids, true);
      } else if (step === 4) {
        Object.keys(newLeaguesC).forEach(mKey => {
          (newLeaguesC[mKey] || []).forEach(teamId => {
            activeTeamsToPlot.push({ id: teamId, regionKey: mKey, color: macroColors[mKey], label: `Otimizado: ${getMacroName(mKey)}` });
          });
        });
        plotCentroids(newCentroids, true, 'Novo Centróide ');
      }

      plotTeamsAndHulls(activeTeamsToPlot, tDb, bounds, true);
    } else {
      // -----------------------------------------------------------
      // SERIE D ANIMATION (STEPS 5 - 8)
      // -----------------------------------------------------------
      const oldTeamsByMicro = data.oldTeamsDByMicro || {};
      const oldCentroids = data.oldCentroidsD || {};
      const removedSet = new Set(data.removedTeamsD || []);
      const incomingSet = new Set(data.incomingTeamsD || []);
      const newLeaguesD = data.newLeaguesD || {};
      const newCentroids = data.newCentroidsD || {};
      const microKeys = Object.keys(oldTeamsByMicro);

      let activeTeamsToPlot = [];

      if (step === 5) {
        microKeys.forEach((dKey, idx) => {
          const color = getMicroColor(idx);
          (oldTeamsByMicro[dKey] || []).forEach(teamId => {
            activeTeamsToPlot.push({ id: teamId, regionKey: dKey, color, label: getMicroName(dKey) });
          });
        });
        plotCentroids(oldCentroids, false);
      } else if (step === 6) {
        microKeys.forEach((dKey, idx) => {
          const color = getMicroColor(idx);
          (oldTeamsByMicro[dKey] || []).forEach(teamId => {
            if (!removedSet.has(teamId)) {
              activeTeamsToPlot.push({ id: teamId, regionKey: dKey, color, label: getMicroName(dKey) });
            }
          });
        });
        plotCentroids(oldCentroids, false);
      } else if (step === 7) {
        microKeys.forEach((dKey, idx) => {
          const color = getMicroColor(idx);
          (oldTeamsByMicro[dKey] || []).forEach(teamId => {
            if (!removedSet.has(teamId)) {
              activeTeamsToPlot.push({ id: teamId, regionKey: dKey, color, label: getMicroName(dKey) });
            }
          });
        });
        Array.from(incomingSet).forEach(teamId => {
          activeTeamsToPlot.push({ id: teamId, regionKey: 'unassigned', color: '#94a3b8', label: 'Novo Entrante', isNew: true });
        });
        plotCentroids(oldCentroids, false);
      } else if (step === 8) {
        Object.keys(newLeaguesD).forEach((dKey, idx) => {
          const color = getMicroColor(idx);
          (newLeaguesD[dKey] || []).forEach(teamId => {
            activeTeamsToPlot.push({ id: teamId, regionKey: dKey, color, label: `Otimizado: ${getMicroName(dKey)}` });
          });
        });
        plotCentroids(newCentroids, false, 'Novo Centróide ');
      }

      plotTeamsAndHulls(activeTeamsToPlot, tDb, bounds, false);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 7 });
    }
  }

  function plotTeamsAndHulls(teamsList, tDb, bounds, isMacro = true) {
    const coordGroups = {};
    const clusterPoints = {};
    const clusterColors = {};

    teamsList.forEach(item => {
      const team = tDb[item.id];
      if (team && typeof team.lat === 'number' && typeof team.lon === 'number') {
        const key = `${team.lat.toFixed(4)},${team.lon.toFixed(4)}`;
        if (!coordGroups[key]) coordGroups[key] = [];
        coordGroups[key].push({ ...item, team });

        if (item.regionKey && item.regionKey !== 'unassigned') {
          if (!clusterPoints[item.regionKey]) clusterPoints[item.regionKey] = [];
          clusterPoints[item.regionKey].push([team.lat, team.lon]);
          clusterColors[item.regionKey] = item.color;
        }
      }
    });

    // 1. Draw Convex Hull Polygons
    Object.keys(clusterPoints).forEach(rKey => {
      const pts = clusterPoints[rKey];
      const color = clusterColors[rKey] || '#3b82f6';
      const labelName = isMacro ? getMacroName(rKey) : getMicroName(rKey);

      if (pts.length >= 3) {
        const hull = computeConvexHull(pts);
        if (hull.length >= 3) {
          const polygon = L.polygon(hull, {
            color: color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '4, 4'
          });
          polygon.bindTooltip(`Fronteira Operacional: ${labelName}`, { permanent: false });
          hullLayer.addLayer(polygon);
        }
      } else if (pts.length > 0) {
        const circle = L.circle(pts[0], {
          radius: 80000,
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '4, 4'
        });
        hullLayer.addLayer(circle);
      }
    });

    // 2. Render Team PNG Markers
    Object.values(coordGroups).forEach(group => {
      const count = group.length;
      group.forEach((item, idx) => {
        let lat = item.team.lat;
        let lon = item.team.lon;

        if (count > 1) {
          const step = 0.008;
          const startOffset = -((count - 1) * step) / 2;
          lon += startOffset + idx * step;
        }

        bounds.extend([lat, lon]);

        const parts = item.id ? item.id.split('/') : [];
        const clubeKey = parts[0] || item.team.nome || '';
        const estadoSlug = parts[1] || '';
        const teamName = item.team.nome || clubeKey || '';

        const primaryImgSrc = estadoSlug && clubeKey ? `/teams/${estadoSlug}/${clubeKey}.png` : '';
        const fallbackImgSrc = estadoSlug && teamName ? `/teams/${estadoSlug}/${teamName}.png` : '';
        const initials = teamName.substring(0, 3).toUpperCase();

        const markerHtml = `
          <div class="relative flex items-center justify-center transition-transform hover:scale-125 select-none ${item.isNew ? 'scale-110 animate-bounce' : ''}">
            <div class="w-8 h-8 rounded-full bg-slate-900 border-2 p-0.5 shadow-xl flex items-center justify-center overflow-hidden" style="border-color: ${item.color};">
              <img 
                src="${primaryImgSrc}" 
                onerror="if (!this.dataset.triedFallback) { this.dataset.triedFallback = true; this.src = '${fallbackImgSrc}'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }" 
                class="w-full h-full object-contain" 
              />
              <div style="display:none;" class="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px]" style="color: ${item.color};">
                ${initials}
              </div>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-wizard-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const m = L.marker([lat, lon], { icon });
        m.bindPopup(`<b>${teamName}</b><br/><span style="color:${item.color}">${item.label}</span>`);
        markersLayer.addLayer(m);
      });
    });
  }

  function plotCentroids(centroidsObj, isMacro = true, prefix = 'Centróide ') {
    Object.keys(centroidsObj).forEach(key => {
      const c = centroidsObj[key];
      if (c && typeof c.lat === 'number') {
        const label = isMacro ? getMacroName(key) : getMicroName(key);
        const title = `${prefix}${label}`;

        const centroidIcon = L.divIcon({
          html: `<div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center font-extrabold text-white text-xs shadow-2xl animate-pulse">✕</div>`,
          className: 'custom-centroid-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const cm = L.marker([c.lat, c.lon], { icon: centroidIcon });
        cm.bindPopup(`<b>${title}</b><br/>Lat: ${c.lat.toFixed(2)}, Lon: ${c.lon.toFixed(2)}`);
        centroidLayer.addLayer(cm);
      }
    });
  }

  const stepDescriptions = {
    1: { title: "Passo 1/8: Série C ao Fim da Temporada", desc: "Exibição dos 80 clubes divididos em suas 4 Ligas Macrorregionais da temporada que acabou. Marcadores em 'X' vermelho indicam os centróides geográficos e polígonos mostram as fronteiras dos clusters." },
    2: { title: "Passo 2/8: Saída dos Promovidos e Rebaixados", desc: "Removemos suavemente do mapa os 16 times que subiram para a Série B (4 campeões) e caíram para a Série D (12 times)." },
    3: { title: "Passo 3/8: Entrada dos Novos Integrantes", desc: "Adicionamos ao mapa os 16 novos times que caíram da Série B (4) e subiram da Série D (12), em tom neutro antes da alocação." },
    4: { title: "Passo 4/8: Otimização Operacional do Algoritmo Húngaro", desc: "Rodamos o Algoritmo Húngaro (LAP) para alocar perfeitamente 20 times por Liga Macrorregional, minimizando a distância global das viagens com base nos centróides." },
    5: { title: "Passo 5/8: Série D ao Fim da Temporada", desc: "Exibição dos 216 clubes da Série D agrupados em 12 Ligas Microrregionais geográficas com seus centróides e polígonos delimitadores." },
    6: { title: "Passo 6/8: Saída da Série D", desc: "Retirada dos 48 times promovidos para a Série C (12 campeões) e rebaixados para o Futebol Amador (36 times)." },
    7: { title: "Passo 7/8: Entrada dos Novos Times na Série D", desc: "Adição dos 48 novos integrantes vindos da Série C (12) e promovidos das ligas amadoras (36)." },
    8: { title: "Passo 8/8: Otimização Húngara Concluída (Série D)", desc: "Alocação Húngara globalmente ótima para as 12 Ligas Microrregionais (18 times por liga = 216 times). A malha geográfica está otimizada para o novo ano!" }
  };
</script>

{#if $showWizardModal && data}
  <div class="fixed inset-0 z-[110] flex flex-col bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
    
    <!-- Top Header -->
    <header class="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Cpu class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 class="text-base font-extrabold text-white flex items-center gap-2">
            Pesquisa Operacional: Algoritmo Húngaro (Munkres)
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Otimização Global LAP
            </span>
          </h2>
          <p class="text-xs text-slate-400">Visualização Didática da Re-clusterização da Temporada {$currentSeason}</p>
        </div>
      </div>

      <!-- Step Counter Progress -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          {#each Array.from({ length: 8 }) as _, i}
            <div class={`h-2 rounded-full transition-all duration-300 ${i + 1 === currentStep ? 'w-6 bg-emerald-400 shadow-md shadow-emerald-500/50' : i + 1 < currentStep ? 'w-2 bg-emerald-600' : 'w-2 bg-slate-700'}`}></div>
          {/each}
        </div>
        <button
          on:click={closeWizard}
          class="text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors ml-4 cursor-pointer"
        >
          Pular ✕
        </button>
      </div>
    </header>

    <!-- Center: Leaflet Interactive Map Container -->
    <div class="flex-1 w-full h-full min-h-[450px] relative z-0">
      <div bind:this={mapElement} class="w-full h-full min-h-[450px]"></div>
    </div>

    <!-- Bottom Explanatory Controls Panel -->
    <footer class="bg-slate-900/95 border-t border-slate-800 px-6 py-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="max-w-3xl space-y-1">
        <h3 class="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
          <Sparkles class="w-4 h-4" />
          {stepDescriptions[currentStep]?.title}
        </h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          {stepDescriptions[currentStep]?.desc}
        </p>
      </div>

      <!-- Navigation Actions -->
      <div class="flex items-center gap-3 shrink-0">
        {#if currentStep > 1}
          <button
            on:click={prevStep}
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" /> Anterior
          </button>
        {/if}

        <button
          on:click={nextStep}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          {#if currentStep < 8}
            <span>Próximo Passo</span>
            <ArrowRight class="w-4 h-4" />
          {:else}
            <Check class="w-4 h-4" />
            <span>Iniciar Nova Temporada {$currentSeason}</span>
          {/if}
        </button>
      </div>
    </footer>

  </div>
{/if}
