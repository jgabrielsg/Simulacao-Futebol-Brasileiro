<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import {
    BookOpen, GraduationCap, Calendar, User, ExternalLink, Github,
    Compass, ArrowUpRight
  } from 'lucide-svelte';

  const tocItems = [
    { id: 'hero', label: '1. Visão Geral & Credenciais' },
    { id: 'problema', label: '2. O Paradoxo Continental' },
    { id: 'fontes', label: '3. Estratégia e Fontes de Dados' },
    { id: 'matematica', label: '4. A Metodologia Matemática' },
    { id: 'repositorios', label: '5. Repositórios Oficiais' }
  ];

  let activeSection = 'hero';

  function scrollToSection(id) {
    activeSection = id;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
</script>

<div style="text-align: justify;" class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950">
  <Navbar />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="flex flex-col lg:flex-row gap-12 items-start relative">
      
      <!-- STICKY SIDEBAR TABLE OF CONTENTS (MINIMALIST MONOCHROME) -->
      <aside class="hidden lg:block w-64 shrink-0 sticky top-24 self-start bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md">
        <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-3 mb-3">
          <BookOpen class="w-4 h-4" />
          Sumário do Artigo
        </div>
        <nav class="space-y-1 text-xs font-medium">
          {#each tocItems as item}
            <button
              on:click={() => scrollToSection(item.id)}
              class={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                activeSection === item.id
                  ? 'bg-indigo-950/60 text-indigo-300 font-extrabold border border-indigo-800/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span class="truncate">{item.label}</span>
            </button>
          {/each}
        </nav>

        <div class="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
          <p class="font-semibold text-slate-400">FGV EMAp — TCC 2026</p>
          <p>Licença Acadêmica: MIT</p>
        </div>
      </aside>

      <!-- EDITORIAL CONTENT (MEDIUM / NOTION SCIENTIFIC STYLE) -->
      <article class="flex-1 max-w-3xl space-y-12 leading-relaxed text-slate-300 text-sm sm:text-base">
        
        <!-- SECTION 1: HERO & CREDENTIALS -->
        <section id="hero" class="space-y-6 scroll-mt-24">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase">
            <GraduationCap class="w-4 h-4" />
            Trabalho Acadêmico - TCC
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight" style="text-align: center;">
            Resolvendo o Paradoxo Continental do Futebol Brasileiro
          </h1>

          <p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed text-justify">
            Uma abordagem integrada de Ciência de Dados, Teoria dos Grafos e Pesquisa Operacional para reestruturar a pirâmide do futebol brasileiro e eliminar a asfixia financeira dos clubes fora da elite.
          </p>

          <!-- Author & Academic Credentials -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs" style="margin-bottom: 40px;">
            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <User class="w-3.5 h-3.5 text-indigo-400" /> Autor do Trabalho
              </span>
              <p class="font-bold text-white">João Gabriel Machado</p>
              <p class="text-slate-400">Arroio do Sal — RS</p>
            </div>

            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <GraduationCap class="w-3.5 h-3.5 text-indigo-400" /> Instituição
              </span>
              <p class="font-bold text-white">Fundação Getulio Vargas (FGV)</p>
              <p class="text-slate-400">EMAp (Rio de Janeiro)</p>
            </div>

            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-indigo-400" /> Formação & Ano
              </span>
              <p class="font-bold text-white">B.Sc. em Ciência de Dados e IA</p>
              <p class="text-slate-400">Ano de Conclusão: 2026</p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- SECTION 2: O PROBLEMA -->
        <section id="problema" class="space-y-4 scroll-mt-24" style="margin-bottom: 40px;">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            2. O Problema: O Paradoxo Continental e a Asfixia Financeira
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            O Brasil possui dimensões continentais, cobrindo uma área superior a 8,5 milhões de km². Na estrutura atual organizada pela Confederação Brasileira de Futebol (CBF), os custos de logística e deslocamento são proibitivos para a vasta maioria das agremiações fora da elite. Atualmente, apenas 60 clubes — aqueles integrantes das Séries A, B e C — possuem um calendário de competições estável e contínuo ao longo dos nove meses da temporada.
          </p>

          <p class="text-slate-300 leading-relaxed text-justify">
            A ausência de um calendário fixo anual asfixia financeiramente clubes tradicionais. O <strong>Santa Cruz (PE)</strong>, uma das maiores massas torcedoras do Nordeste, enfrentou graves crises financeiras e operacionais ao ficar sem divisão nacional, resultando em paralisações das atividades profissionais por vários meses no ano. Da mesma forma, entidades históricas como a <strong>Portuguesa (SP)</strong> e o <strong>Paraná Clube (PR)</strong> sofrem recorrentemente com desmanches forçados de elenco e precarização de atletas e funcionários pela falta de um calendário estável.
          </p>

          <p class="text-slate-300 leading-relaxed text-justify">
            Nas Séries C e D, o formato atual impõe deslocamentos extremos em fase de grupos ou mata-matas (como viagens do extremo Sul ao extremo Norte), gerando custos de passagem e fretamento rodoviário que frequentemente superam toda a arrecadação de bilheteria obtida pelas equipes.
          </p>
        </section>

        <hr class="border-slate-800/80" />

        <!-- SECTION 3: ESTRATÉGIA E FONTES DE DADOS -->
        <section id="fontes" class="space-y-4 scroll-mt-24" style="margin-bottom: 40px;">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            3. Estratégia e Fontes de Dados (2020-2025)
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            Para garantir o rigor técnico e a reprodutibilidade do projeto, construímos um pipeline de dados unificado, filtrando rigorosamente apenas os clubes <em>desportivamente ativos</em> — aqueles que disputaram ao menos uma partida federada oficial entre as temporadas de 2020 e 2025. A proveniência das bases de dados é dividida em três pilares fundamentais:
          </p>

          <div class="space-y-4 pt-2">
            <div class="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-2">
              <h3 class="font-bold text-indigo-300 text-sm">Competições Nacionais</h3>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Os históricos detalhados de partidas e placares das Séries A, B, C, D e Copa do Brasil foram consolidados a partir do repositório aberto de dados de futebol disponível no seguinte repositório <strong>https://github.com/BrazilianFootball/Data</strong>, pela equipe de Ciência de Dados de <strong>IgorMichels</strong> e <strong>MaxBiostat(FGV/EMAp)</strong>.
              </p>
            </div>

            <div class="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-2">
              <h3 class="font-bold text-indigo-300 text-sm">Competições Estaduais e Regionais (Web Scraping)</h3>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Diante da ausência de bases públicas estruturadas para as divisões inferiores, desenvolvemos raspadores automatizados via <strong>Selenium</strong> para o portal <em>oGol</em>. O levantamento capturou partidas, datas e placares da 1ª à 5ª divisão do Campeonato Paulista, 3ª divisão de Goiás, além de todas as federações estaduais e copas regionais (Copa Verde e Copa do Nordeste) ao longo de seis anos.
              </p>
            </div>

            <div class="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-2">
              <h3 class="font-bold text-indigo-300 text-sm">Malha Logística e Geoprocessamento</h3>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                As coordenadas de latitude e longitude das cidades dos clubes oram recuperadas de forma automatizada via <strong>API do Wikidata</strong>, com curadoria e correção manual para equipes de menor expressão nacional. As matrizes de conectividade rodoviária e tempo de deslocamento foram fundamentadas na pesquisa <strong>REGIC 2018 (IBGE)</strong>, enquanto a localização e os modais dos hubs aeroportuários basearam-se nos dados públicos da <strong>ANAC (Agência Nacional de Aviação Civil)</strong> e Wikipédia.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- SECTION 4: A METODOLOGIA MATEMÁTICA -->
        <section id="matematica" class="space-y-6 scroll-mt-24" style="margin-bottom: 40px;">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            4. A Metodologia Matemática (Os 3 Pilares)
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            A solução proposta combina Teoria dos Grafos, Pesquisa Operacional e Otimização Combinatória para reorganizar as divisões do futebol brasileiro, dividindo-se em três etapas interconectadas:
          </p>

          <!-- PILAR 1 -->
          <div class="space-y-2 pt-2">
            <h3 class="font-bold text-indigo-300 text-base">4.1. Análise Topológica via PageRank Adaptado</h3>
            <p class="text-slate-300 leading-relaxed text-justify">
              O ecossistema de partidas foi modelado como um grafo direcionado <strong>G = (V, E)</strong>, onde os vértices <strong>V</strong> correspondem aos clubes e os arcos <strong>E</strong> representam o histórico de confrontos diretos ponderados pelo resultado desportivo. O algoritmo <strong>PageRank vetorizado</strong> calcula o fluxo de prestígio e relevância de cada equipe na rede nacional. Essa métrica é utilizada, após isolarmos rigorosamente os 40 melhores clubes do país — atuais clubes das Séries A e B —, para direcionar todas as demais equipes para o modelo de regionalização, utilizando os times com maior pontuação no Pagerank para organizarmos quais seriam os times das ligas das Séries C e D propostas. 
            </p>
          </div>

          <!-- PILAR 2 -->
          <div class="space-y-2 pt-2">
            <h3 class="font-bold text-indigo-300 text-base">4.2. Clusterização Espacial via Balanced K-Means</h3>
            <p class="text-slate-300 leading-relaxed text-justify">
              Algoritmos tradicionais de agrupamento, como o K-Means clássico, falham na organização de ligas esportivas pois tendem a agrupar a imensa maioria dos clubes no Sudeste e poucos no Norte, destruindo a simetria de calendário. O projeto aplicou o algoritmo <strong>Balanced K-Means</strong>, que formula o agrupamento como um problema de Custo Mínimo em Fluxo sob restrições rígidas de capacidade mínima e máxima (S<sub>min</sub> &le; |C<sub>k</sub>| &le; S<sub>max</sub>). A otimização é feita passando todos os mais de 850 times ativos no futebol brasileiro e encontrando os 4 clusters que minimizam distância média entre os times, com, no máximo, 50% de desbalanceamento entre as classes. Após isso, impõe-se exatamente 20 equipes por macrorregião na Série C e 18 por microrregião na Série D (as de maior prestígio pelo pagerank dessas regiões), minimizando a inércia geográfica sem permitir desequilíbrios numéricos.
            </p>
          </div>

          <!-- PILAR 3 -->
          <div class="space-y-2 pt-2">
            <h3 class="font-bold text-indigo-300 text-base">4.3. Motor Logístico e Otimização Húngara (LAP)</h3>
            <p class="text-slate-300 leading-relaxed text-justify">
              O modelo adota uma matriz de distâncias Haversine ajustada por fatores de malha terrestre e estabelece o limiar de 800 km para a transição entre fretamento de ônibus e voos comerciais. Ao final de cada temporada, para acomodar as promoções e rebaixamentos entre divisões sem desmantelar os agrupamentos regionais, o sistema aplica o <strong>Algoritmo Húngaro (Problema de Atribuição Linear / LAP)</strong>. O algoritmo toma como âncora os centróides históricos das ligas e realiza a alocação perfeita dos clubes promovidos e rebaixados, garantindo a mínima distância global percorrida no novo ano.
            </p>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- SECTION 5: REPOSITÓRIOS OFICIAIS DO PROJETO -->
        <section id="repositorios" class="space-y-4 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            5. Repositórios Oficiais do Projeto
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            Todo o código-fonte, scripts de raspagem, notebooks de otimização e a aplicação web visualizadora estão disponíveis publicamente sob a licença open-source MIT nos repositórios oficiais:
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <!-- Repo 1: Python Data Engine -->
            <a
              href="https://github.com/jgabrielsg/GeoFootballGraph-BR"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Github class="w-5 h-5 text-indigo-400" />
                    <span>Motor de Dados & Algoritmos</span>
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Pipeline em Python contendo os motores de web scraping em Selenium, tratamentos geográficos, modelos NetworkX e algoritmo de clusterização Balanced K-Means.
                </p>
              </div>
              <span class="text-[11px] font-mono text-indigo-400 font-semibold group-hover:underline">
                github.com/jgabrielsg/GeoFootballGraph-BR
              </span>
            </a>

            <!-- Repo 2: SvelteKit Web Simulator -->
            <a
              href="https://github.com/jgabrielsg/Simulacao-Futebol-Brasileiro"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Github class="w-5 h-5 text-indigo-400" />
                    <span>Simulador Web (SvelteKit)</span>
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Aplicação web interativa em SvelteKit e Leaflet.js para simulação de partidas, tabelas de classificação e visualização didática do Algoritmo Húngaro.
                </p>
              </div>
              <span class="text-[11px] font-mono text-indigo-400 font-semibold group-hover:underline">
                github.com/jgabrielsg/Simulacao-Futebol-Brasileiro
              </span>
            </a>
          </div>
        </section>

      </article>

    </div>
  </main>
</div>
