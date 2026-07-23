<script setup lang="ts">
import NavView from '@/components/NavView.vue'
import restaurantsData from '@/assets/data/restaurants.json'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const restaurants = restaurantsData.restaurants
// 頭尾各補一張「複製的」卡片：最前面放最後一家的複製品，最後面放第一家的複製品
// 這樣滑到複製品的時候，可以偷偷跳回真正的那一張，做出「無限循環」的錯覺
const extendedRestaurants = [
  restaurants[restaurants.length - 1]!,
  ...restaurants,
  restaurants[0]!,
]

// 因為前面多塞了一張複製品，「真正的第一家」現在排在 index 1，不是 0
const currentIndex = ref(1)
const cardWidth = 336 + 30
const isTransitionEnabled = ref(true)

const trackStyle = computed(() => {
  return {
    transform: `translateX(-${currentIndex.value * cardWidth}px)`,
    transition: isTransitionEnabled.value ? 'transform 0.8s ease' : 'none',
  }
})

function doPrevSlide() {
  prevSlide()
  rebindAutoScroll()
}

function doNextSlide() {
  nextSlide()
  rebindAutoScroll()
}

function prevSlide() {
  currentIndex.value -= 1
}

function nextSlide() {
  currentIndex.value += 1
}

// 滑動動畫結束後才檢查：如果現在停在「複製品」上，就偷偷（不做動畫）跳回真正的那一張
function handleTransitionEnd() {
  if (currentIndex.value === extendedRestaurants.length - 1) {
    jumpWithoutAnimation(1)
  } else if (currentIndex.value === 0) {
    jumpWithoutAnimation(restaurants.length)
  }
}

function jumpWithoutAnimation(index: number) {
  isTransitionEnabled.value = false
  currentIndex.value = index
  // 等瀏覽器真的畫出「沒有動畫的跳轉」這一幀之後，才重新打開動畫
  // 不然「打開動畫」跟「跳轉」如果同一幀發生，跳轉本身也會被畫成一次滑動
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isTransitionEnabled.value = true
    })
  })
}

let timer: number | null

function bindAutoScroll() {
  timer = window.setInterval(() => {
    nextSlide()
  }, 3000)
}

function rebindAutoScroll() {
  if (timer) {
    window.clearInterval(timer)
  }
  bindAutoScroll()
}

// 分頁切到背景時，瀏覽器會延遲或積壓 setInterval 的觸發時機，
// 切回來的時候一次補跑好幾次 nextSlide()，才會看到「壞掉」或「快速捲動」。
// 用 Page Visibility API 主動在切走時停掉計時器、切回來時重新起一個乾淨的，
// 不依賴瀏覽器自己的節流行為，就不會有累積的問題。
function handleVisibilityChange() {
  if (document.hidden) {
    if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  } else {
    bindAutoScroll()
  }
}

onMounted(() => {
  bindAutoScroll()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="home-page container-fluid d-flex flex-column min-vh-100">
    <NavView />

    <section class="home-hero flex-grow-1 d-flex align-items-center">
      <div class="home-hero__content flex-fill">
        <span class="home-hero__badge">📌 上班族午餐救星</span>
        <h1>
          <span class="home-hero__title">中午吃什麼？</span><br />
          <span class="home-hero__title-accent">等等轉一下。</span>
        </h1>
        <p class="home-hero__subtitle">
          幫你決定午餐、揪同事開團，自動分帳，誰還沒付錢一眼看清楚。
        </p>

        <div class="home-hero__actions d-flex">
          <RouterLink class="btn-primary-custom" to="/wheel">今天吃什麼 🎲</RouterLink>
          <!-- 「看看怎麼用」還沒有對應頁面，先隱藏 -->
          <!-- <a class="btn-secondary-custom" href="">看看怎麼用 →</a> -->
        </div>
      </div>

      <div class="home-hero__lunch-card-carousel-container d-flex align-items-center">
        <button @click="doNextSlide" class="home-hero__lunch-card-carousel-arrow btn">⬅️</button>

        <div class="home-hero__lunch-card-carousel overflow-hidden">
          <div
            class="home-hero__lunch-card-carousel-track d-flex"
            :style="trackStyle"
            @transitionend="handleTransitionEnd"
          >
            <div
              v-for="(restaurant, index) in extendedRestaurants"
              :key="index"
              class="home-hero__lunch-card card-custom flex-shrink-0"
            >
              <div class="card-custom__header">
                <span class="card-custom__eyebrow">✦ 今日命運午餐</span>
                <h2>{{ restaurant.name }}</h2>
              </div>

              <div class="card-custom__body">
                <ul>
                  <li>📍距離公司 {{ restaurant.distance }} 分鐘</li>
                  <li>💰預估 ${{ restaurant.estimatedPrice }}</li>
                  <li>😆適合：{{ restaurant.heroSummary }}</li>
                </ul>
                <div class="card-custom__tags">
                  <span v-for="tag in restaurant.tags" :key="tag" class="tag">#{{ tag }}</span>
                </div>
              </div>

              <div class="card-custom__footer">
                <RouterLink
                  :to="{ path: '/lunch-group', query: { restaurantId: restaurant.id } }"
                  class="btn-dark-custom"
                  >用這家開團 →</RouterLink
                >
              </div>
            </div>
          </div>
        </div>

        <button @click="doPrevSlide" class="home-hero__lunch-card-carousel-arrow btn">➡️</button>
      </div>
    </section>

    <div class="home-features d-flex flex-column flex-md-row">
      <div class="home-features__card home-features__card--mustard">
        <span>🍱</span>
        <h3>不知道吃什麼</h3>
        <p>輪盤幫你從餐廳清單裡抽一個，減少午餐選擇困難。</p>
      </div>
      <div class="home-features__card home-features__card--white">
        <span>🧾</span>
        <h3>同事一起點</h3>
        <p>建立午餐團，大家自己加餐點、數量和備註。</p>
      </div>
      <div class="home-features__card home-features__card--tomato">
        <span>💸</span>
        <h3>分帳不用吵</h3>
        <p>自動計算外送費、折扣和每個人應付金額。</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
