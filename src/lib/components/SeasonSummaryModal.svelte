<script>
  import { showSeasonModal, showWizardModal, lastTransitionSummary, currentSeason } from '$lib/stores/gameStore.js';
  import { getMacroName, getMicroName } from '$lib/utils/leagueNames.js';
  import TeamBadge from './TeamBadge.svelte';
  import { Trophy, ArrowUpRight, ArrowDownRight, Sparkles, Shield, Layers, Play } from 'lucide-svelte';

  function confirmAndOpenWizard() {
    showSeasonModal.set(false);
    showWizardModal.set(true);
  }

  function closeModal() {
    showSeasonModal.set(false);
  }

  $: summary = $lastTransitionSummary;
</script>

{#if $showSeasonModal && summary}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-lg overflow-y-auto animate-in fade-in duration-300">
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
      
      <!-- Modal Header -->
      <div class="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Trophy class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-white flex items-center gap-2">
              Resumo da Transição de Temporada
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Fim do Ano {summary.seasonEnded}
              </span>
            </h2>
            <p class="text-xs text-slate-400">Acessos, Rebaixamentos e Re-clusterização Regional para a Temporada { $currentSeason }</p>
          </div>
        </div>

        <button
          on:click={closeModal}
          class="text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
        >
          Fechar ✕
        </button>
      </div>

      <!-- Modal Body (Scrollable Grid) -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
        
        <!-- Grid 1: Série A & Série B -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Card 1: Série A -->
          <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 class="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                <Shield class="w-4 h-4" /> Série A
              </h3>
              <span class="text-[10px] uppercase font-bold text-rose-400">4 Rebaixados</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1 mb-2">
                <ArrowDownRight class="w-3.5 h-3.5" /> Caem para a Série B
              </span>
              <div class="grid grid-cols-2 gap-2">
                {#each summary.relegatedFromA as team}
                  <div class="bg-slate-900 border border-rose-950/50 rounded-lg p-2 flex items-center gap-2">
                    <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-6 h-6" />
                    <div class="truncate">
                      <span class="font-bold text-white text-xs truncate block">{team.name}</span>
                      <span class="text-[9px] text-slate-500 uppercase">{team.state}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Card 2: Série B -->
          <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 class="font-extrabold text-cyan-400 text-sm flex items-center gap-2">
                <Shield class="w-4 h-4" /> Série B
              </h3>
              <span class="text-[10px] uppercase font-bold text-slate-400">4 Sobem / 4 Caem</span>
            </div>
            
            <div class="space-y-3">
              <!-- Promoted to A -->
              <div>
                <span class="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 mb-1.5">
                  <ArrowUpRight class="w-3.5 h-3.5" /> Sobem para a Série A
                </span>
                <div class="grid grid-cols-2 gap-2">
                  {#each summary.promotedFromB as team}
                    <div class="bg-slate-900 border border-emerald-950/50 rounded-lg p-2 flex items-center gap-2">
                      <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-6 h-6" />
                      <div class="truncate">
                        <span class="font-bold text-white text-xs truncate block">{team.name}</span>
                        <span class="text-[9px] text-slate-500 uppercase">{team.state}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Relegated to C -->
              <div>
                <span class="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1 mb-1.5">
                  <ArrowDownRight class="w-3.5 h-3.5" /> Caem para a Série C
                </span>
                <div class="grid grid-cols-2 gap-2">
                  {#each summary.relegatedFromB as team}
                    <div class="bg-slate-900 border border-rose-950/50 rounded-lg p-2 flex items-center gap-2">
                      <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-6 h-6" />
                      <div class="truncate">
                        <span class="font-bold text-white text-xs truncate block">{team.name}</span>
                        <span class="text-[9px] text-slate-500 uppercase">{team.state}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Série C -->
        <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="font-extrabold text-amber-400 text-sm flex items-center gap-2">
              <Layers class="w-4 h-4" /> Série C
            </h3>
            <span class="text-[10px] uppercase font-bold text-amber-300">4 Campeões Sobem / 12 Caem</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Promoted to B (4 Macro Champions) -->
            <div>
              <span class="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 mb-2">
                <ArrowUpRight class="w-3.5 h-3.5" /> Campeões Macrorregionais (Sobem p/ Série B)
              </span>
              <div class="space-y-2">
                {#each summary.promotedFromC as team}
                  <div class="bg-slate-900 border border-emerald-900/40 rounded-lg p-2 flex items-center justify-between">
                    <div class="flex items-center gap-2 truncate">
                      <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-6 h-6" />
                      <span class="font-bold text-white text-xs truncate">{team.name} ({team.state})</span>
                    </div>
                    <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                      { getMacroName(team.regionKey) }
                    </span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Relegated to D (12 teams) -->
            <div>
              <span class="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1 mb-2">
                <ArrowDownRight class="w-3.5 h-3.5" /> Rebaixados para a Série D (12 Times)
              </span>
              <div class="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                {#each summary.relegatedFromC as team}
                  <div class="bg-slate-900 border border-rose-950/50 rounded-lg p-1.5 flex items-center gap-2">
                    <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-5 h-5" />
                    <div class="truncate">
                      <span class="font-bold text-white text-[11px] truncate block">{team.name}</span>
                      <span class="text-[8px] text-slate-400">{ getMacroName(team.regionKey) }</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Card 4: Série D -->
        <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="font-extrabold text-purple-400 text-sm flex items-center gap-2">
              <Layers class="w-4 h-4" /> Série D
            </h3>
            <span class="text-[10px] uppercase font-bold text-purple-300">12 Campeões Sobem p/ C / 36 Caem p/ Amador</span>
          </div>

          <div class="space-y-4">
            <!-- 12 Promoted to C -->
            <div>
              <span class="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 mb-2">
                <ArrowUpRight class="w-3.5 h-3.5" /> 12 Campeões Microrregionais (Sobem p/ Série C)
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {#each summary.promotedFromD as team}
                  <div class="bg-slate-900 border border-emerald-900/40 rounded-lg p-1.5 flex items-center gap-2">
                    <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-5 h-5" />
                    <div class="truncate">
                      <span class="font-bold text-white text-[11px] truncate block">{team.name}</span>
                      <span class="text-[8px] text-emerald-400 font-semibold">{ getMicroName(team.regionKey) }</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- 36 Relegated to Amateur -->
            <div>
              <span class="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1 mb-2">
                <ArrowDownRight class="w-3.5 h-3.5" /> 36 Rebaixados para o Futebol Amador
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                {#each summary.relegatedFromD as team}
                  <div class="bg-slate-900/80 border border-slate-800 rounded p-1 flex items-center gap-1.5">
                    <TeamBadge teamId={team.teamId} name={team.name} state={team.state} size="w-4 h-4" />
                    <div class="truncate">
                      <span class="font-medium text-slate-300 text-[10px] truncate block">{team.name}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer Action -->
      <div class="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
        <div class="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-amber-400" />
          <span>Veja a Re-clusterização em tempo real pelo Algoritmo Húngaro.</span>
        </div>

        <button
          on:click={confirmAndOpenWizard}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Play class="w-4 h-4 fill-current" />
          Ver Mapa Didático de Re-clusterização (Algoritmo Húngaro)
        </button>
      </div>

    </div>
  </div>
{/if}
