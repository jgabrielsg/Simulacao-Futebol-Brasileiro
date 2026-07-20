# Simulação Logística do Futebol Brasileiro

**Acesso à aplicação interativa:** [simulacao-divisoes-futebol-brasileiro.netlify.app](https://simulacao-divisoes-futebol-brasileiro.netlify.app/)

## Sobre o Projeto
Este projeto consiste em uma visualização interativa fundamentada em modelagem de dados e otimização espacial aplicada ao calendário do futebol nacional. O objetivo central é propor e testar uma reestruturação da pirâmide de divisões do Brasil com base em duas premissas operacionais:
1. **Expansão do Calendário:** Garantir atividade anual contínua para times de menor expressão, evitando o encerramento das atividades na metade do ano.
2. **Minimização do Custo Logístico:** Reduzir drasticamente as distâncias de viagem, fator que atualmente onera e inviabiliza a operação de clubes com menor capacidade financeira nas séries C e D.

A aplicação demonstra como a regionalização baseada em dados geográficos precisos pode criar ligas balanceadas e economicamente sustentáveis.

## Metodologia e Modelagem Matemática
A simulação não utiliza dados arbitrários. Toda a lógica de divisão, transição e resultados foi pré-processada utilizando pesquisa operacional e ciência de redes:

* **Força Desportiva (PageRank):** O ranqueamento das equipes e a probabilidade de vitória nas simulações estocásticas utilizam um cálculo de centralidade (PageRank) extraído de um grafo histórico de confrontos do futebol brasileiro (considerando todos os jogos estaduais ou nacionais de 2020 até 2025).
* **Regionalização Inicial (Balanced K-Means):** A distribuição das ligas regionais foi gerada por algoritmos de clusterização espacial, agrupando as coordenadas geográficas dos estádios e garantindo contingentes exatos de times por região.
* **Otimização de Transição (Algoritmo Húngaro):** Durante as promoções e rebaixamentos ao fim de cada temporada, o sistema evita o efeito de borda aplicando o Problema de Atribuição Linear (Linear Assignment Problem). O Algoritmo Húngaro realoca as novas equipes minimizando a soma global das distâncias em relação aos centróides geográficos históricos de cada liga.
* **Análise de Roteamento:** O custo logístico de cada confronto é avaliado medindo a distância rodoviária e geodésica entre estádios e hubs aeroportuários (via Haversine e API OSRM). O sistema define o modal (terrestre ou aéreo) com base em um limiar de viabilidade de 800 km.

## Estrutura da Pirâmide Proposta
A hierarquia demonstrada no simulador mantém as divisões de elite em formato nacional e regionaliza as bases de forma escalonada:
* **Série A e B:** 20 clubes cada (Nível Nacional).
* **Série C:** 80 clubes alocados em 4 Ligas Macrorregionais (ex: Liga Centro-Sudeste, Liga Nordeste).
* **Série D:** 216 clubes alocados em 12 Ligas Microrregionais (ex: Liga Caminho do Ouro, Liga Farroupilha, Liga Madeira-Mamoré).

## Arquitetura de Software
A aplicação foi construída para atuar como um dashboard de alta performance no lado do cliente (Client-Side), sem dependência de processamento em backend durante a execução.

* **Framework:** SvelteKit configurado como Single Page Application (SPA) puramente estática.
* **Visualização de Mapas:** Integração com Leaflet e Turf.js para a renderização cartográfica, desenho de fronteiras de clusters (Convex Hulls) e animações vetoriais de rotas.
* **Banco de Dados Estático:** Os cálculos de matriz de distância e atributos dos clubes estão armazenados em arquitetura JSON estática (`teams_db.json`, `city_hubs.json`, `leagues_init.json`). Isso elimina latência de rede e restrições de chamadas a APIs externas.
* **Hospedagem:** Deploy automatizado e otimizado via Netlify.

## Execução Local

Para inicializar a interface localmente em ambiente de desenvolvimento:

```bash
# Instalar dependências do projeto
npm install

# Iniciar o servidor local SvelteKit
npm run dev
```
