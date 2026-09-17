<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    teamsDb,
    currentGroupTeams,
    lastSimulatedRoundMatches,
    currentRoundMatches,
    simulatedRoundsCount,
    currentRound,
    activeDivision,
    activeGroup,
    focusedTeamId,
    focusedTeamStats,
    clearFocusedTeam,
    openSocialShareModal
  } from '$lib/stores/gameStore.js';
  import {
    CONFERENCE_COLORS,
    getFriendlyGroupName,
    getConferenceFromLeague
  } from '$lib/utils/leagueNames.js';
  import { computeConvexHull, generateCurvedPath } from '$lib/utils/geoUtils.js';
  import { base } from '$app/paths';
  import TeamBadge from './TeamBadge.svelte';
  import {
    MapPin,
    Navigation,
    Bus,
    Plane,
    Layers,
    X,
    Camera,
    DollarSign,
    Milestone,
    Shield
  } from 'lucide-svelte';

  let mapElement;
  let L;
  let map;
  let hullLayer;
  let routesLayer;
  let markersLayer;

  $: confKey = getConferenceFromLeague($activeGroup);
  $: confColor = CONFERENCE_COLORS[confKey] || CONFERENCE_COLORS['SUDESTE'];

  onMount(async () => {
    L = await import('leaflet');

    if (!mapElement) return;

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
    routesLayer = L.layerGroup().addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      map.dragging.disable();
      if (map.touchZoom) map.touchZoom.disable();
      isTouchInteractive = false;
    } else {
      map.dragging.enable();
      if (map.touchZoom) map.touchZoom.enable();
      isTouchInteractive = true;
    }

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    renderMap();
  });

  let isTouchInteractive = false;

  function toggleTouchInteraction() {
    isTouchInteractive = !isTouchInteractive;
    if (map) {
      if (isTouchInteractive) {
        map.dragging.enable();
        if (map.touchZoom) map.touchZoom.enable();
      } else {
        map.dragging.disable();
        if (map.touchZoom) map.touchZoom.disable();
      }
    }
  }

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  $: if (map && L && ($currentGroupTeams || $focusedTeamId || $simulatedRoundsCount || $activeGroup)) {
    renderMap();
  }

  function renderMap() {
    if (!map || !L || !markersLayer || !routesLayer || !hullLayer) return;

    markersLayer.clearLayers();
    routesLayer.clearLayers();
    hullLayer.clearLayers();

    const basePath = base ? base.replace(/\/$/, '') : '';
    const db = $teamsDb || {};
    const bounds = L.latLngBounds();

    // =================================================================
    // MODE B: FOCUSED TEAM SPECIFIC ITINERARY & ACCUMULATED TRIPS
    // =================================================================
    if ($focusedTeamId && $focusedTeamStats) {
      const stats = $focusedTeamStats;
      const homeTeam = stats.teamObj;

      if (homeTeam && typeof homeTeam.lat === 'number' && typeof homeTeam.lon === 'number') {
        bounds.extend([homeTeam.lat, homeTeam.lon]);

        const homeMatches = stats.homeMatches || [];
        const localAwayMatches = stats.localAwayMatches || [];

        // 1. If intra-city derbies exist, draw a rose pulsating radar halo around the home city
        if (localAwayMatches.length > 0) {
          const derbyHalo = L.circle([homeTeam.lat, homeTeam.lon], {
            radius: 14000,
            color: '#f43f5e',
            fillColor: '#fb7185',
            fillOpacity: 0.14,
            weight: 2,
            dashArray: '4, 4'
          });
          derbyHalo.bindTooltip(`⚔️ Clássico(s) Local(is): ${localAwayMatches.length} partida(s) na mesma cidade como visitante`, { sticky: true });
          derbyHalo.addTo(routesLayer);
        }

        // 2. Build Round Chips for Home Matches (Mandante)
        const homeChipsHtml = homeMatches.map(m => `
          <span class="px-1 py-0.2 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-500/50 font-mono text-[8px] font-black" title="R${m.rodada}: vs ${m.adversarioNome} (${m.placar})">
            R${m.rodada}
          </span>
        `).join('');

        // 3. Build Round Chips for Local Away Derbies (Visitante Local)
        const derbyChipsHtml = localAwayMatches.map(m => `
          <span class="px-1 py-0.2 rounded bg-rose-900/90 text-rose-200 border border-rose-500/50 font-mono text-[8px] font-black" title="R${m.rodada}: Derby vs ${m.adversarioNome} (${m.placar})">
            R${m.rodada}
          </span>
        `).join('');

        // 4. SOTA Home Hub Marker HTML
        const homeMarkerHtml = `
          <div class="flex flex-col items-center cursor-pointer select-none whitespace-nowrap">
            <!-- Main Sede Capsule -->
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/95 border-2 border-amber-400 shadow-2xl ring-2 ring-amber-500/30 hover:scale-105 transition-transform">
              <span class="text-xs">🏠</span>
              <span class="font-extrabold text-[10px] text-white tracking-tight uppercase">${homeTeam.nome || homeTeam.clube}</span>
              <span class="text-[9px] font-bold text-amber-300">SEDE</span>
              <span class="text-[8px] text-slate-400">(${homeTeam.cidade})</span>
            </div>

            <!-- Sub-row: Divided Mandante vs Visitante Local -->
            <div class="flex flex-wrap items-center justify-center gap-1 mt-1 max-w-[280px]">
              <!-- Mandante Chip Row (Casa) -->
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/95 border border-emerald-600/70 shadow-lg text-[9px] font-mono text-emerald-300">
                <span class="font-black text-[8px] uppercase tracking-wider">🏟️ Casa (${homeMatches.length}J):</span>
                <div class="flex items-center gap-0.5 flex-wrap">
                  ${homeChipsHtml || '<span class="text-slate-500 text-[8px]">0</span>'}
                </div>
              </div>

              <!-- Visitante Local (Clássico na mesma cidade) -->
              ${localAwayMatches.length > 0 ? `
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/95 border border-rose-600/70 shadow-lg text-[9px] font-mono text-rose-300">
                <span class="font-black text-[8px] uppercase tracking-wider">⚔️ Derby Fora (${localAwayMatches.length}J):</span>
                <div class="flex items-center gap-0.5 flex-wrap">
                  ${derbyChipsHtml}
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        `;

        const homeIcon = L.divIcon({
          html: homeMarkerHtml,
          className: 'custom-[home-hub-marker]',
          iconSize: [280, 56],
          iconAnchor: [140, 28],
          popupAnchor: [0, -28]
        });

        const homeMarker = L.marker([homeTeam.lat, homeTeam.lon], { icon: homeIcon });

        const homePopupHtml = `
          <div class="p-2 space-y-2.5 text-xs max-w-[280px]">
            <!-- Header -->
            <div class="border-b border-slate-800 pb-1.5 space-y-0.5">
              <div class="font-black text-sm text-white flex items-center gap-1.5">
                <span>🏠</span>
                <span>${homeTeam.nome || homeTeam.clube}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono font-bold">SEDE</span>
              </div>
              <div class="text-[11px] text-slate-400">${homeTeam.cidade} - ${homeTeam.uf} • ${homeTeam.estadio || 'Estádio Municipal'}</div>
            </div>

            <!-- Section 1: Jogos como Mandante -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                <span>🏟️ Jogos como Mandante (Casa)</span>
                <span class="font-mono text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">${homeMatches.length} partidas</span>
              </div>
              ${homeMatches.length > 0 ? `
                <div class="max-h-36 overflow-y-auto space-y-1 pr-1">
                  ${homeMatches.map(m => `
                    <div class="flex items-center justify-between text-[10px] py-1 px-1.5 rounded bg-slate-900/90 border border-slate-800">
                      <span class="font-mono font-bold text-emerald-400">R${m.rodada}</span>
                      <span class="text-slate-200 font-medium truncate max-w-[130px]" title="${m.adversarioNome}">vs ${m.adversarioNome}</span>
                      <span class="font-mono font-bold text-white">${m.placar}</span>
                      ${m.isLocalDerby ? '<span class="text-[8px] bg-rose-950 text-rose-300 border border-rose-800 px-1 rounded">Clássico</span>' : ''}
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-[10px] text-slate-500 italic">Nenhum jogo em casa até esta rodada.</p>'}
            </div>

            <!-- Section 2: Clássicos como Visitante Local (Mesma Cidade) -->
            ${localAwayMatches.length > 0 ? `
              <div class="space-y-1.5 pt-1.5 border-t border-slate-800">
                <div class="flex items-center justify-between text-[11px] font-bold text-rose-400">
                  <span>⚔️ Visitante Local (Mesma Cidade)</span>
                  <span class="font-mono text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded border border-rose-800">${localAwayMatches.length} partidas</span>
                </div>
                <div class="space-y-1">
                  ${localAwayMatches.map(m => `
                    <div class="flex items-center justify-between text-[10px] py-1 px-1.5 rounded bg-rose-950/40 border border-rose-900/60">
                      <span class="font-mono font-bold text-rose-400">R${m.rodada}</span>
                      <span class="text-slate-200 font-medium truncate max-w-[130px]" title="${m.adversarioNome}">@ ${m.adversarioNome}</span>
                      <span class="font-mono font-bold text-white">${m.placar}</span>
                      <span class="text-[8px] text-slate-400 font-mono">0 km</span>
                    </div>
                  `).join('')}
                </div>
                <p class="text-[9px] text-slate-400 italic leading-tight">Mando do adversário local; deslocamento intermunicipal nulo.</p>
              </div>
            ` : ''}

            <!-- Section 3: Summary / Context -->
            <div class="pt-1.5 border-t border-slate-800 text-[9px] text-slate-500 flex items-center justify-between">
              <span>Total no município: ${homeMatches.length + localAwayMatches.length} jogos</span>
              <span>Viagens fora: ${stats.awayTrips.length} jogos</span>
            </div>
          </div>
        `;

        homeMarker.bindPopup(homePopupHtml);
        homeMarker.addTo(markersLayer);
      }

      // 1. Draw route polylines & intra-city stay indicators
      stats.awayTrips.forEach(trip => {
        const d = trip.deslocamento;
        if (!d || !d.origem_coords || !d.destino_coords) return;

        const [oLat, oLon] = d.origem_coords;
        const [dLat, dLon] = d.destino_coords;
        if ((oLat === 0 && oLon === 0) || (dLat === 0 && dLon === 0)) return;
        if (Math.abs(oLat) > 40 || Math.abs(oLon) > 80 || Math.abs(dLat) > 40 || Math.abs(dLon) > 80) return;

        bounds.extend([oLat, oLon]);
        bounds.extend([dLat, dLon]);

        const isFlight = d.modal === 'AIR';
        const isTtpTour = d.origem_tipo === 'CIDADE_ADVERSARIO_ANTERIOR' || d.tipo_trecho === 'INTER_TURNE' || d.tipo_trecho === 'FIM_TURNE';
        const isSameCityStay = Math.abs(oLat - dLat) < 0.001 && Math.abs(oLon - dLon) < 0.001;

        if (isSameCityStay) {
          // Intra-city tour stay (consecutive matches in the same city)
          const halo = L.circle([dLat, dLon], {
            radius: 12000,
            color: '#c084fc',
            fillColor: '#a855f7',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '3, 4'
          });
          halo.bindTooltip(`★ Turnê TTP: Permaneceu em ${d.destino_cidade}/${d.destino_uf} para a Rodada ${trip.rodada}`, { sticky: true });
          halo.addTo(routesLayer);
        } else {
          let routePoints = [];
          let strokeColor = '#06b6d4'; // cyan bus
          let dashArray = null;

          if (isTtpTour) {
            strokeColor = '#a855f7'; // purple TTP
            dashArray = '6, 6';
          } else if (isFlight) {
            strokeColor = '#f59e0b'; // amber flight
            dashArray = '5, 5';
          }

          if (isFlight) {
            routePoints = generateCurvedPath(oLat, oLon, dLat, dLon, 25);
          } else {
            routePoints = [[oLat, oLon], [dLat, dLon]];
          }

          const polyline = L.polyline(routePoints, {
            color: strokeColor,
            weight: isTtpTour ? 4.5 : 3.5,
            opacity: 0.9,
            dashArray
          });

          const tooltipHtml = `
            <div class="text-xs p-1 space-y-1">
              <div class="font-extrabold text-white">Rodada ${trip.rodada}: vs ${trip.adversario.split('/')[0]}</div>
              <div class="text-slate-300">${d.origem_cidade}/${d.origem_uf} ➔ ${d.destino_cidade}/${d.destino_uf}</div>
              <div class="font-mono text-emerald-400 font-bold">${d.distancia_km.toFixed(1)} km • R$ ${d.custo_brl.toLocaleString('pt-BR')} (${d.modal})</div>
              ${isTtpTour ? '<div class="text-[10px] text-purple-300 font-bold">★ Conexão Direta em Turnê TTP (Sem voltar à sede)</div>' : ''}
            </div>
          `;

          polyline.bindTooltip(tooltipHtml, { sticky: true });
          polyline.addTo(routesLayer);
        }
      });

      // 2. SOTA Cluster Markers: Group away trips by destination location to eliminate overlap
      const destClusters = new Map();
      stats.awayTrips.forEach(trip => {
        const d = trip.deslocamento;
        if (!d || !d.destino_coords) return;
        const [dLat, dLon] = d.destino_coords;
        if ((dLat === 0 && dLon === 0) || Math.abs(dLat) > 40 || Math.abs(dLon) > 80) return;

        // Skip home city since it is already rendered by the Home Hub Marker
        if (homeTeam && typeof homeTeam.lat === 'number' && typeof homeTeam.lon === 'number') {
          if (Math.abs(dLat - homeTeam.lat) < 0.005 && Math.abs(dLon - homeTeam.lon) < 0.005) return;
        }

        const key = `${dLat.toFixed(3)},${dLon.toFixed(3)}`;
        if (!destClusters.has(key)) {
          destClusters.set(key, {
            lat: dLat,
            lon: dLon,
            cidade: d.destino_cidade || 'Cidade',
            uf: d.destino_uf || '',
            trips: []
          });
        }
        destClusters.get(key).trips.push(trip);
      });

      destClusters.forEach(cluster => {
        const count = cluster.trips.length;
        cluster.trips.sort((a, b) => a.rodada - b.rodada);
        const hasConsecutive = cluster.trips.some((t, i) => i > 0 && t.rodada === cluster.trips[i - 1].rodada + 1);

        if (count === 1) {
          const trip = cluster.trips[0];
          const isFlight = trip.deslocamento?.modal === 'AIR';
          const isTtp = trip.deslocamento?.origem_tipo === 'CIDADE_ADVERSARIO_ANTERIOR';

          const markerHtml = `
            <div class="w-6 h-6 rounded-full bg-slate-950 border-2 ${isTtp ? 'border-purple-400 bg-purple-950/90 ring-2 ring-purple-500/40' : (isFlight ? 'border-amber-400 bg-amber-950/90' : 'border-cyan-400 bg-cyan-950/90')} shadow-xl flex items-center justify-center text-[9px] font-mono font-black text-white hover:scale-125 transition-transform cursor-pointer">
              R${trip.rodada}
            </div>
          `;
          const icon = L.divIcon({
            html: markerHtml,
            className: 'custom-[opp-single-marker]',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
          });

          const m = L.marker([cluster.lat, cluster.lon], { icon });
          m.bindPopup(`
            <div class="p-2 space-y-1 text-xs">
              <div class="font-extrabold text-sm text-white">${cluster.cidade} - ${cluster.uf}</div>
              <div class="font-bold text-slate-200">Rodada ${trip.rodada}: vs ${trip.adversario.split('/')[0]}</div>
              <div class="font-mono text-amber-300 font-bold">Placar: ${trip.placar || 'vs'}</div>
              <div class="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                ${trip.deslocamento?.distancia_km.toFixed(1)} km • R$ ${trip.deslocamento?.custo_brl.toLocaleString('pt-BR')} (${trip.deslocamento?.modal})
              </div>
            </div>
          `);
          m.addTo(markersLayer);

        } else {
          // MULTIPLE MATCHES IN THE SAME CITY: SOTA Multi-Round Pill Badge
          const chipsHtml = cluster.trips.map((t, idx) => {
            const isConsec = idx > 0 && t.rodada === cluster.trips[idx - 1].rodada + 1;
            const isFlight = t.deslocamento?.modal === 'AIR';
            return `
              ${isConsec ? '<span class="text-purple-300 font-black text-[9px] leading-none">➔</span>' : (idx > 0 ? '<span class="text-slate-500 font-bold text-[8px] leading-none">·</span>' : '')}
              <span class="px-1.5 py-0.5 rounded ${isConsec ? 'bg-purple-900/90 text-purple-200 border border-purple-500/60' : (isFlight ? 'bg-amber-900/90 text-amber-200 border border-amber-500/50' : 'bg-cyan-900/90 text-cyan-200 border border-cyan-500/50')} font-mono text-[9px] font-black">
                R${t.rodada}
              </span>
            `;
          }).join('');

          const markerHtml = `
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/95 border-2 ${hasConsecutive ? 'border-purple-400 shadow-purple-950/80 ring-2 ring-purple-500/30' : 'border-amber-400 shadow-amber-950/80 ring-2 ring-amber-500/30'} shadow-2xl hover:scale-110 transition-transform cursor-pointer whitespace-nowrap">
              ${hasConsecutive ? '<span class="text-[10px] text-purple-300 font-bold">★</span>' : ''}
              <div class="flex items-center gap-1">
                ${chipsHtml}
              </div>
              <span class="text-[9px] font-black text-white pl-1 border-l border-slate-700/80 uppercase tracking-tight">${cluster.cidade}</span>
              <span class="text-[8px] font-bold text-amber-400 bg-amber-950/90 px-1 rounded">${count}J</span>
            </div>
          `;

          const icon = L.divIcon({
            html: markerHtml,
            className: 'custom-[opp-cluster-marker]',
            iconSize: [count * 32 + 80, 28],
            iconAnchor: [(count * 32 + 80) / 2, 14],
            popupAnchor: [0, -14]
          });

          const m = L.marker([cluster.lat, cluster.lon], { icon });

          const popupHtml = `
            <div class="p-2.5 space-y-2 text-xs min-w-[220px]">
              <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                <div>
                  <span class="font-black text-sm text-white block">${cluster.cidade} - ${cluster.uf}</span>
                  <span class="text-[10px] text-slate-400 font-medium">Múltiplos confrontos nesta praça</span>
                </div>
                <span class="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60 shrink-0">
                  ${count} partidas
                </span>
              </div>

              ${hasConsecutive ? `
                <div class="text-[10px] text-purple-300 font-bold bg-purple-950/70 border border-purple-700/60 p-1.5 rounded-lg flex items-center gap-1.5">
                  <span>★</span>
                  <span>Turnê TTP: Jogos consecutivos na mesma praça (sem retorno à sede)</span>
                </div>
              ` : ''}

              <div class="space-y-1.5 pt-1">
                ${cluster.trips.map(t => `
                  <div class="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold text-white text-[11px]">Rodada ${t.rodada}: vs ${t.adversario.split('/')[0]}</span>
                      <span class="font-mono font-black text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">${t.placar || 'vs'}</span>
                    </div>
                    <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <span>${t.deslocamento.origem_cidade} ➔ ${t.deslocamento.destino_cidade}</span>
                      <span class="text-emerald-400 font-bold">R$ ${t.deslocamento.custo_brl.toLocaleString('pt-BR')} (${t.deslocamento.modal})</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;

          m.bindPopup(popupHtml);
          m.addTo(markersLayer);
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      }
      return;
    }

    // =================================================================
    // MODE A: LEAGUE / CONFERENCE TERRITORY & ACTIVE ROUND ROUTES
    // =================================================================
    const teamIds = $currentGroupTeams || [];
    const activeTeams = teamIds
      .map(id => db[id])
      .filter(t => t && typeof t.lat === 'number' && typeof t.lon === 'number');

    if (activeTeams.length === 0) return;

    // 1. Convex Hull Polygon
    const hullCoords = activeTeams.map(t => [t.lat, t.lon]);
    if (hullCoords.length >= 3) {
      const hullPoly = computeConvexHull(hullCoords);
      if (hullPoly.length >= 3) {
        L.polygon(hullPoly, {
          color: confColor.primary,
          weight: 2,
          opacity: 0.7,
          fillColor: confColor.primary,
          fillOpacity: 0.12,
          dashArray: '4, 4'
        }).addTo(hullLayer);
      }
    }

    // 2. Active Round Travel Routes
    const matchesToRender = ($simulatedRoundsCount > 0 && $lastSimulatedRoundMatches.length > 0)
      ? $lastSimulatedRoundMatches
      : $currentRoundMatches;

    matchesToRender.forEach(m => {
      const d = m.deslocamento;
      if (!d || !d.origem_coords || !d.destino_coords) return;

      const [oLat, oLon] = d.origem_coords;
      const [dLat, dLon] = d.destino_coords;
      if ((oLat === 0 && oLon === 0) || (dLat === 0 && dLon === 0)) return;
      if (Math.abs(oLat) > 40 || Math.abs(oLon) > 80 || Math.abs(dLat) > 40 || Math.abs(dLon) > 80) return;

      bounds.extend([oLat, oLon]);
      bounds.extend([dLat, dLon]);

      const isFlight = d.modal === 'AIR';
      const isTtpTour = d.origem_tipo === 'CIDADE_ADVERSARIO_ANTERIOR' || d.tipo_trecho === 'INTER_TURNE' || d.tipo_trecho === 'FIM_TURNE';

      let routePoints = [];
      let strokeColor = '#06b6d4';
      let dashArray = null;

      if (isTtpTour) {
        strokeColor = '#a855f7';
        dashArray = '6, 6';
      } else if (isFlight) {
        strokeColor = '#f59e0b';
        dashArray = '5, 5';
      }

      if (isFlight) {
        routePoints = generateCurvedPath(oLat, oLon, dLat, dLon, 25);
      } else {
        routePoints = [[oLat, oLon], [dLat, dLon]];
      }

      const polyline = L.polyline(routePoints, {
        color: strokeColor,
        weight: isTtpTour ? 4.5 : 3.5,
        opacity: 0.9,
        dashArray
      });

      const tooltipHtml = `
        <div class="text-xs p-1 space-y-1">
          <div class="font-extrabold text-white">${m.mandante.split('/')[0]} vs ${m.visitante.split('/')[0]}</div>
          <div class="text-slate-300">${d.origem_cidade}/${d.origem_uf} ➔ ${d.destino_cidade}/${d.destino_uf}</div>
          <div class="font-mono text-emerald-400 font-bold">${d.distancia_km.toFixed(1)} km • R$ ${d.custo_brl.toLocaleString('pt-BR')} (${d.modal})</div>
          ${isTtpTour ? '<div class="text-[10px] text-purple-300 font-bold">★ Conexão Direta em Turnê TTP</div>' : ''}
        </div>
      `;

      polyline.bindTooltip(tooltipHtml, { sticky: true });
      polyline.addTo(routesLayer);
    });

    // 3. Club Markers with Shield Logos (with orbital spiderfy for co-located clubs)
    const teamsByCity = new Map();
    activeTeams.forEach(team => {
      bounds.extend([team.lat, team.lon]);
      const key = `${team.lat.toFixed(3)},${team.lon.toFixed(3)}`;
      if (!teamsByCity.has(key)) teamsByCity.set(key, []);
      teamsByCity.get(key).push(team);
    });

    teamsByCity.forEach((cityTeams) => {
      const numTeams = cityTeams.length;

      cityTeams.forEach((team, idx) => {
        let displayLat = team.lat;
        let displayLon = team.lon;

        // Apply slight orbital dispersion if multiple clubs share the exact same city coordinates
        if (numTeams > 1) {
          const angle = (2 * Math.PI * idx) / numTeams - Math.PI / 2;
          const radius = 0.018; // ~1.8 km dispersion
          displayLat = team.lat + radius * Math.sin(angle);
          displayLon = team.lon + (radius / Math.cos((team.lat * Math.PI) / 180)) * Math.cos(angle);
        }

        const parts = team.id ? team.id.split('/') : [];
        const clubeKey = team.clube || parts[0] || '';
        const estadoSlug = team.estado_slug || parts[1] || '';
        const initials = (team.nome || clubeKey).substring(0, 3).toUpperCase();
        const imgUrl = `${basePath}/teams/${encodeURIComponent(estadoSlug)}/${encodeURIComponent(clubeKey)}.png`;

        const markerHtml = `
          <div class="w-8 h-8 rounded-full bg-slate-900 border-2 shadow-lg flex items-center justify-center overflow-hidden hover:scale-125 transition-transform cursor-pointer relative" style="border-color: ${confColor.primary}">
            <img src="${imgUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="w-6 h-6 object-contain" />
            <div style="display:none;" class="w-full h-full bg-slate-800 text-white font-extrabold text-[8px] items-center justify-center select-none">${initials}</div>
            ${numTeams > 1 ? '<span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-indigo-500 border border-slate-950"></span>' : ''}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-[team-marker]',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const marker = L.marker([displayLat, displayLon], { icon: customIcon });

        const popupHtml = `
          <div class="p-2.5 space-y-1 text-xs">
            <div class="font-black text-sm text-white">${team.nome || team.clube}</div>
            <div class="text-xs text-slate-300 font-medium">${team.cidade} - ${team.uf}</div>
            <div class="text-[11px] text-slate-400">${team.estadio || 'Estádio Municipal'}</div>
            <div class="font-mono text-[10px] font-bold text-indigo-400">PageRank: ${team.pagerank ? team.pagerank.toFixed(5) : 'N/A'}</div>
            ${team.hub_aero_iata ? `<div class="text-[10px] text-slate-400">Hub: ${team.hub_aero_iata} (${team.dist_ate_aero_km} km)</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.addTo(markersLayer);
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-0 relative">
  
  <!-- Map Top Meta Bar -->
  <div class="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
    
    <div class="flex items-center gap-2">
      <Navigation class="w-4 h-4 text-indigo-400" />
      {#if $focusedTeamId && $focusedTeamStats}
        <span class="font-black text-xs text-amber-300">
          Trajetos Acumulados: {$focusedTeamStats.teamObj?.nome || $focusedTeamId.split('/')[0]}
        </span>
      {:else}
        <span class="font-black text-xs text-white">
          Cartografia & Rotas TTP: {getFriendlyGroupName($activeGroup)}
        </span>
        {#if $simulatedRoundsCount > 0}
          <span class="text-[11px] font-mono font-bold text-slate-400">
            (Rodada {$simulatedRoundsCount})
          </span>
        {/if}
      {/if}
    </div>

    <!-- Legend Items -->
    <div class="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-300">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-1 bg-cyan-400 rounded-full inline-block"></span>
        <span>Ônibus</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-1 bg-amber-400 rounded-full border border-dashed border-amber-300 inline-block"></span>
        <span>Avião</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-1 bg-purple-400 rounded-full inline-block"></span>
        <span class="text-purple-300 font-bold">Turnê TTP</span>
      </div>
      {#if !$focusedTeamId}
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full border border-dashed" style={`border-color: ${confColor.primary}; background-color: ${confColor.primary}33`}></span>
          <span>Mancha da Liga</span>
        </div>
      {/if}
    </div>

  </div>

  <!-- Focused Team Overlay Banner -->
  {#if $focusedTeamId && $focusedTeamStats}
    {@const s = $focusedTeamStats}
    <div class="bg-slate-950/95 border-b border-indigo-500/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
      <div class="flex items-center gap-3">
        <TeamBadge teamId={s.teamId} size="w-8 h-8" />
        <div>
          <div class="flex items-center gap-2">
            <span class="font-black text-white text-sm">{s.teamObj?.nome || s.teamId.split('/')[0]}</span>
            <span class="text-[10px] uppercase font-bold text-slate-400">{s.teamObj?.cidade} - {s.teamObj?.uf}</span>
          </div>
          <p class="text-[11px] text-slate-400">
            Estádio: {s.teamObj?.estadio || 'Municipal'} • PageRank: {s.teamObj?.pagerank?.toFixed(5) || 'N/A'}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-4 font-mono w-full sm:w-auto">
        <div class="text-left sm:text-right bg-slate-900/40 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
          <span class="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-bold">Mando</span>
          <span class="text-indigo-300 font-bold text-xs">{s.homeMatches?.length || 0} casa • {(s.awayTrips?.length || 0) + (s.localAwayMatches?.length || 0)} fora</span>
        </div>

        <div class="text-left sm:text-right bg-slate-900/40 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
          <span class="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-bold">Distância</span>
          <span class="text-white font-bold text-xs">{s.totalKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</span>
        </div>

        <div class="text-left sm:text-right bg-slate-900/40 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
          <span class="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-bold">Custo Logístico</span>
          <span class="text-emerald-400 font-bold text-xs">R$ {s.totalCostBrl.toLocaleString('pt-BR')}</span>
        </div>

        <div class="text-left sm:text-right bg-slate-900/40 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
          <span class="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-bold">Viagens</span>
          <span class="text-purple-300 font-bold text-xs">{s.awayTrips?.length || 0}j ({s.ttpTourTrips} turnês)</span>
        </div>

        <button
          type="button"
          on:click={openSocialShareModal}
          class="col-span-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all text-[10px] shadow-sm shadow-indigo-950/60"
          title="Gerar card visual em alta definição para redes sociais"
        >
          <Camera class="w-3.5 h-3.5" />
          <span>📸 Card</span>
        </button>

        <button
          on:click={clearFocusedTeam}
          class="col-span-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all min-h-[36px] sm:min-h-0"
          title="Fechar foco e voltar para visão da liga"
        >
          <X class="w-3.5 h-3.5" />
          <span class="text-[10px] font-bold">Voltar à Liga</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Leaflet Map Container -->
  <div class="w-full h-[340px] sm:h-[420px] lg:h-[520px] relative bg-slate-950">
    <div bind:this={mapElement} class="w-full h-full"></div>

    <!-- Mobile Scroll Trap Lock/Unlock Pill (Leaflet touch pan control) -->
    <div class="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto">
      <button
        on:click={toggleTouchInteraction}
        class="px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xl backdrop-blur-md transition-all flex items-center gap-1.5 {isTouchInteractive ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-indigo-900/60' : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800'}"
      >
        {#if isTouchInteractive}
          <span>🔒 Travar Rolagem da Página</span>
        {:else}
          <span>👆 Toque para Explorar Mapa</span>
        {/if}
      </button>
    </div>
  </div>

</div>
