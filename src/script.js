function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function consult() {
  document.getElementById("map").classList.remove("d-none");

  document.getElementById("city").innerHTML = "";
  document.getElementById("courses").innerHTML = "";

  let mesoregion = document.getElementById("mesorregiao").value.trim();

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
          let population = parseInt(cityData["population"]) || 0;
          let urbanization =
            parseFloat(cityData["urbanization_percentage"]) || 0;
          let totalEmployment = parseInt(cityData2["jobs"]) || 0;

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

      let jobsSum =
        parseFloat(bestCity.cityData2["agro_jobs"]) +
        parseFloat(bestCity.cityData2["industry_jobs"]) +
        parseFloat(bestCity.cityData2["service_jobs"]);

      let sectors = [
        {
          name: "agricultura",
          participation:
            parseFloat(bestCity.cityData2["agro_jobs"]) / jobsSum || 0,
        },
        {
          name: "industria",
          participation:
            parseFloat(bestCity.cityData2["industry_jobs"]) / jobsSum || 0,
        },
        {
          name: "servicos",
          participation:
            parseFloat(bestCity.cityData2["service_jobs"]) / jobsSum || 0,
        },
      ];

      let sectorToCourses = cursos_por_area["cursos_por_area"];

      let courseScores = {};

      let maxCourses = 10;
      let auxMaxCourses = 10;
      let count = 0;

      sectors.forEach((sector) => {
        let sectorCourses = shuffle(sectorToCourses[sector.name]);

        if (sectorCourses) {
          let numCourses = Math.round(sector.participation * maxCourses);

          ++count;

          if (count == 3 && auxMaxCourses > 0) {
            numCourses = auxMaxCourses;
          }

          numCourses = Math.min(numCourses, sectorCourses.length);

          auxMaxCourses -= numCourses;

          for (let i = 0; i < numCourses; i++) {
            const course = sectorCourses[i];
            if (courseScores[course]) {
              courseScores[course] += sector.participation;
            } else {
              courseScores[course] = sector.participation;
            }
          }
        }
      });

      let courseScoresArray = Object.keys(courseScores).map((course) => {
        return {
          course: course,
          score: courseScores[course],
        };
      });

      courseScoresArray.sort((a, b) => b.score - a.score);

      courseScoresArray = courseScoresArray.slice(0, maxCourses);

      courseScoresArray.sort((a, b) => b.score - a.score);

      let suggestedCourses = courseScoresArray.slice(0, 10);

      suggestedCourses.forEach((courseObj) => {
        document.getElementById("courses").innerHTML +=
          "<li>" + courseObj.course + "</li>";
      });

      [...document.querySelectorAll(".city")].forEach((element) => {
        element.classList.add("city-off");
      });

      let code = bestCity.cityData2["ibge_code"];

      document.getElementById("mun_" + code).classList.remove("city-off");
    })
    .catch((error) => {
      console.error("Erro ao carregar os dados:", error);
    });
}
