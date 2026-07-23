<script setup lang="ts">
import NavView from '@/components/NavView.vue'
import HeaderView from '@/components/HeaderView.vue'
import restaurantsData from '@/assets/data/restaurants.json'
import { ref, computed, nextTick } from 'vue'

const shouldAnimate = ref(false)
const restaurants = restaurantsData.restaurants
const currentIndex = ref(Math.floor(Math.random() * restaurants.length))
const currentRestaurant = computed(() => restaurants[currentIndex.value])
const pendingIndex = ref<number | null>(null)

const bgColors = [
  'var(--color-tomato)',
  'var(--color-mustard)',
  'var(--color-orange)',
  'var(--color-cream)',
]

const count = restaurants.length
const sliceAngle = 360 / count
const rounds = 3 * 360;

const spinnerBackground = computed(() => {
  const gapAngle = 1
  const segments = []

  for (let i = 0; i < count; i++) {
    const color = bgColors[i % bgColors.length]
    const startAngle = i * sliceAngle
    const endAngle = (i + 1) * sliceAngle
    const colorEndAngle = endAngle - gapAngle
    segments.push(`${color} ${startAngle}deg ${colorEndAngle}deg`)
    segments.push(`var(--color-white) ${colorEndAngle}deg ${endAngle}deg`)
  }

  return `conic-gradient(${segments.join(', ')})`
})

const labels = computed(() => {
  const radius = 30
  const labels = []
  for (let i = 0; i < count; i++) {
    const restaurant = restaurants[i]
    const angle = i * sliceAngle + sliceAngle / 2
    labels.push({
      id: restaurant?.id,
      name: restaurant?.name,
      style: {
        left: `${50 + Math.cos(((angle - 90) * Math.PI) / 180) * radius}%`,
        top: `${50 + Math.sin(((angle - 90) * Math.PI) / 180) * radius}%`,
        transform: `translate(-50%, -50%) rotate(${angle - 90}deg)`,
      },
    })
  }
  return labels
})

const spinRotation = ref(0)
let spinCount = 0
const isSpinning = ref(false)
const rotateStyle = computed(() => {
  return {
    transform: `rotate(${spinRotation.value}deg)`,
  }
})

const targetAngle = (currentIndex.value * sliceAngle) + (sliceAngle / 2)
spinRotation.value = -targetAngle

// await nextTick()
// shouldAnimate.value = true

nextTick().then(() => {
  shouldAnimate.value = true
})

function spinToIndex(index: number) {
  if (isSpinning.value || index === currentIndex.value) {
    return
  }
  isSpinning.value = true
  pendingIndex.value = index

  const targetAngle = (pendingIndex.value * sliceAngle) + (sliceAngle / 2)

  spinCount++
  spinRotation.value = (spinCount * rounds) - targetAngle
}

function handleSpin() {
  if (isSpinning.value) {
    return
  }

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

  let index = Math.floor(Math.random() * (restaurants.length - 1))
  if (index >= currentIndex.value) {
    index++
  }
  spinToIndex(index)
}

function selectCandidate(index: number) {
  if (isSpinning.value || index === currentIndex.value) {
    return
  }
  currentIndex.value = index
}

function spinFinished() {
  if (pendingIndex.value == null) {
    return
  }
  currentIndex.value = pendingIndex.value
  pendingIndex.value = null
  isSpinning.value = false
}

</script>

<template>
  <div class="wheel-page sub-page container-fluid d-flex flex-column min-vh-100">
    <NavView />

    <!-- TODO Step 1：頁面標題區（今天吃什麼輪盤 + 副標）-->
     <HeaderView
      title="今天吃什麼輪盤"
      desc="選擇困難的時候，交給命運。"
    />

    <!-- TODO Step 2+：主內容（左輪盤 + 右面板）-->
    <main
      class="wheel-main d-flex flex-column column-gap-lg-5 flex-lg-row row-gap-3 align-items-center justify-content-center"
    >
      <div class="wheel-spinner-wrap flex-shrink-0 d-flex flex-column align-items-center">
        <div class="wheel-spinner__pointer"></div>

        <div 
          class="wheel-spinner position-relative"
          :class="{ 'wheel-spinner--animated': shouldAnimate }"
          >
          <div
            class="wheel-spinner__disc"
            :style="[{ background: spinnerBackground }, rotateStyle]"
            @transitionend="spinFinished"
          ></div>
          <div class="wheel-spinner__labels position-absolute" :style="rotateStyle">
            <span
              v-for="label in labels"
              :key="label.id"
              class="wheel-spinner__label"
              :style="label.style"
              >{{ label.name }}</span
            >
          </div>
          <button
            class="wheel-spinner__center position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
          >
            轉
          </button>
        </div>
      </div>

      <div class="wheel-panel flex-shrink-0 d-flex flex-column mb-4 mb-lg-0">
        <div class="wheel-panel__candidates d-flex flex-column order-5 order-lg-1">
          <p>候選名單</p>

          <div id="wheel-candidate-container" class="wheel-candidate-list d-flex flex-wrap">
            <button
              v-for="(restaurant, index) in restaurants"
              :key="restaurant.id"
              :class="['wheel-candidate', { 'wheel-candidate--current': index === currentIndex }]"
              :disabled="isSpinning"
              @click="selectCandidate(index)"
            >
              {{ restaurant.name }}
            </button>
          </div>
        </div>

        <hr class="d-none d-lg-block order-lg-2" />

        <div class="wheel-panel__result d-flex flex-column order-3 order-lg-3">
          <div class="card-custom flex-shrink-0">
            <div class="card-custom__header">
              <span class="card-custom__eyebrow">✦ 今日抽中</span>
              <h2 id="selected-title">{{ currentRestaurant?.name }}</h2>
            </div>

            <div class="wheel-panel__result-details card-custom__body d-flex flex-column">
              <!-- <p>💰 預估 $120</p> -->
              <!-- <p>😌 適合：想吃飽、今天懶得想</p> -->
              <p>💰 預估 $${{ currentRestaurant?.estimatedPrice }}</p>
              <div v-for="value in currentRestaurant?.suitableFor" :key="value">
                <p>{{ value }}</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          id="spin-button" 
          @click="handleSpin"
          :disabled="isSpinning"
          class="btn-primary-custom order-2 order-lg-4"
          >轉一下 🎲</button>
        <RouterLink
          :to="{
            path: '/lunch-group',
            query: {
              restaurantId: currentRestaurant?.id
            }
          }"
          class="wheel-panel__create-action btn-dark-custom order-4 order-lg-5"
          >用這個建立午餐團 →</RouterLink
        >
      </div>
    </main>
  </div>
</template>
