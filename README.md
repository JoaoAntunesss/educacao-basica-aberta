# Educação Básica Aberta

Um guia gratuito e aberto da **Licenciatura em Educação Básica** (1.º ciclo de Bolonha, 180 ECTS), feito por estudantes para estudantes.

**Site:** https://joaoantunesss.github.io/educacao-basica-aberta/

## O que tem

- **35 cadeiras** organizadas por ano e semestre (3 anos, 6 semestres), mais os mestrados que dão habilitação para a docência.
- Para cada cadeira: descrição, tópicos, tarefas práticas, materiais e ligações às Aprendizagens Essenciais e ao Perfil dos Alunos à Saída da Escolaridade Obrigatória.
- Áreas: Língua Portuguesa, Matemática, Ciências, Ciências Humanas e Sociais, Expressões Artísticas, Ciências da Educação, Didáticas, Iniciação à Prática Profissional e Tronco comum.
- Comparação com os planos de estudo da ESE de Lisboa, ESE do Porto, Universidade de Évora e ESE de Leiria.
- Mapa interativo em 3D (WebGL), progresso guardado no navegador, pesquisa, modo claro e escuro, português e inglês.
- Lições completas escritas em Markdown em `conteudo/<cadeira>/<n>.md` (em construção).

## Como funciona

É um site estático (HTML, CSS e JavaScript), sem servidor:

- `js/data.js` — semestres, áreas, escolas e cadeiras.
- `js/app.js` — a interface.
- `js/placa3d.js` — o mapa 3D em Three.js (com recurso para `js/placa.js` se não houver WebGL).
- `js/lessons.js` — gerado a partir de `conteudo/` com `node scripts/build-lessons.mjs`.

Para ver localmente: abre o `index.html` ou corre `python -m http.server` na pasta.

## Nota

Este guia é independente e não substitui os planos oficiais de cada instituição. Para seres professor ou educador precisas também de um mestrado em ensino (ver a secção "Mestrado").

Projeto irmão: [Engenharia Informática Aberta](https://joaoantunesss.github.io/open-computer-engineering/).
