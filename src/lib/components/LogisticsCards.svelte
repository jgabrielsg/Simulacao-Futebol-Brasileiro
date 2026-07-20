<script>
  import { activeTeamObjects, activeStandings, cityHubs } from '$lib/stores/gameStore.js';
  import { haversineDistance } from '$lib/utils/geoUtils.js';
  import { Shield, Plane, Bus, Award, Navigation } from 'lucide-svelte';

  // Compute logistics metrics for active division/region
  $: numTeams = $activeTeamObjects.length;

  $: topPageRankTeam = $activeStandings.length > 0 ? $activeStandings[0] : null;

  // Compute average distance between all pairs in this division
  $: stats = computeDivisionLogistics($activeTeamObjects, $cityHubs);

  function computeDivisionLogistics(teams, hubs) {
    if (!teams || teams.length < 2) return { avgDistanceKm: 0, busRatioPct: 100, flightRatioPct: 0, uniqueHubs: 0 };
    
    let totalDist = 0;
    let pairs = 0;
    let busCount = 0;
    let flightCount = 0;
    const usedHubs = new Set();

    for (let i = 0; i < teams.length; i++) {
      const hubA = hubs[teams[i].id];
      if (hubA && hubA.hub_aero_iata) usedHubs.add(hubA.hub_aero_iata);

      for (let j = i + 1; j < teams.length; j++) {
        const t1 = teams[i];
        const t2 = teams[j];
        if (t1.lat && t1.lon && t2.lat && t2.lon) {
          const straight = haversineDistance(t1.lat, t1.lon, t2.lat, t2.lon);
          const road = straight * 1.3;
          totalDist += road;
          pairs++;

          if (road < 800) {
            busCount++;
          } else {
            flightCount++;
          }
        }
      }
    }

    const avgDist = pairs > 0 ? Math.round(totalDist / pairs) : 0;
    const busPct = pairs > 0 ? Math.round((busCount / pairs) * 100) : 100;
    const flightPct = pairs > 0 ? 100 - busPct : 0;

    return {
      avgDistanceKm: avgDist,
      busRatioPct: busPct,
      flightRatioPct: flightPct,
      uniqueHubs: usedHubs.size
    };
  }
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4">
  <!-- Card 1: Equipes & Divisão -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg">
    <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
      <Shield class="w-5 h-5" />
    </div>
    <div>
      <span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Clubes Ativos</span>
      <div class="text-xl font-extrabold text-white">{numTeams} Times</div>
      <p class="text-[10px] text-slate-400">Agrupamento Otimizado</p>
    </div>
  </div>

  <!-- Card 2: Distância Média -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg">
    <div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
      <Navigation class="w-5 h-5" />
    </div>
    <div>
      <span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Média de Viagem</span>
      <div class="text-xl font-extrabold text-cyan-400">{stats.avgDistanceKm} km</div>
      <p class="text-[10px] text-slate-400">Por confronto direto</p>
    </div>
  </div>

  <!-- Card 3: Modal Terrestre vs Aéreo -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg">
    <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
      <Plane class="w-5 h-5" />
    </div>
    <div>
      <span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Modais de Viagem</span>
      <div class="text-xs font-bold text-white flex items-center gap-2 mt-1">
        <span class="text-blue-400 flex items-center gap-1"><Bus class="w-3.5 h-3.5" /> {stats.busRatioPct}% Bus</span>
        <span class="text-red-400 flex items-center gap-1"><Plane class="w-3.5 h-3.5" /> {stats.flightRatioPct}% Voo</span>
      </div>
      <p class="text-[10px] text-slate-400">Corte de 800 km</p>
    </div>
  </div>

  <!-- Card 4: Top PageRank -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg">
    <div class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
      <Award class="w-5 h-5" />
    </div>
    <div>
      <span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Líder PageRank</span>
      <div class="text-sm font-extrabold text-purple-300 truncate max-w-[130px]" title={topPageRankTeam?.name || 'N/A'}>
        {topPageRankTeam ? topPageRankTeam.name : 'N/A'}
      </div>
      <p class="text-[10px] text-slate-400">
        Score: {topPageRankTeam ? topPageRankTeam.pagerank.toFixed(5) : '0'}
      </p>
    </div>
  </div>
</div>
