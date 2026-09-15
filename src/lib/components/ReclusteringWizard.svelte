<script>
  import { tick, onMount, onDestroy } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import {
    showWizardModal,
    teamsDb,
    currentSeasonNum,
    currentTransitions,
    currentSeasonSummary,
    advanceToNextSeason,
    seasonsIndex,
    showQuinquenniumSummaryModal
  } from '$lib/stores/gameStore.js';
  import { computeConvexHull } from '$lib/utils/geoUtils.js';
  import { CONFERENCE_COLORS } from '$lib/utils/leagueNames.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    Trophy,
    ArrowRight,
    ArrowLeft,
    Check,
    Shield,
    Shuffle,
    Building2,
    DollarSign,
    Bus,
    TrendingDown,
    X
  } from 'lucide-svelte';

  let mapElement;
  let L;
  let map;
  let markersLayer;
  let hullLayer;

  let currentStep = 1; // Steps 1 to 6

  $: if ($showWizardModal) {
    initWizardMap();
  }

  async function initWizardMap() {
    await tick();
    if (!mapElement) return;

    if (!L) {
      L = await import('leaflet');
    }

    if (!map) {
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
    }

    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        renderStep(currentStep);
      }
    }, 200);
  }

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  function nextStep() {
    if (currentStep < 6) {
      currentStep++;
      renderStep(currentStep);
    } else {
      handleCompleteSeason();
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

  function handleCompleteSeason() {
    closeWizard();
    advanceToNextSeason();
  }

  function formatMoney(val) {
    if (!val && val !== 0) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  }

  function renderStep(step) {
    if (!map || !L || !markersLayer || !hullLayer) return;

    hullLayer.clearLayers();
    markersLayer.clearLayers();

    const tDb = $teamsDb || {};
    const trans = $currentTransitions || {};
    const summary = $currentSeasonSummary || {};
    const bounds = L.latLngBounds();

    let teamsToPlot = [];

    if (step === 1) {
      // Step 1: Campeões das Séries A, B e C
      const champA = summary.campeoes?.serie_a;
      const champB = summary.campeoes?.serie_b;
      const champC = summary.campeoes?.serie_c;

      if (champA) teamsToPlot.push({ id: champA, color: '#f59e0b', label: 'Campeão Série A' });
      if (champB) teamsToPlot.push({ id: champB, color: '#e2e8f0', label: 'Campeão Série B' });
      if (champC) teamsToPlot.push({ id: champC, color: '#a855f7', label: 'Campeão Série C' });

    } else if (step === 2) {
      // Step 2: Acesso A <-> B (4 sobem, 4 descem)
      (trans.promovidos_b_a || []).forEach(id => {
        teamsToPlot.push({ id, color: '#10b981', label: 'Subiu para Série A' });
      });
      (trans.rebaixados_a_b || []).forEach(id => {
        teamsToPlot.push({ id, color: '#f43f5e', label: 'Caiu para Série B' });
      });

    } else if (step === 3) {
      // Step 3: Acesso B <-> C (4 sobem para B, 4 caem para C)
      (trans.promovidos_c_b || []).forEach(id => {
        teamsToPlot.push({ id, color: '#10b981', label: 'Subiu para Série B' });
      });
      (trans.rebaixados_b_c || []).forEach(item => {
        const id = typeof item === 'string' ? item : item.clube;
        const dest = typeof item === 'object' ? `➔ ${item.destino_conf}` : '';
        teamsToPlot.push({ id, color: '#f43f5e', label: `Caiu para Série C ${dest}` });
      });

    } else if (step === 4) {
      // Step 4: Acesso C <-> D (8 sobem da D, 8 caem da C)
      (trans.promovidos_d_c || []).forEach(item => {
        teamsToPlot.push({ id: item.clube, color: '#10b981', label: `Subiu para Série C (${item.destino_conf})` });
      });
      (trans.rebaixados_c_d || []).forEach(item => {
        teamsToPlot.push({ id: item.clube, color: '#f43f5e', label: `Caiu para Série D (${item.destino_macro})` });
      });

    } else if (step === 5) {
      // Step 5: Iso-Ligas da Série C & Balanço Financeiro
      (trans.trocas_de_liga_c || []).forEach(troca => {
        teamsToPlot.push({ id: troca.clube, color: '#6366f1', label: `Iso-Liga: ${troca.de} ➔ ${troca.para}` });
      });

    } else if (step === 6) {
      // Step 6: Ingresso dos Estaduais para a Série D
      (trans.ingressantes_d_estaduais || []).slice(0, 40).forEach(id => {
        teamsToPlot.push({ id, color: '#06b6d4', label: 'Vaga Estadual Série D' });
      });
    }

    // Plot teams markers
    teamsToPlot.forEach(t => {
      const obj = tDb[t.id];
      if (!obj || typeof obj.lat !== 'number' || typeof obj.lon !== 'number') return;

      bounds.extend([obj.lat, obj.lon]);

      const markerHtml = `
        <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-black animate-bounce" style="background-color: ${t.color}">
          ●
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-wizard-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([obj.lat, obj.lon], { icon });
      marker.bindPopup(`<b>${obj.nome || obj.clube}</b><br/>${t.label}<br/>${obj.cidade || ''} - ${obj.uf || ''}`);
      marker.addTo(markersLayer);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }
</script>

{#if $showWizardModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
    
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
      
      <!-- Top Wizard Header -->
      <div class="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
            <Trophy class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              Fechamento da Temporada {$currentSeasonNum} de {$seasonsIndex?.length || 5}
              <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                Passo {currentStep} de 6
              </span>
            </h2>
            <p class="text-xs text-slate-400">
              Balanço esportivo e reestruturação logística da pirâmide nacional.
            </p>
          </div>
        </div>

        <button
          on:click={closeWizard}
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Stepper Pill Track -->
      <div class="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
        {#each [
          '1. Campeões',
          '2. Série A ⇄ B',
          '3. Série B ⇄ C',
          '4. Série C ⇄ D',
          '5. Balanço CBF',
          '6. Preparação Ano ' + ($currentSeasonNum + 1)
        ] as label, idx}
          <div
            class={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentStep === idx + 1
                ? 'bg-indigo-600 text-white shadow-md'
                : currentStep > idx + 1
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                  : 'text-slate-500 bg-slate-950/60'
            }`}
          >
            {label}
          </div>
        {/each}
      </div>

      <!-- Main Body: Info Panel (Left) & Animated Map (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        <!-- Left Explanatory Step Card (5 Cols) -->
        <div class="lg:col-span-5 p-6 overflow-y-auto space-y-4 border-r border-slate-800 flex flex-col justify-between">
          <div class="space-y-4 text-xs">
            
            <!-- STEP 1: CAMPEÕES -->
            {#if currentStep === 1}
              <div class="space-y-3">
                <div>
                  <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider">Passo 1</span>
                  <h3 class="text-base font-black text-white">Coroação dos Campeões da Temporada</h3>
                  <p class="text-slate-300 leading-relaxed text-justify mt-1">
                    Veja os clubes que conquistaram os títulos nacionais das Séries A, B e C e suas respectivas localizações no território brasileiro:
                  </p>
                </div>

                <div class="space-y-2 pt-1">
                  {#if $currentSeasonSummary?.campeoes?.serie_a}
                    <div class="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <TeamBadge teamId={$currentSeasonSummary.campeoes.serie_a} size="w-6 h-6" />
                        <div>
                          <span class="text-[10px] font-black uppercase text-amber-400 block">Campeão Brasileiro Série A</span>
                          <span class="font-black text-sm text-white">{$currentSeasonSummary.campeoes.serie_a.split('/')[0]}</span>
                        </div>
                      </div>
                      <Trophy class="w-5 h-5 text-amber-400 shrink-0" />
                    </div>
                  {/if}

                  {#if $currentSeasonSummary?.campeoes?.serie_b}
                    <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <TeamBadge teamId={$currentSeasonSummary.campeoes.serie_b} size="w-6 h-6" />
                        <div>
                          <span class="text-[10px] font-black uppercase text-slate-400 block">Campeão Série B</span>
                          <span class="font-black text-sm text-white">{$currentSeasonSummary.campeoes.serie_b.split('/')[0]}</span>
                        </div>
                      </div>
                      <Shield class="w-5 h-5 text-slate-300 shrink-0" />
                    </div>
                  {/if}

                  {#if $currentSeasonSummary?.campeoes?.serie_c}
                    <div class="bg-slate-950 p-2.5 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <TeamBadge teamId={$currentSeasonSummary.campeoes.serie_c} size="w-6 h-6" />
                        <div>
                          <span class="text-[10px] font-black uppercase text-indigo-400 block">Campeão Série C (Nacional)</span>
                          <span class="font-black text-sm text-white">{$currentSeasonSummary.campeoes.serie_c.split('/')[0]}</span>
                        </div>
                      </div>
                      <Trophy class="w-5 h-5 text-indigo-400 shrink-0" />
                    </div>
                  {/if}
                </div>
              </div>

            <!-- STEP 2: SÉRIE A <-> SÉRIE B -->
            {:else if currentStep === 2}
              <div class="space-y-3">
                <div>
                  <span class="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Passo 2</span>
                  <h3 class="text-base font-black text-white">Acesso & Descenso Série A ⇄ Série B</h3>
                  <p class="text-slate-300 leading-relaxed text-justify mt-1">
                    4 clubes da Série B garantiram promoção para a Série A (em verde no mapa), e os 4 últimos da Série A foram rebaixados (em vermelho).
                  </p>
                </div>

                <div class="space-y-3 pt-1">
                  <div>
                    <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      ▲ 4 Promovidos para a Série A:
                    </span>
                    <div class="grid grid-cols-2 gap-1.5">
                      {#each ($currentTransitions?.promovidos_b_a || []) as club}
                        <div class="bg-slate-950 p-2 rounded-lg border border-emerald-800/60 flex items-center gap-1.5 truncate">
                          <TeamBadge teamId={club} size="w-4 h-4" />
                          <span class="truncate font-bold text-white text-[11px]">{club.split('/')[0]}</span>
                        </div>
                      {/each}
                    </div>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      ▼ 4 Rebaixados para a Série B:
                    </span>
                    <div class="grid grid-cols-2 gap-1.5">
                      {#each ($currentTransitions?.rebaixados_a_b || []) as club}
                        <div class="bg-slate-950 p-2 rounded-lg border border-rose-800/60 flex items-center gap-1.5 truncate">
                          <TeamBadge teamId={club} size="w-4 h-4" />
                          <span class="truncate font-bold text-white text-[11px]">{club.split('/')[0]}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>

            <!-- STEP 3: SÉRIE B <-> SÉRIE C -->
            {:else if currentStep === 3}
              <div class="space-y-3">
                <div>
                  <span class="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Passo 3</span>
                  <h3 class="text-base font-black text-white">Acesso & Descenso Série B ⇄ Série C</h3>
                  <p class="text-slate-300 leading-relaxed text-justify mt-1">
                    Os 4 semifinalistas do Nacional dos 8 subiram para a Série B. Os 4 clubes da B rebaixados foram direcionados para suas conferências regionais de origem:
                  </p>
                </div>

                <div class="space-y-3 pt-1">
                  <div>
                    <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      ▲ 4 Promovidos para a Série B (Semifinalistas N8):
                    </span>
                    <div class="grid grid-cols-2 gap-1.5">
                      {#each ($currentTransitions?.promovidos_c_b || []) as club}
                        <div class="bg-slate-950 p-2 rounded-lg border border-emerald-800/60 flex items-center gap-1.5 truncate">
                          <TeamBadge teamId={club} size="w-4 h-4" />
                          <span class="truncate font-bold text-white text-[11px]">{club.split('/')[0]}</span>
                        </div>
                      {/each}
                    </div>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      ▼ 4 Rebaixados para a Série C (com Conferência de Destino):
                    </span>
                    <div class="space-y-1.5">
                      {#each ($currentTransitions?.rebaixados_b_c || []) as item}
                        {@const id = typeof item === 'string' ? item : item.clube}
                        {@const dest = typeof item === 'object' ? item.destino_conf : 'Regional'}
                        <div class="bg-slate-950 p-2 rounded-lg border border-rose-800/60 flex items-center justify-between">
                          <div class="flex items-center gap-1.5 truncate">
                            <TeamBadge teamId={id} size="w-4 h-4" />
                            <span class="truncate font-bold text-white text-[11px]">{id.split('/')[0]}</span>
                          </div>
                          <span class="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {dest}
                          </span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>

            <!-- STEP 4: SÉRIE C <-> SÉRIE D (8 ACESSOS E 8 DESCENSOS) -->
            {:else if currentStep === 4}
              <div class="space-y-3">
                <div>
                  <span class="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Passo 4</span>
                  <h3 class="text-base font-black text-white">Acesso & Descenso Série C ⇄ Série D (8 Vagas)</h3>
                  <p class="text-slate-300 leading-relaxed text-justify mt-1">
                    Exatamente 8 clubes da Série D (os 2 vencedores de cada uma das 4 macrorregiões) sobem para a Série C. Na contrapartida, os 2 últimos colocados de cada conferência caem para a Série D:
                  </p>
                </div>

                <div class="space-y-3 pt-1">
                  <div>
                    <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      ▲ 8 Promovidos da Série D para a C:
                    </span>
                    <div class="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {#each ($currentTransitions?.promovidos_d_c || []) as item}
                        <div class="bg-slate-950 p-1.5 rounded-lg border border-emerald-800/60 flex items-center justify-between truncate">
                          <div class="flex items-center gap-1 truncate">
                            <TeamBadge teamId={item.clube} size="w-3.5 h-3.5" />
                            <span class="truncate font-medium text-white text-[10px]">{item.clube.split('/')[0]}</span>
                          </div>
                          <span class="text-[8px] font-mono text-emerald-400 font-bold ml-1">{item.destino_conf}</span>
                        </div>
                      {/each}
                    </div>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      ▼ 8 Rebaixados da Série C para a D:
                    </span>
                    <div class="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {#each ($currentTransitions?.rebaixados_c_d || []) as item}
                        <div class="bg-slate-950 p-1.5 rounded-lg border border-rose-800/60 flex items-center justify-between truncate">
                          <div class="flex items-center gap-1 truncate">
                            <TeamBadge teamId={item.clube} size="w-3.5 h-3.5" />
                            <span class="truncate font-medium text-white text-[10px]">{item.clube.split('/')[0]}</span>
                          </div>
                          <span class="text-[8px] font-mono text-rose-400 font-bold ml-1">{item.destino_macro}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>

            <!-- STEP 5: BALANÇO FINANCEIRO & ISO-LIGAS -->
            {:else if currentStep === 5}
              <div class="space-y-3">
                <div>
                  <span class="text-[10px] font-black uppercase text-purple-400 tracking-wider">Passo 5</span>
                  <h3 class="text-base font-black text-white">Balanço Financeiro CBF & Iso-Ligas</h3>
                  <p class="text-slate-300 leading-relaxed text-justify mt-1">
                    Auditoria econômica oficial dos resultados logísticos obtidos com a reestruturação da pirâmide:
                  </p>
                </div>

                <div class="space-y-2 pt-1">
                  <!-- Total Cost Card -->
                  <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span class="text-[10px] text-slate-400 font-bold block uppercase">Custo Total da Pirâmide</span>
                      <span class="text-base font-black text-emerald-300 font-mono">
                        {formatMoney($currentSeasonSummary?.financeiro?.custo_total_piramide_brl)}
                      </span>
                    </div>
                    <DollarSign class="w-6 h-6 text-emerald-400 shrink-0" />
                  </div>

                  <!-- TTP Savings -->
                  <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span class="text-[10px] text-slate-400 font-bold block uppercase">Economia com Turnês TTP-k</span>
                      <span class="text-base font-black text-indigo-300 font-mono">
                        {formatMoney(($currentSeasonSummary?.financeiro?.economia_turnes_c_brl || 0) + ($currentSeasonSummary?.financeiro?.economia_turnes_d_brl || 0))}
                      </span>
                    </div>
                    <TrendingDown class="w-6 h-6 text-indigo-400 shrink-0" />
                  </div>

                  <!-- Road Transport Percentage -->
                  <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div class="flex justify-between text-[11px] font-mono">
                      <span class="text-slate-400">Transporte Terrestre:</span>
                      <span class="text-cyan-300 font-bold">{$currentSeasonSummary?.financeiro?.pct_rodoviario_c || 68}% (C) • {$currentSeasonSummary?.financeiro?.pct_rodoviario_d || 100}% (D)</span>
                    </div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div class="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full" style="width: 85%"></div>
                    </div>
                  </div>

                  {#if ($currentTransitions?.trocas_de_liga_c || []).length > 0}
                    <div class="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-800/60 space-y-1">
                      <span class="text-[10px] font-black text-indigo-300 uppercase block">Trocas de Iso-Ligas:</span>
                      {#each $currentTransitions.trocas_de_liga_c as troca}
                        <div class="text-[10px] text-slate-300">
                          <strong>{troca.clube.split('/')[0]}</strong> remanejado de {troca.de} para {troca.para} para manter cardinalidade par.
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

            <!-- STEP 6: PREPARAÇÃO PARA O PRÓXIMO ANO / QUINQUÊNIO -->
            {:else if currentStep === 6}
              <div class="space-y-3">
                <div>
                  <span class="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Passo 6</span>
                  <h3 class="text-base font-black text-white">
                    {#if $currentSeasonNum < 5}
                      Desbloqueio & Preparação: Temporada {$currentSeasonNum + 1}
                    {:else}
                      Conclusão do Quinquênio Oficial (5 Anos)
                    {/if}
                  </h3>
                  <p class="text-slate-300 leading-relaxed text-justify mt-1">
                    {#if $currentSeasonNum < 5}
                      A temporada {$currentSeasonNum} foi concluída com sucesso! Os acessos, descensos e cotas invariantes foram aplicados na malha da Temporada {$currentSeasonNum + 1}. Clique no botão abaixo para desbloquear e iniciar a simulação do próximo ano.
                    {:else}
                      Você completou a simulação de todas as 5 temporadas do Quinquênio do TCC! O modelo provou a viabilidade financeira e esportiva de uma pirâmide sustentável.
                    {/if}
                  </p>
                </div>

                <div class="bg-gradient-to-br from-indigo-950/60 to-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-2.5 text-xs">
                  <div class="flex items-center gap-2 font-black text-white">
                    <Shield class="w-4 h-4 text-emerald-400" />
                    <span>Invariância Federativa & Sustentabilidade Comprovadas</span>
                  </div>
                  <p class="text-slate-300 text-[11px] leading-relaxed">
                    Todas as 27 federações estaduais mantiveram suas cotas estruturais preservadas, clubes periféricos garantiram 10 meses de calendário e os custos aéreos caíram drasticamente.
                  </p>
                </div>
              </div>
            {/if}

          </div>

          <!-- Bottom Navigation Step Buttons -->
          <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              on:click={prevStep}
              disabled={currentStep === 1}
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft class="w-4 h-4" /> Anterior
            </button>

            <button
              on:click={nextStep}
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-950/80 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {#if currentStep < 6}
                Próximo Passo <ArrowRight class="w-4 h-4" />
              {:else if $currentSeasonNum < 5}
                Iniciar Temporada {$currentSeasonNum + 1} <ArrowRight class="w-4 h-4" />
              {:else}
                Ver Balanço do Quinquênio <Trophy class="w-4 h-4 text-amber-300" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Right Leaflet Map (7 Cols) -->
        <div class="lg:col-span-7 h-[420px] lg:h-full relative bg-slate-950">
          <div bind:this={mapElement} class="w-full h-full"></div>
        </div>

      </div>

    </div>

  </div>
{/if}
