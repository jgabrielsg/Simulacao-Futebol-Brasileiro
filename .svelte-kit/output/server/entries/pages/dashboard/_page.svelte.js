import { c as create_ssr_component, v as validate_component, s as subscribe, b as each, d as add_attribute, e as escape, o as onDestroy } from "../../../chunks/ssr.js";
import { I as Icon, s as selectedDivision, a as selectedRegion, b as activeRoundIndex, c as activeSchedule, M as Map_pin, d as cityHubs, e as activeTeamObjects, f as activeStandings, A as Award, h as haversineDistance, g as focusedTeamId, T as Trophy, i as focusedRouteData, j as airportsDb, l as loading, k as error, N as Navbar, R as Refresh_cw } from "../../../chunks/Navbar.js";
const Alert_triangle = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "alert-triangle" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Bus = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M8 6v6" }],
    ["path", { "d": "M15 6v6" }],
    ["path", { "d": "M2 12h19.6" }],
    [
      "path",
      {
        "d": "M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"
      }
    ],
    ["circle", { "cx": "7", "cy": "18", "r": "2" }],
    ["path", { "d": "M9 18h5" }],
    ["circle", { "cx": "16", "cy": "18", "r": "2" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "bus" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Layers = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
      }
    ],
    [
      "path",
      {
        "d": "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
      }
    ],
    [
      "path",
      {
        "d": "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "layers" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Loader_2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["path", { "d": "M21 12a9 9 0 1 1-6.219-8.56" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "loader-2" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Navigation = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["polygon", { "points": "3 11 22 2 13 21 11 13 3 11" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "navigation" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Plane = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "plane" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Shield = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "shield" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const DivisionBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedDivision, $$unsubscribe_selectedDivision;
  let $$unsubscribe_selectedRegion;
  let $activeRoundIndex, $$unsubscribe_activeRoundIndex;
  let $activeSchedule, $$unsubscribe_activeSchedule;
  $$unsubscribe_selectedDivision = subscribe(selectedDivision, (value) => $selectedDivision = value);
  $$unsubscribe_selectedRegion = subscribe(selectedRegion, (value) => value);
  $$unsubscribe_activeRoundIndex = subscribe(activeRoundIndex, (value) => $activeRoundIndex = value);
  $$unsubscribe_activeSchedule = subscribe(activeSchedule, (value) => $activeSchedule = value);
  const divisions = [
    {
      id: "serie_A",
      name: "Série A",
      desc: "Nacional (20 times)",
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "serie_B",
      name: "Série B",
      desc: "Nacional (20 times)",
      color: "from-cyan-500 to-blue-600"
    },
    {
      id: "serie_C",
      name: "Série C",
      desc: "4 Macro-Regiões (Balanced K-Means)",
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "serie_D",
      name: "Série D",
      desc: "12 Micro-Regiões (Logística Local)",
      color: "from-purple-500 to-indigo-600"
    }
  ];
  const macroRegions = [
    {
      key: "macro_0",
      label: "Macro 0 (Centro-Sul / Sudeste)"
    },
    {
      key: "macro_1",
      label: "Macro 1 (Norte / Amazônia)"
    },
    {
      key: "macro_2",
      label: "Macro 2 (Sul / Interior)"
    },
    {
      key: "macro_3",
      label: "Macro 3 (Nordeste)"
    }
  ];
  const microRegions = Array.from({ length: 12 }, (_, i) => ({ key: `micro_${i}`, label: `Micro ${i}` }));
  $$unsubscribe_selectedDivision();
  $$unsubscribe_selectedRegion();
  $$unsubscribe_activeRoundIndex();
  $$unsubscribe_activeSchedule();
  return `<div class="bg-slate-900 border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8"><div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4"> <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none"><div class="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mr-2 shrink-0">${validate_component(Layers, "Layers").$$render($$result, { class: "w-4 h-4 text-emerald-400" }, {}, {})}
        Divisões:</div> ${each(divisions, (div) => {
    return `<button${add_attribute(
      "class",
      `px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${$selectedDivision === div.id ? `bg-gradient-to-r ${div.color} text-white border-transparent shadow-lg shadow-black/40 scale-105` : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white"}`,
      0
    )}>${escape(div.name)} </button>`;
  })}</div>  <div class="flex items-center gap-3 shrink-0 text-xs"> ${$selectedDivision === "serie_C" ? `<div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5">${validate_component(Map_pin, "MapPin").$$render($$result, { class: "w-3.5 h-3.5 text-amber-400" }, {}, {})} <span class="text-slate-400 font-medium" data-svelte-h="svelte-10ztbgx">Região:</span> <select class="bg-slate-900 text-amber-300 font-semibold text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-amber-500">${each(macroRegions, (reg) => {
    return `<option${add_attribute("value", reg.key, 0)}>${escape(reg.label)}</option>`;
  })}</select></div>` : `${$selectedDivision === "serie_D" ? `<div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5">${validate_component(Map_pin, "MapPin").$$render($$result, { class: "w-3.5 h-3.5 text-purple-400" }, {}, {})} <span class="text-slate-400 font-medium" data-svelte-h="svelte-10ztbgx">Região:</span> <select class="bg-slate-900 text-purple-300 font-semibold text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-purple-500">${each(microRegions, (reg) => {
    return `<option${add_attribute("value", reg.key, 0)}>${escape(reg.label)}</option>`;
  })}</select></div>` : ``}`}  <div class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2"><span class="text-slate-400 text-[10px] uppercase font-bold" data-svelte-h="svelte-160z8jz">Progresso:</span> <span class="font-extrabold text-emerald-400">Rodada ${escape($activeRoundIndex)} / ${escape($activeSchedule.length)}</span></div></div></div></div>`;
});
const LogisticsCards = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let numTeams;
  let topPageRankTeam;
  let stats;
  let $cityHubs, $$unsubscribe_cityHubs;
  let $activeTeamObjects, $$unsubscribe_activeTeamObjects;
  let $activeStandings, $$unsubscribe_activeStandings;
  $$unsubscribe_cityHubs = subscribe(cityHubs, (value) => $cityHubs = value);
  $$unsubscribe_activeTeamObjects = subscribe(activeTeamObjects, (value) => $activeTeamObjects = value);
  $$unsubscribe_activeStandings = subscribe(activeStandings, (value) => $activeStandings = value);
  function computeDivisionLogistics(teams, hubs) {
    if (!teams || teams.length < 2) return {
      avgDistanceKm: 0,
      busRatioPct: 100,
      flightRatioPct: 0,
      uniqueHubs: 0
    };
    let totalDist = 0;
    let pairs = 0;
    let busCount = 0;
    const usedHubs = /* @__PURE__ */ new Set();
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
          }
        }
      }
    }
    const avgDist = pairs > 0 ? Math.round(totalDist / pairs) : 0;
    const busPct = pairs > 0 ? Math.round(busCount / pairs * 100) : 100;
    const flightPct = pairs > 0 ? 100 - busPct : 0;
    return {
      avgDistanceKm: avgDist,
      busRatioPct: busPct,
      flightRatioPct: flightPct,
      uniqueHubs: usedHubs.size
    };
  }
  numTeams = $activeTeamObjects.length;
  topPageRankTeam = $activeStandings.length > 0 ? $activeStandings[0] : null;
  stats = computeDivisionLogistics($activeTeamObjects, $cityHubs);
  $$unsubscribe_cityHubs();
  $$unsubscribe_activeTeamObjects();
  $$unsubscribe_activeStandings();
  return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4"> <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg"><div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">${validate_component(Shield, "Shield").$$render($$result, { class: "w-5 h-5" }, {}, {})}</div> <div><span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider" data-svelte-h="svelte-qrqpkf">Clubes Ativos</span> <div class="text-xl font-extrabold text-white">${escape(numTeams)} Times</div> <p class="text-[10px] text-slate-400" data-svelte-h="svelte-jp66pp">Agrupamento Otimizado</p></div></div>  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg"><div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">${validate_component(Navigation, "Navigation").$$render($$result, { class: "w-5 h-5" }, {}, {})}</div> <div><span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider" data-svelte-h="svelte-2ch21x">Média de Viagem</span> <div class="text-xl font-extrabold text-cyan-400">${escape(stats.avgDistanceKm)} km</div> <p class="text-[10px] text-slate-400" data-svelte-h="svelte-dy0qig">Por confronto direto</p></div></div>  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg"><div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">${validate_component(Plane, "Plane").$$render($$result, { class: "w-5 h-5" }, {}, {})}</div> <div><span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider" data-svelte-h="svelte-1ff0aq2">Modais de Viagem</span> <div class="text-xs font-bold text-white flex items-center gap-2 mt-1"><span class="text-blue-400 flex items-center gap-1">${validate_component(Bus, "Bus").$$render($$result, { class: "w-3.5 h-3.5" }, {}, {})} ${escape(stats.busRatioPct)}% Bus</span> <span class="text-red-400 flex items-center gap-1">${validate_component(Plane, "Plane").$$render($$result, { class: "w-3.5 h-3.5" }, {}, {})} ${escape(stats.flightRatioPct)}% Voo</span></div> <p class="text-[10px] text-slate-400" data-svelte-h="svelte-wdtp3u">Corte de 800 km</p></div></div>  <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-lg"><div class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">${validate_component(Award, "Award").$$render($$result, { class: "w-5 h-5" }, {}, {})}</div> <div><span class="text-[11px] font-bold uppercase text-slate-400 tracking-wider" data-svelte-h="svelte-sghx5s">Líder PageRank</span> <div class="text-sm font-extrabold text-purple-300 truncate max-w-[130px]"${add_attribute("title", topPageRankTeam?.name || "N/A", 0)}>${escape(topPageRankTeam ? topPageRankTeam.name : "N/A")}</div> <p class="text-[10px] text-slate-400">Score: ${escape(topPageRankTeam ? topPageRankTeam.pagerank.toFixed(5) : "0")}</p></div></div></div>`;
});
function getImageSrc(slug, key, teamNameAttr, currAttempt) {
  if (!slug) return null;
  if (currAttempt === 0 && key) {
    return `/teams/${slug}/${key}.png`;
  }
  if (currAttempt === 1 && teamNameAttr) {
    return `/teams/${slug}/${teamNameAttr}.png`;
  }
  return null;
}
function getInitials(str) {
  if (!str) return "FC";
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  } else {
    return str.substring(0, 3).toUpperCase();
  }
}
function getHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
const TeamBadge = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let parts;
  let clubeKey;
  let estadoSlug;
  let teamName;
  let initials;
  let imgSrc;
  let bgHue;
  let { teamId = "" } = $$props;
  let { name = "" } = $$props;
  let { state = "" } = $$props;
  let { size = "w-7 h-7" } = $$props;
  let { alt = "" } = $$props;
  let attempt = 0;
  if ($$props.teamId === void 0 && $$bindings.teamId && teamId !== void 0) $$bindings.teamId(teamId);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.state === void 0 && $$bindings.state && state !== void 0) $$bindings.state(state);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
  parts = teamId ? teamId.split("/") : [];
  clubeKey = parts[0] || name || "";
  estadoSlug = parts[1] || (state ? state.toLowerCase().replace(/\s+/g, "_") : "");
  teamName = name || clubeKey || "TIM";
  initials = getInitials(teamName);
  {
    if (teamId) {
      attempt = 0;
    }
  }
  imgSrc = getImageSrc(estadoSlug, clubeKey, name, attempt);
  bgHue = getHue(teamName);
  return `<div${add_attribute("class", `relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none ${size}`, 0)}>${imgSrc && attempt < 2 ? `<img${add_attribute("src", imgSrc, 0)}${add_attribute("alt", alt || teamName, 0)} class="w-full h-full object-contain filter drop-shadow">` : ` <div class="w-full h-full rounded-full flex items-center justify-center font-bold text-[10px] tracking-wider text-white shadow-inner border border-white/20"${add_attribute("style", `background: linear-gradient(135deg, hsl(${bgHue}, 70%, 35%), hsl(${(bgHue + 40) % 360}, 80%, 20%));`, 0)}${add_attribute("title", `${teamName} (${state || ""})`, 0)}>${escape(initials)}</div>`}</div>`;
});
function getZoneClass(idx, total, div) {
  if (div === "serie_A") {
    if (idx < 4) return "border-l-4 border-l-emerald-500 bg-emerald-950/20";
    if (idx < 6) return "border-l-4 border-l-teal-500 bg-teal-950/10";
    if (idx >= total - 4) return "border-l-4 border-l-rose-500 bg-rose-950/20";
  } else if (div === "serie_B") {
    if (idx < 4) return "border-l-4 border-l-emerald-500 bg-emerald-950/20";
    if (idx >= total - 4) return "border-l-4 border-l-rose-500 bg-rose-950/20";
  } else if (div === "serie_C") {
    if (idx === 0) return "border-l-4 border-l-emerald-500 bg-emerald-950/20";
    if (idx === total - 1) return "border-l-4 border-l-rose-500 bg-rose-950/20";
  } else if (div === "serie_D") {
    if (idx === 0) return "border-l-4 border-l-emerald-500 bg-emerald-950/20";
    if (idx >= total - 4) return "border-l-4 border-l-rose-500 bg-rose-950/20";
  }
  return "";
}
const LeagueTable = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $focusedTeamId, $$unsubscribe_focusedTeamId;
  let $activeStandings, $$unsubscribe_activeStandings;
  let $selectedDivision, $$unsubscribe_selectedDivision;
  let $cityHubs, $$unsubscribe_cityHubs;
  $$unsubscribe_focusedTeamId = subscribe(focusedTeamId, (value) => $focusedTeamId = value);
  $$unsubscribe_activeStandings = subscribe(activeStandings, (value) => $activeStandings = value);
  $$unsubscribe_selectedDivision = subscribe(selectedDivision, (value) => $selectedDivision = value);
  $$unsubscribe_cityHubs = subscribe(cityHubs, (value) => $cityHubs = value);
  $$unsubscribe_focusedTeamId();
  $$unsubscribe_activeStandings();
  $$unsubscribe_selectedDivision();
  $$unsubscribe_cityHubs();
  return `<div class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl"> <div class="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between"><div class="flex items-center gap-2 font-bold text-sm text-slate-200">${validate_component(Trophy, "Trophy").$$render($$result, { class: "w-4 h-4 text-amber-400" }, {}, {})}
      Tabela de Classificação</div> <div class="text-xs text-slate-400 font-normal" data-svelte-h="svelte-1egtqwj">Clique na linha para ver as rotas de viagem no Mapa</div></div>  <div class="overflow-x-auto max-h-[520px] overflow-y-auto"><table class="w-full text-left text-xs text-slate-300"><thead class="bg-slate-950/90 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10" data-svelte-h="svelte-dvnx7x"><tr><th class="py-2.5 px-3 text-center w-8">#</th> <th class="py-2.5 px-3">Clube</th> <th class="py-2.5 px-2 text-center font-extrabold text-white">PTS</th> <th class="py-2.5 px-2 text-center">J</th> <th class="py-2.5 px-2 text-center">V</th> <th class="py-2.5 px-2 text-center">E</th> <th class="py-2.5 px-2 text-center">D</th> <th class="py-2.5 px-2 text-center">GP</th> <th class="py-2.5 px-2 text-center">GC</th> <th class="py-2.5 px-2 text-center">SG</th> <th class="py-2.5 px-3 text-center">PageRank</th> <th class="py-2.5 px-3 text-left hidden sm:table-cell">Hub Aéreo</th></tr></thead> <tbody class="divide-y divide-slate-800/60 font-medium">${each($activeStandings, (item, idx) => {
    let isFocused = $focusedTeamId === item.teamId, zoneClass = getZoneClass(idx, $activeStandings.length, $selectedDivision), hubInfo = $cityHubs[item.teamId];
    return `   <tr${add_attribute(
      "class",
      `cursor-pointer transition-colors hover:bg-slate-800/80 ${zoneClass} ${isFocused ? "bg-emerald-950/40 ring-1 ring-emerald-500/50" : "even:bg-slate-950/30"}`,
      0
    )}> <td class="py-2 px-3 text-center font-bold text-slate-400">${escape(idx + 1)}</td>  <td class="py-2 px-3 flex items-center gap-2.5 min-w-[170px]">${validate_component(TeamBadge, "TeamBadge").$$render(
      $$result,
      {
        teamId: item.teamId,
        name: item.name,
        state: item.state,
        size: "w-6 h-6"
      },
      {},
      {}
    )} <div class="truncate"><span class="font-bold text-slate-100 block text-xs truncate max-w-[130px]"${add_attribute("title", item.name, 0)}>${escape(item.name)}</span> <span class="text-[9px] text-slate-500 font-semibold uppercase">${escape(item.state)}</span> </div></td>  <td class="py-2 px-2 text-center font-extrabold text-emerald-400 text-sm">${escape(item.points)}</td>  <td class="py-2 px-2 text-center text-slate-300">${escape(item.played)}</td> <td class="py-2 px-2 text-center text-emerald-400">${escape(item.won)}</td> <td class="py-2 px-2 text-center text-amber-400">${escape(item.drawn)}</td> <td class="py-2 px-2 text-center text-rose-400">${escape(item.lost)}</td> <td class="py-2 px-2 text-center text-slate-400">${escape(item.goalsFor)}</td> <td class="py-2 px-2 text-center text-slate-400">${escape(item.goalsAgainst)}</td> <td class="${"py-2 px-2 text-center font-bold $" + escape(
      item.goalDifference > 0 ? "text-emerald-400" : item.goalDifference < 0 ? "text-rose-400" : "text-slate-400",
      true
    )}">${escape(item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference)}</td>  <td class="py-2 px-3 text-center font-mono text-[11px] text-purple-300">${escape((item.pagerank * 1e3).toFixed(2))}</td>  <td class="py-2 px-3 text-left text-[11px] text-slate-400 hidden sm:table-cell">${hubInfo && hubInfo.hub_aero_iata ? `<div class="flex items-center gap-1.5">${validate_component(Plane, "Plane").$$render($$result, { class: "w-3 h-3 text-cyan-400 shrink-0" }, {}, {})} <span class="font-bold text-cyan-300">${escape(hubInfo.hub_aero_iata)}</span> <span class="text-[10px] text-slate-500">(${escape(hubInfo.dist_ate_aero_km)} km)</span> </div>` : `<span class="text-slate-600" data-svelte-h="svelte-1b94i92">-</span>`}</td> </tr>`;
  })}</tbody></table></div></div>`;
});
const Map = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_focusedTeamId;
  let $$unsubscribe_cityHubs;
  let $focusedRouteData, $$unsubscribe_focusedRouteData;
  let $$unsubscribe_activeTeamObjects;
  let $$unsubscribe_airportsDb;
  $$unsubscribe_focusedTeamId = subscribe(focusedTeamId, (value) => value);
  $$unsubscribe_cityHubs = subscribe(cityHubs, (value) => value);
  $$unsubscribe_focusedRouteData = subscribe(focusedRouteData, (value) => $focusedRouteData = value);
  $$unsubscribe_activeTeamObjects = subscribe(activeTeamObjects, (value) => value);
  $$unsubscribe_airportsDb = subscribe(airportsDb, (value) => value);
  let mapElement;
  onDestroy(() => {
  });
  $$unsubscribe_focusedTeamId();
  $$unsubscribe_cityHubs();
  $$unsubscribe_focusedRouteData();
  $$unsubscribe_activeTeamObjects();
  $$unsubscribe_airportsDb();
  return `<div class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[520px] min-h-[500px] relative"><div class="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between z-10"><div class="flex items-center gap-2 font-bold text-sm text-slate-200">${validate_component(Navigation, "Navigation").$$render($$result, { class: "w-4 h-4 text-emerald-400" }, {}, {})}
      Visualização Geográfica das Rotas</div> <div class="flex items-center gap-3 text-[11px] text-slate-400" data-svelte-h="svelte-1xyy9nd"><span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-blue-500 rounded"></span> Ônibus (&lt;800km)</span> <span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-red-500 rounded"></span> Voo (&gt;800km)</span> <span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-yellow-400 rounded"></span> Translado</span></div></div> <div class="w-full h-full min-h-[450px] flex-1 dark-tiles z-0"${add_attribute("this", mapElement, 0)}></div> ${$focusedRouteData ? (() => {
    let rd = $focusedRouteData;
    return ` <div class="absolute bottom-3 left-3 right-3 bg-slate-950/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md z-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"><div class="flex items-center gap-3"><div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${rd.route?.modal === "FLIGHT" ? `${validate_component(Plane, "Plane").$$render($$result, { class: "w-5 h-5 animate-pulse" }, {}, {})}` : `${validate_component(Navigation, "Navigation").$$render($$result, { class: "w-5 h-5" }, {}, {})}`}</div> <div><div class="font-extrabold text-white text-sm flex items-center gap-2"><span>${escape(rd.awayTeam.nome)}</span> <span class="text-slate-400 font-bold" data-svelte-h="svelte-apujca">✈</span> <span>${escape(rd.homeTeam.nome)}</span></div> <p class="text-slate-400 text-[11px]">Confronto da Rodada | Modalidade: <span class="font-bold text-emerald-400">${escape(rd.route?.modal === "FLIGHT" ? "Aérea (Com Hubs)" : "Rodoviária (Direta)")}</span></p></div></div> <div class="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4"><div><span class="text-[10px] text-slate-400 block font-bold uppercase" data-svelte-h="svelte-ur49jd">Distância Total</span> <span class="font-extrabold text-cyan-400 text-sm">${escape(rd.route?.totalDistanceKm)} km</span></div> <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1 rounded-md text-[11px] border border-slate-700" data-svelte-h="svelte-pqwuc8">Limpar Rota</button></div></div>`;
  })() : ``}</div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $loading, $$unsubscribe_loading;
  let $error, $$unsubscribe_error;
  $$unsubscribe_loading = subscribe(loading, (value) => $loading = value);
  $$unsubscribe_error = subscribe(error, (value) => $error = value);
  $$unsubscribe_loading();
  $$unsubscribe_error();
  return `<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">${validate_component(Navbar, "Navbar").$$render($$result, {}, {}, {})} ${validate_component(DivisionBar, "DivisionBar").$$render($$result, {}, {}, {})} <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">${$loading ? ` <div class="flex flex-col items-center justify-center min-h-[450px] space-y-4">${validate_component(Loader_2, "Loader2").$$render(
    $$result,
    {
      class: "w-10 h-10 text-emerald-400 animate-spin"
    },
    {},
    {}
  )} <div class="text-center" data-svelte-h="svelte-1hnfid7"><p class="text-lg font-bold text-white">Carregando Base de Dados Logística...</p> <p class="text-xs text-slate-400">Processando equipes, aeroportos hubs e malha de voos.</p></div></div>` : `${$error ? ` <div class="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 max-w-lg mx-auto my-12 text-center space-y-4">${validate_component(Alert_triangle, "AlertTriangle").$$render($$result, { class: "w-10 h-10 text-rose-400 mx-auto" }, {}, {})} <div><h3 class="text-lg font-bold text-rose-200" data-svelte-h="svelte-zujut0">Erro de Inicialização</h3> <p class="text-sm text-slate-300 mt-1">${escape($error)}</p></div> <button class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2">${validate_component(Refresh_cw, "RefreshCw").$$render($$result, { class: "w-4 h-4" }, {}, {})} Tentar Novamente</button></div>` : ` ${validate_component(LogisticsCards, "LogisticsCards").$$render($$result, {}, {}, {})}  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"> <div class="lg:col-span-5 w-full">${validate_component(LeagueTable, "LeagueTable").$$render($$result, {}, {}, {})}</div>  <div class="lg:col-span-7 w-full">${validate_component(Map, "Map").$$render($$result, {}, {}, {})}</div></div>`}`}</main></div>`;
});
export {
  Page as default
};
