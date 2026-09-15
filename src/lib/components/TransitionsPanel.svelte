<script>
  import {
    currentTransitions,
    currentSeasonNum
  } from '$lib/stores/gameStore.js';
  import TeamBadge from './TeamBadge.svelte';
  import {
    ArrowUpCircle,
    ArrowDownCircle,
    Shuffle,
    Trophy,
    Shield,
    ArrowRight,
    Building2
  } from 'lucide-svelte';
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
  
  <!-- Title -->
  <div class="space-y-1 border-b border-slate-800/80 pb-4">
    <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
      <Shuffle class="w-3.5 h-3.5 text-indigo-400" />
      Mercado & Transições da Temporada {$currentSeasonNum}
    </div>
    <h3 class="text-xl font-black text-white tracking-tight">
      Movimentações da Pirâmide & Rebalanceamento de Iso-Ligas
    </h3>
    <p class="text-xs text-slate-400 max-w-3xl leading-relaxed">
      Acompanhe quem conquistou acesso, quem sofreu rebaixamento e os ajustes de Iso-Ligas acionados para preservar o equilíbrio de 14 a 18 clubes nas conferências da Série C.
    </p>
  </div>

  {#if !$currentTransitions}
    <div class="p-8 text-center text-slate-400">
      Dados de transições indisponíveis para esta temporada.
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Coluna 1: Acesso e Descenso Série A <-> Série B -->
      <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="font-black text-xs text-white uppercase tracking-wider">Série A ⇄ Série B</span>
          <span class="text-[10px] font-bold text-slate-400">4 Vagas Nacionais</span>
        </div>

        <!-- Promovidos B -> A -->
        <div class="space-y-2">
          <span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <ArrowUpCircle class="w-3.5 h-3.5 text-emerald-400" /> Subiram para a Série A:
          </span>
          <div class="space-y-1.5">
            {#each ($currentTransitions.promovidos_b_a || []) as id}
              <div class="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-white">
                <TeamBadge teamId={id} size="w-5 h-5" />
                <span class="font-bold truncate">{id.split('/')[0]}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Rebaixados A -> B -->
        <div class="space-y-2 pt-2 border-t border-slate-800/60">
          <span class="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <ArrowDownCircle class="w-3.5 h-3.5 text-rose-400" /> Rebaixados para a Série B:
          </span>
          <div class="space-y-1.5">
            {#each ($currentTransitions.rebaixados_a_b || []) as id}
              <div class="flex items-center gap-2 p-1.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-white">
                <TeamBadge teamId={id} size="w-5 h-5" />
                <span class="font-bold truncate">{id.split('/')[0]}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Coluna 2: Acesso e Descenso Série B <-> Série C -->
      <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="font-black text-xs text-white uppercase tracking-wider">Série B ⇄ Série C</span>
          <span class="text-[10px] font-bold text-slate-400">4 Semifinalistas N8</span>
        </div>

        <!-- Promovidos C -> B -->
        <div class="space-y-2">
          <span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <ArrowUpCircle class="w-3.5 h-3.5 text-emerald-400" /> Subiram para a Série B:
          </span>
          <div class="space-y-1.5">
            {#each ($currentTransitions.promovidos_c_b || []) as id}
              <div class="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-white">
                <TeamBadge teamId={id} size="w-5 h-5" />
                <span class="font-bold truncate">{id.split('/')[0]}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Rebaixados B -> C -->
        <div class="space-y-2 pt-2 border-t border-slate-800/60">
          <span class="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <ArrowDownCircle class="w-3.5 h-3.5 text-rose-400" /> Rebaixados para a Série C:
          </span>
          <div class="space-y-1.5">
            {#each ($currentTransitions.rebaixados_b_c || []) as item}
              {@const id = typeof item === 'string' ? item : item.clube}
              {@const dest = item.destino_conf || ''}
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-white">
                <div class="flex items-center gap-2 truncate">
                  <TeamBadge teamId={id} size="w-5 h-5" />
                  <span class="font-bold truncate">{id.split('/')[0]}</span>
                </div>
                {#if dest}
                  <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                    ➔ {dest}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Coluna 3: Acesso e Descenso Série C <-> Série D -->
      <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="font-black text-xs text-white uppercase tracking-wider">Série C ⇄ Série D</span>
          <span class="text-[10px] font-bold text-emerald-400">8 Acessos Regionais</span>
        </div>

        <!-- Promovidos D -> C (8 semifinalistas da D) -->
        <div class="space-y-2">
          <span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <ArrowUpCircle class="w-3.5 h-3.5 text-emerald-400" /> Subiram da D para a C (8):
          </span>
          <div class="space-y-1 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
            {#each ($currentTransitions.promovidos_d_c || []) as p}
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div class="flex items-center gap-1.5 truncate">
                  <TeamBadge teamId={p.clube} size="w-4 h-4" />
                  <span class="font-bold text-white truncate text-[11px]">{p.clube.split('/')[0]}</span>
                </div>
                <span class="text-[9px] font-mono text-emerald-400 shrink-0 font-bold">➔ {p.destino_conf}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Rebaixados C -> D (8 da C) -->
        <div class="space-y-2 pt-2 border-t border-slate-800/60">
          <span class="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <ArrowDownCircle class="w-3.5 h-3.5 text-rose-400" /> Rebaixados da C para a D (8):
          </span>
          <div class="space-y-1 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
            {#each ($currentTransitions.rebaixados_c_d || []) as r}
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div class="flex items-center gap-1.5 truncate">
                  <TeamBadge teamId={r.clube} size="w-4 h-4" />
                  <span class="font-bold text-white truncate text-[11px]">{r.clube.split('/')[0]}</span>
                </div>
                <span class="text-[9px] font-mono text-rose-400 shrink-0 font-bold">➔ {r.destino_macro}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

    </div>

    <!-- Seção de Iso-Ligas & Estaduais -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
      
      <!-- Iso-Ligas (Rebalanceamento de Conferências) -->
      <div class="bg-slate-950/70 border border-indigo-900/40 rounded-xl p-4 space-y-3">
        <div class="flex items-center gap-2">
          <Shuffle class="w-4 h-4 text-indigo-400" />
          <h4 class="font-black text-xs text-white uppercase tracking-wider">
            Rebalanceamento Geográfico por Iso-Ligas (Série C)
          </h4>
        </div>

        {#if $currentTransitions.trocas_de_liga_c && $currentTransitions.trocas_de_liga_c.length > 0}
          <div class="space-y-2">
            {#each $currentTransitions.trocas_de_liga_c as troca}
              <div class="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-700/50 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <TeamBadge teamId={troca.clube} size="w-5 h-5" />
                  <span class="font-bold text-white">{troca.clube.split('/')[0]}</span>
                </div>
                <div class="flex items-center gap-2 font-mono text-[11px]">
                  <span class="text-rose-300">{troca.de}</span>
                  <ArrowRight class="w-3 h-3 text-slate-400" />
                  <span class="text-emerald-300 font-bold">{troca.para}</span>
                </div>
              </div>
              {#if troca.motivo}
                <p class="text-[10px] text-slate-400 italic px-1">{troca.motivo}</p>
              {/if}
            {/each}
          </div>
        {:else}
          <p class="text-xs text-slate-400 italic p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            Nenhuma troca de conferência foi necessária nesta temporada. A distribuição geográfica dos 60 clubes permaneceu perfeitamente balanceada dentro da faixa estrita de 14 a 18 equipes por conferência.
          </p>
        {/if}
      </div>

      <!-- Ingressantes dos Campeonatos Estaduais -->
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Building2 class="w-4 h-4 text-emerald-400" />
            <h4 class="font-black text-xs text-white uppercase tracking-wider">
              Ingressantes dos Campeonatos Estaduais na Série D
            </h4>
          </div>
          <span class="text-xs font-mono font-bold text-emerald-400">
            {$currentTransitions.ingressantes_d_estaduais?.length || 136} Clubes
          </span>
        </div>

        <p class="text-xs text-slate-400 leading-relaxed">
          136 clubes de todas as 27 Unidades Federativas conquistaram vaga na Série D via mérito técnico nos seus respectivos Campeonatos Estaduais e Copas Regionais, garantindo calendário e sustentabilidade ao longo de todo o ano.
        </p>
      </div>

    </div>
  {/if}

</div>
