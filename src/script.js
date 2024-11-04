function consult() {
  document.getElementById("map").classList.remove("d-none");

  document.getElementById("city").innerHTML = "";
  document.getElementById("courses").innerHTML = "";

  let mesoregion = document.getElementById("mesoregion").value.trim();

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
      let cityToMesoregion = {};
      cidades_cursos_sp["cidades"].forEach((city) => {
        cityToMesoregion[city.nome] = city.mesorregiao;
      });

      let citiesInMesoregion = dados_imp.filter((cityData) => {
        let cityName = cityData["local"];
        return cityToMesoregion[cityName] === mesoregion;
      });

      if (citiesInMesoregion.length === 0) {
        alert("Nenhuma cidade encontrada na mesorregião selecionada.");
        return;
      }

      let cityScores = citiesInMesoregion.map((cityData) => {
        let cityName = cityData["local"];

        let cityData2 = dados_imp_2.find((item) => item["local"] === cityName);

        function computeCityScore(cityData, cityData2) {
          let population =
            parseInt(cityData["population"].replace(/\D/g, "")) || 0;
          let urbanization =
            parseFloat(cityData["urbanization_percentage"].replace(",", ".")) ||
            0;
          let totalEmployment =
            parseInt(cityData2["jobs"].replace(/\D/g, "")) || 0;

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

      cityScores.sort((a, b) => b.score - a.score);

      let bestCity = cityScores[0];

      document.getElementById("city").innerHTML = bestCity.cityName;

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
      ];

      sectors.sort((a, b) => b.participation - a.participation);

      let sectorToCourseArea = {
        agricultura: "agronomia",
        industria: "industria",
        servicos: "servicos",
      };

      let suggestedCourses = [];

      sectors.forEach((sector) => {
        let areaKey = sectorToCourseArea[sector.name];
        if (areaKey && cursos_por_area["cursos_por_area"][areaKey]) {
          suggestedCourses = suggestedCourses.concat(
            cursos_por_area["cursos_por_area"][areaKey]
          );
        }
      });

      suggestedCourses = [...new Set(suggestedCourses)].slice(0, 10);

      suggestedCourses.forEach((course) => {
        document.getElementById("courses").innerHTML +=
          "<li>" + course + "</li>";
      });

      [...document.querySelectorAll(".city")].forEach((element) => {
        element.classList.add("city-off");
      });

      let code = bestCity.cityData["Cód. IBGE"];
          code = code.replace(/^0+/, "");
    
        document.getElementById("mun_" + code).classList.remove("city-off");
    })
    .catch((error) => {
      console.error("Erro ao carregar os dados:", error);
    });
}
