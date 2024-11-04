function consult() {
  // Exibe o mapa
  document.getElementById("map").classList.remove("d-none");

  // Limpa os resultados anteriores
  document.getElementById("city").innerHTML = "";
  document.getElementById("courses").innerHTML = "";

  // Obtém a mesorregião inserida pelo usuário
  let mesoregion = document.getElementById("mesoregion").value.trim();

  // Carrega os arquivos JSON
  Promise.all([
    fetch("../data/dados_imp.json").then((response) => response.json()),
    fetch("../data/dados_imp_2.json").then((response) => response.json()),
    fetch("../data/cursos_por_area.json").then((response) => response.json()),
    fetch("../data/cidades_cursos_sp.json").then((response) => response.json()),
  ])
    .then(function ([
      dados_imp,
      dados_imp_2,
      cursos_por_area,
      cidades_cursos_sp,
    ]) {
      // Cria um mapeamento de cidade para mesorregião a partir do database fornecido
      let cityToMesoregion = {};
      cidades_cursos_sp["cidades"].forEach((city) => {
        cityToMesoregion[city.nome] = city.mesorregiao;
      });

      // Filtra as cidades da mesorregião selecionada
      let citiesInMesoregion = dados_imp.filter((cityData) => {
        let cityName = cityData["local"];
        return cityToMesoregion[cityName] === mesoregion;
      });

      // Verifica se existem cidades na mesorregião selecionada
      if (citiesInMesoregion.length === 0) {
        alert("Nenhuma cidade encontrada na mesorregião selecionada.");
        return;
      }

      // Calcula a pontuação para cada cidade
      let cityScores = citiesInMesoregion.map((cityData) => {
        let cityName = cityData["local"];

        // Encontra os dados correspondentes em dados_imp_2.json
        let cityData2 = dados_imp_2.find((item) => item["local"] === cityName);

        // Função para calcular a pontuação da cidade
        function computeCityScore(cityData, cityData2) {
          let population =
            parseInt(cityData["population"].replace(/\D/g, "")) || 0;
          let urbanization =
            parseFloat(cityData["urbanization_percentage"].replace(",", ".")) ||
            0;
          let totalEmployment =
            parseInt(cityData2["jobs"].replace(/\D/g, "")) || 0;

          // Critérios de pontuação (ajuste os pesos conforme necessário)
          let score =
            population * 0.4 + urbanization * 0.3 + totalEmployment * 0.3;
          return score;
        }

        let score = computeCityScore(cityData, cityData2);

        return {
          cityName,
          score,
          cityData,
          cityData2,
        };
      });

      // Ordena as cidades pela pontuação (maior para menor)
      cityScores.sort((a, b) => b.score - a.score);

      // Seleciona a melhor cidade
      let bestCity = cityScores[0];

      // Exibe o nome da cidade
      document.getElementById("city").innerHTML = bestCity.cityName;

      // Analisa o perfil econômico para sugerir cursos
      let sectors = [
        {
          name: "agricultura",
          participation:
            parseFloat(bestCity.cityData2["agro_jobs"].replace(",", ".")) || 0,
        },
        {
          name: "industria",
          participation:
            parseFloat(bestCity.cityData2["industry_jobs"].replace(",", ".")) ||
            0,
        },
        {
          name: "servicos",
          participation:
            parseFloat(bestCity.cityData2["service_jobs"].replace(",", ".")) ||
            0,
        },
        {
          name: "vendas",
          participation:
            parseFloat(
              bestCity.cityData2["sell_jobs"]?.replace(",", ".") || "0"
            ) || 0,
        },
        // Adicione outros setores, se necessário
      ];

      // Ordena os setores pela participação
      sectors.sort((a, b) => b.participation - a.participation);

      let suggestedCourses = [];

      // Coleta cursos com base nos setores predominantes
      sectors.forEach((sector) => {
        let areaKey = sector.name;
        if (areaKey && cursos_por_area["cursos_por_area"][areaKey]) {
          suggestedCourses = suggestedCourses.concat(
            cursos_por_area["cursos_por_area"][areaKey]
          );
        }
      });

      // Remove cursos duplicados e limita a 10 sugestões
      suggestedCourses = [...new Set(suggestedCourses)].slice(0, 10);

      // Exibe os cursos sugeridos
      suggestedCourses.forEach((course) => {
        document.getElementById("courses").innerHTML +=
          "<li>" + course + "</li>";
      });

      // Atualiza o mapa para destacar a cidade selecionada
      [...document.querySelectorAll(".city")].forEach((element) => {
        element.classList.add("city-off");
      });

      let code = bestCity.cityData["Cód. IBGE"];
      // Remove zeros à esquerda do código IBGE, se necessário
      code = code.replace(/^0+/, "");
      document.getElementById("mun_" + code).classList.remove("city-off");
    })
    .catch((error) => {
      console.error("Erro ao carregar os dados:", error);
    });
}
