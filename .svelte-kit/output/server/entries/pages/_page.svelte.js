import { c as create_ssr_component, v as validate_component } from "../../chunks/ssr.js";
import { I as Icon, N as Navbar, C as Compass, P as Play, M as Map_pin, A as Award } from "../../chunks/Navbar.js";
const Arrow_right = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["path", { "d": "M5 12h14" }], ["path", { "d": "m12 5 7 7-7 7" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "arrow-right" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Check_circle_2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "check-circle-2" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Cpu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "rect",
      {
        "x": "4",
        "y": "4",
        "width": "16",
        "height": "16",
        "rx": "2"
      }
    ],
    [
      "rect",
      {
        "x": "9",
        "y": "9",
        "width": "6",
        "height": "6"
      }
    ],
    ["path", { "d": "M15 2v2" }],
    ["path", { "d": "M15 20v2" }],
    ["path", { "d": "M2 15h2" }],
    ["path", { "d": "M2 9h2" }],
    ["path", { "d": "M20 15h2" }],
    ["path", { "d": "M20 9h2" }],
    ["path", { "d": "M9 2v2" }],
    ["path", { "d": "M9 20v2" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "cpu" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Network = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "rect",
      {
        "x": "16",
        "y": "16",
        "width": "6",
        "height": "6",
        "rx": "1"
      }
    ],
    [
      "rect",
      {
        "x": "2",
        "y": "16",
        "width": "6",
        "height": "6",
        "rx": "1"
      }
    ],
    [
      "rect",
      {
        "x": "9",
        "y": "2",
        "width": "6",
        "height": "6",
        "rx": "1"
      }
    ],
    [
      "path",
      {
        "d": "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"
      }
    ],
    ["path", { "d": "M12 12V8" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "network" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">${validate_component(Navbar, "Navbar").$$render($$result, {}, {}, {})}  <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16"><div class="text-center max-w-3xl mx-auto space-y-6"><div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">${validate_component(Compass, "Compass").$$render($$result, { class: "w-4 h-4 animate-spin-slow" }, {}, {})}
        TCC FGV - Reestruturação Logística do Futebol Brasileiro</div> <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight" data-svelte-h="svelte-1s1awzf">Simulador Logístico das Divisões do Futebol Brasileiro</h1> <p class="text-lg text-slate-300 leading-relaxed" data-svelte-h="svelte-10p4j86">Uma aplicação interativa para visualização e simulação dos modelos de otimização logística das Séries A, B, C e D do futebol brasileiro. Utiliza algoritmos de <strong class="text-emerald-400">Clusterização Geográfica (Balanced K-Means)</strong> e <strong class="text-purple-400">Teoria dos Grafos (PageRank)</strong>.</p> <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"><a href="/dashboard" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer">${validate_component(Play, "Play").$$render($$result, { class: "w-5 h-5 fill-current" }, {}, {})}
          Iniciar Simulação no Dashboard
          ${validate_component(Arrow_right, "ArrowRight").$$render(
    $$result,
    {
      class: "w-5 h-5 group-hover:translate-x-1 transition-transform"
    },
    {},
    {}
  )}</a></div></div>  <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"> <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all"><div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">${validate_component(Cpu, "Cpu").$$render($$result, { class: "w-6 h-6" }, {}, {})}</div> <h3 class="text-xl font-bold text-white mb-2" data-svelte-h="svelte-x7icfh">Balanced K-Means</h3> <p class="text-sm text-slate-400 leading-relaxed" data-svelte-h="svelte-kv77wn">Reestruturação regional das Séries C (4 macrorregiões de 20 times) e D (12 microrregiões de 16 times), garantindo equilíbrio numérico de equipes e minimizando o deslocamento terrestre e aéreo.</p></div>  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all"><div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">${validate_component(Network, "Network").$$render($$result, { class: "w-6 h-6" }, {}, {})}</div> <h3 class="text-xl font-bold text-white mb-2" data-svelte-h="svelte-eful32">PageRank dos Clubes</h3> <p class="text-sm text-slate-400 leading-relaxed" data-svelte-h="svelte-yq0ugb">Aplicação de Teoria dos Grafos baseada em dados históricos dos confrontos do futebol brasileiro para ranquear e ponderar a competitividade técnica e estocástica dos placares no motor de jogos.</p></div>  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all"><div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">${validate_component(Map_pin, "MapPin").$$render($$result, { class: "w-6 h-6" }, {}, {})}</div> <h3 class="text-xl font-bold text-white mb-2" data-svelte-h="svelte-1c88wci">Malha Logística de Hubs</h3> <p class="text-sm text-slate-400 leading-relaxed" data-svelte-h="svelte-zv8alx">Cálculo prévio das rotas e do aeroporto hub mais próximo de cada sede de clube (limiar de 800 km para transição entre viagens terrestres de ônibus e aéreas multi-leg).</p></div></div>  <div class="mt-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 max-w-4xl mx-auto"><h3 class="text-lg font-extrabold text-white mb-4 flex items-center gap-2">${validate_component(Award, "Award").$$render($$result, { class: "w-5 h-5 text-amber-400" }, {}, {})}
        Funcionalidades da Simulação (Football Manager Analytics):</h3> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300"><div class="flex items-start gap-2.5">${validate_component(Check_circle_2, "CheckCircle2").$$render(
    $$result,
    {
      class: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
    },
    {},
    {}
  )} <span data-svelte-h="svelte-1uhx0t1">Motor estocástico de partidas com distribuição de Poisson baseada no PageRank.</span></div> <div class="flex items-start gap-2.5">${validate_component(Check_circle_2, "CheckCircle2").$$render(
    $$result,
    {
      class: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
    },
    {},
    {}
  )} <span data-svelte-h="svelte-dv7xut">Re-clusterização regional gulosa (Greedy Assignment) nas Séries C e D durante viradas de temporada.</span></div> <div class="flex items-start gap-2.5">${validate_component(Check_circle_2, "CheckCircle2").$$render(
    $$result,
    {
      class: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
    },
    {},
    {}
  )} <span data-svelte-h="svelte-1p1x2f5">Mapa interativo Leaflet com traçado de voos em arco e translados para aeroportos hubs.</span></div> <div class="flex items-start gap-2.5">${validate_component(Check_circle_2, "CheckCircle2").$$render(
    $$result,
    {
      class: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
    },
    {},
    {}
  )} <span data-svelte-h="svelte-1oveqqi">Escudos dos times com carregamento assíncrono e fallback dinâmico em SVG.</span></div></div></div></main>  <footer class="border-t border-slate-800 py-6 text-center text-xs text-slate-500" data-svelte-h="svelte-19nj624"><p>TCC Fundação Getulio Vargas (FGV) - Modelo de Otimização Logística do Futebol Brasileiro</p></footer></div>`;
});
export {
  Page as default
};
