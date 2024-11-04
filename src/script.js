function consult()
{
    window.document.getElementById('map').classList.remove('d-none');

    window.document.getElementById('city').innerHTML = '';

    window.document.getElementById('courses').innerHTML = '';

    let courses = [
        1, 2, 3, 4, 5, 6, 7, 8
    ];


    [...document.querySelectorAll(".city")].map(
        (element) => {
            element.classList.add('city-off');
        }
    );

    let code = '3555406';

    window.document.getElementById('mun_' + code).classList.remove('city-off');

    window.document.getElementById('city').innerHTML = 'Cidade!!!';

    courses.map(function (course) {
        window.document.getElementById('courses').innerHTML += '<li>' + course +  '</li>';
    })
}
