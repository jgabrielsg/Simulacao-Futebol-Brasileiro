import { c as create_ssr_component, f as compute_rest_props, h as spread, i as escape_object, j as escape_attribute_value, b as each, v as validate_component, s as subscribe, e as escape, d as add_attribute } from "./ssr.js";
import { d as derived, w as writable } from "./index.js";
const void_element_names = /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;
function is_void(name) {
  return void_element_names.test(name) || name.toLowerCase() === "!doctype";
}
function sortStandings(standingsObj) {
  return Object.values(standingsObj).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.pagerank - a.pagerank;
  });
}
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === void 0 || lon1 === void 0 || lat2 === void 0 || lon2 === void 0) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function generateCurvedPath(startLat, startLon, endLat, endLon, numPoints = 25) {
  const points = [];
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;
  const dLat = endLat - startLat;
  const dLon = endLon - startLon;
  const distance = Math.sqrt(dLat * dLat + dLon * dLon);
  const curvature = 0.2 * distance;
  const ctrlLat = midLat + dLon / (distance || 1) * curvature;
  const ctrlLon = midLon - dLat / (distance || 1) * curvature;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * ctrlLat + t * t * endLat;
    const lon = (1 - t) * (1 - t) * startLon + 2 * (1 - t) * t * ctrlLon + t * t * endLon;
    points.push([lat, lon]);
  }
  return points;
}
function buildTransportRoute(awayTeam, homeTeam, awayHub, homeHub) {
  if (!awayTeam || !homeTeam) return null;
  const straightDist = haversineDistance(awayTeam.lat, awayTeam.lon, homeTeam.lat, homeTeam.lon);
  const roadDist = straightDist * 1.3;
  if (roadDist < 800 || !awayHub || !homeHub) {
    return {
      modal: "BUS",
      totalDistanceKm: Math.round(roadDist),
      segments: [
        {
          type: "BUS",
          color: "#3b82f6",
          // Blue
          dashArray: "5, 5",
          points: [
            [awayTeam.lat, awayTeam.lon],
            [homeTeam.lat, homeTeam.lon]
          ],
          label: `Ônibus: ${Math.round(roadDist)} km`
        }
      ]
    };
  } else {
    const leg1Dist = awayHub.dist_ate_aero_km || haversineDistance(awayTeam.lat, awayTeam.lon, awayHub.hub_aero_lat, awayHub.hub_aero_lon);
    const leg2Dist = haversineDistance(awayHub.hub_aero_lat, awayHub.hub_aero_lon, homeHub.hub_aero_lat, homeHub.hub_aero_lon);
    const leg3Dist = homeHub.dist_ate_aero_km || haversineDistance(homeHub.hub_aero_lat, homeHub.hub_aero_lon, homeTeam.lat, homeTeam.lon);
    const totalFlightTripDist = Math.round(leg1Dist + leg2Dist + leg3Dist);
    const flightArcPoints = generateCurvedPath(
      awayHub.hub_aero_lat,
      awayHub.hub_aero_lon,
      homeHub.hub_aero_lat,
      homeHub.hub_aero_lon
    );
    return {
      modal: "FLIGHT",
      totalDistanceKm: totalFlightTripDist,
      segments: [
        {
          type: "TRANSFER_OUT",
          color: "#eab308",
          // Yellow transfer
          dashArray: "3, 3",
          points: [
            [awayTeam.lat, awayTeam.lon],
            [awayHub.hub_aero_lat, awayHub.hub_aero_lon]
          ],
          label: `Translado p/ Aeroporto ${awayHub.hub_aero_iata}: ${Math.round(leg1Dist)} km`
        },
        {
          type: "FLIGHT",
          color: "#ef4444",
          // Red flight path
          dashArray: null,
          points: flightArcPoints,
          label: `Voo (${awayHub.hub_aero_iata} ➔ ${homeHub.hub_aero_iata}): ${Math.round(leg2Dist)} km`
        },
        {
          type: "TRANSFER_IN",
          color: "#10b981",
          // Green transfer
          dashArray: "3, 3",
          points: [
            [homeHub.hub_aero_lat, homeHub.hub_aero_lon],
            [homeTeam.lat, homeTeam.lon]
          ],
          label: `Translado p/ Estádio: ${Math.round(leg3Dist)} km`
        }
      ]
    };
  }
}
const teamsDb = writable({});
const airportsDb = writable({});
const cityHubs = writable({});
const loading = writable(true);
const error = writable(null);
const currentSeason = writable(1);
const currentLeagues = writable(null);
const selectedDivision = writable("serie_A");
const selectedRegion = writable("macro_0");
const schedulesStore = writable({});
const standingsStore = writable({});
const roundProgressStore = writable({});
const focusedTeamId = writable(null);
const isSeasonComplete = derived(
  [schedulesStore, roundProgressStore],
  ([$schedules, $progress]) => {
    const keys = Object.keys($schedules);
    if (keys.length === 0) return false;
    return keys.every((key) => {
      const schedule = $schedules[key] || [];
      const prog = $progress[key] || 0;
      return schedule.length > 0 && prog >= schedule.length;
    });
  }
);
const activeLeagueKey = derived(
  [selectedDivision, selectedRegion],
  ([$div, $reg]) => {
    if ($div === "serie_A" || $div === "serie_B") return $div;
    if ($div === "serie_C") return `serie_C.${$reg || "macro_0"}`;
    if ($div === "serie_D") return `serie_D.${$reg || "micro_0"}`;
    return "serie_A";
  }
);
const activeTeamIds = derived(
  [currentLeagues, selectedDivision, selectedRegion],
  ([$leagues, $div, $reg]) => {
    if (!$leagues) return [];
    if ($div === "serie_A") return $leagues.serie_A || [];
    if ($div === "serie_B") return $leagues.serie_B || [];
    if ($div === "serie_C") return $leagues.serie_C?.[$reg || "macro_0"] || [];
    if ($div === "serie_D") return $leagues.serie_D?.[$reg || "micro_0"] || [];
    return [];
  }
);
const activeStandings = derived(
  [standingsStore, activeLeagueKey],
  ([$standingsMap, $key]) => {
    const standingsObj = $standingsMap[$key] || {};
    return sortStandings(standingsObj);
  }
);
const activeSchedule = derived(
  [schedulesStore, activeLeagueKey],
  ([$schedules, $key]) => $schedules[$key] || []
);
const activeRoundIndex = derived(
  [roundProgressStore, activeLeagueKey],
  ([$progress, $key]) => $progress[$key] || 0
);
const activeTeamObjects = derived(
  [activeTeamIds, teamsDb],
  ([$ids, $db]) => $ids.map((id) => ({ id, ...$db[id] || {} }))
);
const focusedRouteData = derived(
  [focusedTeamId, activeTeamObjects, activeSchedule, activeRoundIndex, teamsDb, cityHubs],
  ([$focusedId, $teams, $schedule, $roundIdx, $teamsDb, $cHubs]) => {
    if (!$focusedId || !$schedule || $schedule.length === 0) return null;
    let nextMatch = null;
    let isHome = true;
    for (let r = $roundIdx; r < $schedule.length; r++) {
      const round = $schedule[r];
      const match = round.matches.find((m) => m.homeId === $focusedId || m.awayId === $focusedId);
      if (match) {
        nextMatch = match;
        isHome = match.homeId === $focusedId;
        break;
      }
    }
    if (!nextMatch) return null;
    const homeTeam = $teamsDb[nextMatch.homeId];
    const awayTeam = $teamsDb[nextMatch.awayId];
    const homeHub = $cHubs[nextMatch.homeId];
    const awayHub = $cHubs[nextMatch.awayId];
    if (!homeTeam || !awayTeam) return null;
    const route = buildTransportRoute(awayTeam, homeTeam, awayHub, homeHub);
    return {
      focusedTeamId: $focusedId,
      isHome,
      opponentId: isHome ? nextMatch.awayId : nextMatch.homeId,
      homeTeam,
      awayTeam,
      route
    };
  }
);
/**
 * @license lucide-svelte v0.350.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const Icon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["name", "color", "size", "strokeWidth", "absoluteStrokeWidth", "iconNode"]);
  let { name } = $$props;
  let { color = "currentColor" } = $$props;
  let { size = 24 } = $$props;
  let { strokeWidth = 2 } = $$props;
  let { absoluteStrokeWidth = false } = $$props;
  let { iconNode } = $$props;
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0) $$bindings.strokeWidth(strokeWidth);
  if ($$props.absoluteStrokeWidth === void 0 && $$bindings.absoluteStrokeWidth && absoluteStrokeWidth !== void 0) $$bindings.absoluteStrokeWidth(absoluteStrokeWidth);
  if ($$props.iconNode === void 0 && $$bindings.iconNode && iconNode !== void 0) $$bindings.iconNode(iconNode);
  return `<svg${spread(
    [
      escape_object(defaultAttributes),
      escape_object($$restProps),
      { width: escape_attribute_value(size) },
      { height: escape_attribute_value(size) },
      { stroke: escape_attribute_value(color) },
      {
        "stroke-width": escape_attribute_value(absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth)
      },
      {
        class: escape_attribute_value(`lucide-icon lucide lucide-${name} ${$$props.class ?? ""}`)
      }
    ],
    {}
  )}>${each(iconNode, ([tag, attrs]) => {
    return `${((tag$1) => {
      return tag$1 ? `<${tag}${spread([escape_object(attrs)], {})}>${is_void(tag$1) ? "" : ``}${is_void(tag$1) ? "" : `</${tag$1}>`}` : "";
    })(tag)}`;
  })}${slots.default ? slots.default({}) : ``}</svg>`;
});
const Award = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "12", "cy": "8", "r": "6" }],
    [
      "path",
      {
        "d": "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "award" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Compass = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    [
      "polygon",
      {
        "points": "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "compass" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Map_pin = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
      }
    ],
    ["circle", { "cx": "12", "cy": "10", "r": "3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "map-pin" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Play = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["polygon", { "points": "6 3 20 12 6 21 6 3" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "play" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Refresh_cw = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "refresh-cw" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Skip_forward = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["polygon", { "points": "5 4 15 12 5 20 5 4" }],
    [
      "line",
      {
        "x1": "19",
        "x2": "19",
        "y1": "5",
        "y2": "19"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "skip-forward" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Trophy = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }],
    ["path", { "d": "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }],
    ["path", { "d": "M4 22h16" }],
    [
      "path",
      {
        "d": "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
      }
    ],
    [
      "path",
      {
        "d": "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
      }
    ],
    ["path", { "d": "M18 2H6v7a6 6 0 0 0 12 0V2Z" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "trophy" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Navbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $currentSeason, $$unsubscribe_currentSeason;
  let $loading, $$unsubscribe_loading;
  let $isSeasonComplete, $$unsubscribe_isSeasonComplete;
  $$unsubscribe_currentSeason = subscribe(currentSeason, (value) => $currentSeason = value);
  $$unsubscribe_loading = subscribe(loading, (value) => $loading = value);
  $$unsubscribe_isSeasonComplete = subscribe(isSeasonComplete, (value) => $isSeasonComplete = value);
  $$unsubscribe_currentSeason();
  $$unsubscribe_loading();
  $$unsubscribe_isSeasonComplete();
  return `<header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 text-slate-100"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"> <a href="/" class="flex items-center gap-3 group"><div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform"><div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">${validate_component(Compass, "Compass").$$render(
    $$result,
    {
      class: "w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform"
    },
    {},
    {}
  )}</div></div> <div data-svelte-h="svelte-1dvckbh"><h1 class="font-extrabold text-base tracking-tight text-white flex items-center gap-2">LOGÍSTICA BRASILEIRÃO
          <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FGV TCC</span></h1> <p class="text-xs text-slate-400 font-medium">Otimização de Ligas &amp; Algoritmo de Clusters</p></div></a>  <nav class="hidden md:flex items-center gap-6 text-sm font-medium"><a href="/" class="hover:text-emerald-400 transition-colors" data-svelte-h="svelte-1wtmtn5">Apresentação</a> <a href="/dashboard" class="text-emerald-400 flex items-center gap-1.5 font-semibold">${validate_component(Map_pin, "MapPin").$$render($$result, { class: "w-4 h-4" }, {}, {})}
        Simulador Dashboard</a></nav>  <div class="flex items-center gap-3"> <div class="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">${validate_component(Trophy, "Trophy").$$render($$result, { class: "w-4 h-4 text-amber-400" }, {}, {})} <div class="text-xs"><span class="text-slate-400 block text-[9px] uppercase font-bold" data-svelte-h="svelte-12saupx">Temporada</span> <span class="font-extrabold text-white text-sm">Ano ${escape($currentSeason)}</span></div></div>  ${!$loading ? `<button title="Simular 1 Rodada de TODAS as Divisões e Regiões" class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer">${validate_component(Play, "Play").$$render($$result, { class: "w-3.5 h-3.5 fill-current" }, {}, {})} <span class="hidden sm:inline" data-svelte-h="svelte-1ikpbyg">Simular Rodada</span></button> <button title="Simular Todas as Rodadas Restantes do Brasil Inteiro" class="bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer">${validate_component(Skip_forward, "SkipForward").$$render($$result, { class: "w-3.5 h-3.5 fill-current" }, {}, {})} <span class="hidden sm:inline" data-svelte-h="svelte-1s0ejm9">Simular Ano</span></button> <button ${!$isSeasonComplete ? "disabled" : ""}${add_attribute(
    "title",
    $isSeasonComplete ? "Virar Temporada (Acessos, Rebaixamentos & Re-clusterização)" : "Finalize todas as rodadas de todas as ligas para virar a temporada",
    0
  )} class="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 shadow-none transition-all text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer">${validate_component(Refresh_cw, "RefreshCw").$$render($$result, { class: "w-3.5 h-3.5" }, {}, {})} <span class="hidden lg:inline" data-svelte-h="svelte-1w0n8re">Virar Temporada</span></button>` : ``}</div></div></header>`;
});
export {
  Award as A,
  Compass as C,
  Icon as I,
  Map_pin as M,
  Navbar as N,
  Play as P,
  Refresh_cw as R,
  Trophy as T,
  selectedRegion as a,
  activeRoundIndex as b,
  activeSchedule as c,
  cityHubs as d,
  activeTeamObjects as e,
  activeStandings as f,
  focusedTeamId as g,
  haversineDistance as h,
  focusedRouteData as i,
  airportsDb as j,
  error as k,
  loading as l,
  selectedDivision as s
};
