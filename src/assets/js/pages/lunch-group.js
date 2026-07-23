
let selectedRestaurant;

async function init() {
    selectedRestaurant = await getRestaurant();
    render();
}

async function getRestaurant() {
    return window.localStorage.getItem('selectedRestaurant')?.json() ?? await fetchRandomRestaurant()
}

async function fetchRandomRestaurant() {
    let restaurantsResponse = await fetch('./assets/data/restaurants.json');
    let restaurants = (await restaurantsResponse.json()).restaurants;
    return restaurants[Math.floor(Math.random() * restaurants.length)];
}

function render() {
    document.querySelector('.lunch-group-store__name').textContent = selectedRestaurant.name;

    let _infoList = document.querySelector('lunch-group-info-list');

    
}

init();
