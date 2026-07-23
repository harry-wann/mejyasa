let currentIndex = 0;
let restaurants = [];
let spinRotation = 0;
let spinCount = 0;
let isSpinning = false;

async function init() {
    restaurants = await fetchRestaurants();
    currentIndex = Math.floor(Math.random() * restaurants.length);
    renderCandidates(currentIndex);
    renderResult(currentIndex);
    renderSpinner();
    setupBinding();
}

async function fetchRestaurants() {
    let restaurantsResponse = await fetch('./assets/data/restaurants.json');
    return (await restaurantsResponse.json()).restaurants;
}

function renderCandidates(index) {
    let container = document.querySelector('.wheel-candidate-list');

    for (let i = 0; i < restaurants.length; i++) {
        let restaurant = restaurants[i];
        let chip = document.createElement('button');
        chip.textContent = restaurant.name;
        if (i == index) {
            chip.className = 'wheel-candidate wheel-candidate--current';
        } else {
            chip.className = 'wheel-candidate';
        }
        container.appendChild(chip);
    }
}

function renderResult(index) {

    let restaurant = restaurants[index];
    document.querySelector('#selected-title').textContent = restaurant.name;

    let container = document.querySelector('.wheel-panel__result-details');
    container.replaceChildren();

    let elem = document.createElement('p');
    elem.textContent = `💰 預估 $${restaurant.estimatedPrice}`;
    container.appendChild(elem);

    let suitableForList = restaurant.suitableFor;
    let count = suitableForList.length;

    for (let i = 0; i < count; i++) {
        let elem = document.createElement('p');
        elem.textContent = suitableForList[i];
        container.appendChild(elem);
    }
}

function renderSpinner() {
    let bgColors = [
        "var(--color-tomato)",
        "var(--color-mustard)",
        "var(--color-orange)",
        "var(--color-cream)"
    ];

    let count = restaurants.length;
    let sliceAngle = 360 / count;
    let gapAngle = 1;
    let segments = [];

    for (let i = 0; i < count; i++) {
        let color = bgColors[i % bgColors.length];
        let startAngle = i * sliceAngle;
        let endAngle = (i + 1) * sliceAngle;
        let colorEndAngle = endAngle - gapAngle;
        segments.push(`${color} ${startAngle}deg ${colorEndAngle}deg`);
        segments.push(`var(--color-white) ${colorEndAngle}deg ${endAngle}deg`);
    }

    let disc = document.querySelector('.wheel-spinner__disc');
    disc.style.background = `conic-gradient(${segments.join(', ')})`;

    let labels = document.querySelector('.wheel-spinner__labels');

    for (let i = 0; i < count; i++) {
        let restaurant = restaurants[i];
        let label = document.createElement('span');
        let angle = i * sliceAngle + sliceAngle / 2;
        let radius = 30;

        label.className = 'wheel-spinner__label';
        label.textContent = restaurant.name;
        label.style.left = `${50 + Math.cos((angle - 90) * Math.PI / 180) * radius}%`;
        label.style.top = `${50 + Math.sin((angle - 90) * Math.PI / 180) * radius}%`;
        label.style.transform = `translate(-50%, -50%) rotate(${angle - 90}deg)`;

        labels.appendChild(label);
    }

    let targetAngle = currentIndex * sliceAngle + sliceAngle / 2;
    spinRotation = -targetAngle

    disc.style.transition = 'none';
    labels.style.transition = 'none';

    disc.style.transform = `rotate(${spinRotation}deg)`;
    labels.style.transform = `rotate(${spinRotation}deg)`;

    void disc.offsetHeight;
    disc.style.transition = '';
    labels.style.transition = '';
}

function setupBinding() {
    document.querySelector('#spin-button').onclick = () => {
        random();
    }

    document.querySelector('.wheel-spinner__disc').addEventListener('transitionend', () => {
        isSpinning = false;
    }, { once: false });
}

function random() {

    if (isSpinning) {
        return;
    }
    isSpinning = true;

//   概念：
//   - 只在「扣掉目前那個」的範圍裡抽
//   - 先抽 0 ~ length - 2
//   - 如果抽到的位置大於等於 currentIndex，就往後挪一格
//   - 這樣會跳過 currentIndex
//   - 剩下每個 index 機率一樣

//   例子：有 5 個，目前是 2。
//   先抽範圍只會是 0,1,2,3。
//   然後：
//   - 0 → 0
//   - 1 → 1
//   - 2 → 3
//   - 3 → 4

    let newIndex = Math.floor(Math.random() * (restaurants.length - 1));
    if (newIndex >= currentIndex) {
        newIndex++;
    }

    spinWheelTo(newIndex);

    setTimeout(() => {
        renderResult(newIndex);
        rerenderChip(currentIndex, newIndex);
        currentIndex = newIndex;
    }, 2000);
}

function spinWheelTo(index) {
    let sliceAngle = 360 / restaurants.length;
    let targetAngle = (index * sliceAngle) + (sliceAngle / 2);
    let rounds = 3 * 360;

    spinCount++;
    spinRotation = (spinCount * rounds) - targetAngle;

    document.querySelector('.wheel-spinner__disc').style.transform = `rotate(${spinRotation}deg)`;
    document.querySelector('.wheel-spinner__labels').style.transform = `rotate(${spinRotation}deg)`;
}

function rerenderChip(oldIndex, newIndex) {
    let chips = document.querySelector('.wheel-candidate-list').children;
    chips[oldIndex].className = 'wheel-candidate';
    chips[newIndex].className = 'wheel-candidate wheel-candidate--current';
}

init();
