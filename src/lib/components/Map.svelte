<script>
  import { onMount, onDestroy } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import { activeTeamObjects, focusedTeamId, focusedRouteData, cityHubs, airportsDb } from '$lib/stores/gameStore.js';
  import { Navigation, Plane } from 'lucide-svelte';

  let mapElement;
  let L;
  let map;
  let tileLayer;
  let markersLayer;
  let routesLayer;
  let hubLayer;

  onMount(async () => {
    L = await import('leaflet');

    if (!mapElement) return;

    map = L.map(mapElement, {
      center: [-14.235, -51.925],
      zoom: 4,
      zoomControl: true,
      attributionControl: false
    });

    // CartoDB Dark Matter Tile Layer
    tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    });

    tileLayer.addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routesLayer = L.layerGroup().addTo(map);
    hubLayer = L.layerGroup().addTo(map);

    // Force Leaflet to recalculate container dimensions after Svelte DOM layout render
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 250);

    updateMap();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });

  $: if (map && L) {
    updateMap($activeTeamObjects, $focusedRouteData, $cityHubs, $airportsDb);
  }

  function updateMap() {
    if (!map || !L || !markersLayer) return;

    markersLayer.clearLayers();
    routesLayer.clearLayers();
    hubLayer.clearLayers();

    const teams = $activeTeamObjects || [];
    const focusedRoute = $focusedRouteData;
    const hubs = $cityHubs || {};

    if (teams.length === 0) return;

    // Recalculate size
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 100);

    const bounds = L.latLngBounds();

    // Group teams by coordinate key (lat, lon) to avoid overlapping
    const coordGroups = {};
    teams.forEach(team => {
      if (typeof team.lat !== 'number' || typeof team.lon !== 'number') return;
      const key = `${team.lat.toFixed(4)},${team.lon.toFixed(4)}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(team);
    });

    // Render grouped markers with horizontal offset if multiple teams share coordinates
    Object.values(coordGroups).forEach(group => {
      const groupCount = group.length;

      group.forEach((team, idx) => {
        let lat = team.lat;
        let lon = team.lon;

        if (groupCount > 1) {
          const step = 0.0075; // Approx 700m longitude shift per badge
          const startOffset = -((groupCount - 1) * step) / 2;
          lon += startOffset + idx * step;
        }

        bounds.extend([lat, lon]);

        const isFocused = $focusedTeamId === team.id;
        const parts = team.id ? team.id.split('/') : [];
        const clubeKey = parts[0] || team.nome || '';
        const estadoSlug = parts[1] || '';
        const teamName = team.nome || clubeKey || '';

        const primaryImgSrc = estadoSlug && clubeKey ? `/teams/${estadoSlug}/${clubeKey}.png` : '';
        const fallbackImgSrc = estadoSlug && teamName ? `/teams/${estadoSlug}/${teamName}.png` : '';
        const initials = teamName.substring(0, 3).toUpperCase();

        const markerHtml = `
          <div class="relative flex items-center justify-center transition-transform hover:scale-125 ${isFocused ? 'scale-125 z-50' : ''}">
            ${isFocused ? '<div class="absolute -inset-2 rounded-full bg-emerald-500/40 animate-ping"></div>' : ''}
            <div class="w-8 h-8 rounded-full bg-slate-900 border-2 ${isFocused ? 'border-emerald-400 ring-4 ring-emerald-500/30' : 'border-slate-700'} p-0.5 shadow-xl flex items-center justify-center overflow-hidden">
              <img 
                src="${primaryImgSrc}" 
                onerror="if ('${fallbackImgSrc}' && this.src !== window.location.origin + '${fallbackImgSrc}') { this.src = '${fallbackImgSrc}'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }" 
                class="w-full h-full object-contain" 
              />
              <div style="display:none;" class="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-emerald-400">
                ${initials}
              </div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-team-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lon], { icon: customIcon });

        const hubData = hubs[team.id];
        const popupHtml = `
          <div class="p-1 max-w-[200px]">
            <div class="font-extrabold text-sm text-slate-100 flex items-center gap-1.5 border-b border-slate-700 pb-1">
              <span>${teamName}</span>
              <span class="text-[10px] uppercase font-bold text-emerald-400">(${team.uf || ''})</span>
            </div>
            <div class="text-xs text-slate-300 mt-1.5 space-y-1">
              <p><strong>Cidade:</strong> ${team.cidade || 'N/A'}</p>
              <p><strong>Estádio:</strong> ${team.estadio || 'N/A'}</p>
              <p><strong>PageRank:</strong> <span class="text-purple-300 font-mono">${((team.pagerank || 0) * 1000).toFixed(2)}</span></p>
              ${hubData ? `<p class="text-cyan-400 text-[11px] pt-1"><strong>Hub:</strong> ${hubData.hub_aero_iata} (${hubData.dist_ate_aero_km} km)</p>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          focusedTeamId.set(team.id);
        });

        markersLayer.addLayer(marker);
      });
    });

    if (focusedRoute && focusedRoute.route) {
      const route = focusedRoute.route;

      route.segments.forEach(segment => {
        const polyline = L.polyline(segment.points, {
          color: segment.color,
          weight: segment.type === 'FLIGHT' ? 4 : 3,
          dashArray: segment.dashArray,
          opacity: 0.95
        });

        polyline.bindTooltip(segment.label, { permanent: false, direction: 'center' });
        routesLayer.addLayer(polyline);
      });

      if (route.modal === 'FLIGHT') {
        const homeHubKey = focusedRoute.homeTeam.id;
        const awayHubKey = focusedRoute.awayTeam.id;

        [hubs[homeHubKey], hubs[awayHubKey]].forEach(h => {
          if (h && h.hub_aero_lat && h.hub_aero_lon) {
            const airportIcon = L.divIcon({
              html: `<div class="w-6 h-6 rounded-full bg-cyan-900 border border-cyan-400 flex items-center justify-center text-cyan-300 text-[10px] font-bold shadow-lg">✈</div>`,
              className: 'custom-hub-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            const hubMarker = L.marker([h.hub_aero_lat, h.hub_aero_lon], { icon: airportIcon });
            hubMarker.bindPopup(`<b>Aeroporto Hub:</b> ${h.hub_aero_iata}`);
            hubLayer.addLayer(hubMarker);
          }
        });
      }
    }

    if (bounds.isValid() && !$focusedTeamId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[520px] min-h-[500px] relative">
  <div class="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between z-10">
    <div class="flex items-center gap-2 font-bold text-sm text-slate-200">
      <Navigation class="w-4 h-4 text-emerald-400" />
      Visualização Geográfica das Rotas
    </div>

    <div class="flex items-center gap-3 text-[11px] text-slate-400">
      <span class="flex items-center gap-1">
        <span class="w-2.5 h-0.5 bg-blue-500 rounded"></span> Ônibus (&lt;800km)
      </span>
      <span class="flex items-center gap-1">
        <span class="w-2.5 h-0.5 bg-red-500 rounded"></span> Voo (&gt;800km)
      </span>
      <span class="flex items-center gap-1">
        <span class="w-2.5 h-0.5 bg-yellow-400 rounded"></span> Translado
      </span>
    </div>
  </div>

  <div bind:this={mapElement} class="w-full h-full min-h-[450px] flex-1 dark-tiles z-0"></div>

  {#if $focusedRouteData}
    {@const rd = $focusedRouteData}
    <div class="absolute bottom-3 left-3 right-3 bg-slate-950/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md z-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {#if rd.route?.modal === 'FLIGHT'}
            <Plane class="w-5 h-5 animate-pulse" />
          {:else}
            <Navigation class="w-5 h-5" />
          {/if}
        </div>
        <div>
          <div class="font-extrabold text-white text-sm flex items-center gap-2">
            <span>{rd.awayTeam.nome}</span>
            <span class="text-slate-400 font-bold">✈</span>
            <span>{rd.homeTeam.nome}</span>
          </div>
          <p class="text-slate-400 text-[11px]">
            Confronto da Rodada | Modalidade: <span class="font-bold text-emerald-400">{rd.route?.modal === 'FLIGHT' ? 'Aérea (Com Hubs)' : 'Rodoviária (Direta)'}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
        <div>
          <span class="text-[10px] text-slate-400 block font-bold uppercase">Distância Total</span>
          <span class="font-extrabold text-cyan-400 text-sm">{rd.route?.totalDistanceKm} km</span>
        </div>
        <button
          on:click={() => focusedTeamId.set(null)}
          class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1 rounded-md text-[11px] border border-slate-700"
        >
          Limpar Rota
        </button>
      </div>
    </div>
  {/if}
</div>
