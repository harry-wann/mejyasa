<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavView from '@/components/NavView.vue'
import HeaderView from '@/components/HeaderView.vue'
import restaurantsData from '@/assets/data/restaurants.json'

const LUNCH_GROUP_DATA_KEY = "LUNCH_GROUP_DATA_KEY"

interface Order {
  id: number
  name: string
  order: string
  note: string
  price: number
  amount: number
}

interface PersistedLunchGroup {
  groupInfo: {
    deadline: string
    payer: string
    deliveryFee: number
    discount: number
    note: string
  }
  orders: Order[]
  savedAt: number
  paidNames?: string[]
}

const route = useRoute()
const router = useRouter()
const restaurantIds = route.query.restaurantId
let tmpId
if (Array.isArray(restaurantIds)) {
  tmpId = restaurantIds[0]
} else {
  tmpId = restaurantIds
}
// 網址沒帶 restaurantId，就當作沒選餐廳，不用去猜要讀哪一筆舊資料
const hasRestaurantIdInUrl = tmpId != null
const restaurantId: number = hasRestaurantIdInUrl ? parseInt(tmpId ?? '-1') : -1

const restaurant = restaurantsData.restaurants.find((item) => item.id == restaurantId)

const all = JSON.parse(localStorage.getItem(LUNCH_GROUP_DATA_KEY) ?? '{}')
const data = all[restaurantId.toString()] as PersistedLunchGroup | undefined

const orders = data?.orders ?? []
const deliveryFee = data?.groupInfo?.deliveryFee ?? 0
const discount = data?.groupInfo?.discount ?? 0
const payer = data?.groupInfo?.payer ?? ''
const orderTotalPrice = orders.map((order) => order.price * order.amount).reduce((prev, next) => { return prev + next }, 0)

interface SplitDetail {
  name: string
  subtotal: number
  deliveryShare: number
  discountShare: number
  finalAmount: number
  isPayer: boolean
  status: string
}

// 依姓名分組：同一個人可能點了好幾筆餐點，小計要先加總
const uniqueNames = [...new Set(orders.map((order) => order.name))]
const peopleCount = uniqueNames.length || 1
// 無條件進位到整數，避免除不盡出現一長串小數，寧可多收一點也不要少收
const deliveryShare = Math.ceil(deliveryFee / peopleCount)
const discountShare = Math.ceil(discount / peopleCount)

// 誰已經付款是唯一需要之後互動改變的部分，單獨用一個 ref 存名字清單
const paidNames = ref<string[]>(data?.paidNames ?? [])

const splitDetails = computed<SplitDetail[]>(() =>
  uniqueNames.map((name) => {
    const subtotal = orders
      .filter((order) => order.name === name)
      .reduce((sum, order) => sum + order.price * order.amount, 0)
    const isPayer = name === payer
    const isPaid = paidNames.value.includes(name)
    return {
      name,
      subtotal,
      deliveryShare,
      discountShare,
      finalAmount: subtotal + deliveryShare - discountShare,
      isPayer,
      status: isPayer ? '代墊者' : (isPaid ? '已付款' : '未付款'),
    }
  })
)

const payableCount = computed(() => splitDetails.value.filter((detail) => !detail.isPayer).length)
const paidCount = computed(() => splitDetails.value.filter((detail) => detail.status === '已付款').length)
const unpaidCount = computed(() => payableCount.value - paidCount.value)
const progressPercent = computed(() =>
  payableCount.value > 0 ? (paidCount.value / payableCount.value) * 100 : 0
)

function togglePaid(detail: SplitDetail) {
  if (detail.isPayer) {
    return
  }
  const index = paidNames.value.indexOf(detail.name)
  if (index === -1) {
    paidNames.value.push(detail.name)
  } else {
    paidNames.value.splice(index, 1)
  }
  persistPaidNames()
}

function persistPaidNames() {
  const map = JSON.parse(localStorage.getItem(LUNCH_GROUP_DATA_KEY) ?? '{}')
  const existing = map[restaurantId.toString()] ?? {}
  map[restaurantId.toString()] = { ...existing, paidNames: paidNames.value }
  localStorage.setItem(LUNCH_GROUP_DATA_KEY, JSON.stringify(map))
}

function endGroup() {
  if (!confirm('確定要結束這個午餐團嗎？結束後這筆資料會被清除，無法復原。')) {
    return
  }
  const map = JSON.parse(localStorage.getItem(LUNCH_GROUP_DATA_KEY) ?? '{}')
  delete map[restaurantId.toString()]
  localStorage.setItem(LUNCH_GROUP_DATA_KEY, JSON.stringify(map))
  router.push('/')
}

interface ResultSummary {
  category: string
  title: string
  value: number
}

const resultSummary = ref<ResultSummary[]>(
  [
    {
      category: "orderTotal",
      title: "🧾 餐點總額",
      value: orderTotalPrice
    },
    {
      category: "deliveryFee",
      title: "🛵 外送費",
      value: deliveryFee,
    },
    {
      category: "discount",
      title: "🏷️ 折扣",
      value: discount,
    },
    {
      category: "sum",
      title: "💰 應收總額",
      value: orderTotalPrice + deliveryFee - discount
    }
  ]
)

</script>

<template>
  <div class="split-result-page sub-page container-fluid d-flex flex-column min-vh-100">
    <NavView />

    <HeaderView title="分帳結果" desc="誰該付多少，誰還沒付，一眼看清楚。" />

    <main class="split-result-main d-flex flex-column">
      <div class="split-result-summary d-flex">
        <div v-for="result in resultSummary" :key="result.title" class="split-result-summary-card">
          <p class="split-result-summary-card__label">
            {{ result.title }}
          </p>
          <p
            class="split-result-summary-card__value"
            :class="{ 'split-result-summary-card__value--highlight': result.category == 'sum' }"
            >
            <span v-if="result.category == 'discount'">−</span>${{ result.value }}
          </p>
        </div>
      </div>

      <section class="split-result-overview d-flex flex-column flex-lg-row">
        <div class="split-result-overview--contain d-lg-flex">
          <article class="split-result-detail-card w-100 d-flex flex-column">
            <div class="split-result-card-header d-flex align-items-center justify-content-between">
              <h2 class="split-result-card-title">分帳明細</h2>
              <span class="split-result-detail-card__meta"
                >{{ restaurant?.name }} · {{ splitDetails.length }} 人</span
              >
            </div>

            <div class="split-result-table-wrap">
              <table class="split-result-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>餐點小計</th>
                    <th>分攤外送費</th>
                    <th>分攤折扣</th>
                    <th>最後應付</th>
                    <th>付款狀態</th>
                  </tr>
                </thead>
                <tbody class="split-result-table__border-bottom">
                  <tr v-for="detail in splitDetails" :key="detail.name">
                    <td class="split-result-table__name">{{ detail.name }}</td>
                    <td>${{ detail.subtotal }}</td>
                    <td>+${{ detail.deliveryShare }}</td>
                    <td>−${{ detail.discountShare }}</td>
                    <td class="split-result-table__subtotal">${{ detail.finalAmount }}</td>
                    <td>
                      <span
                        class="split-result-status-badge"
                        :class="{
                          'split-result-status-badge--payer': detail.status == '代墊者',
                          'split-result-status-badge--paid': detail.status == '已付款',
                          'split-result-status-badge--unpaid': detail.status == '未付款',
                        }"
                        @click="togglePaid(detail)"
                        >{{ detail.status }}</span
                      >
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="split-result-total-row__note">
                      餐點 ${{ orderTotalPrice }} 外送費 +${{ deliveryFee }} 折扣 −${{ discount }}
                    </td>
                    <td class="split-result-total-row__amount">
                      ${{ orderTotalPrice + deliveryFee - discount }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </article>
        </div>

        <div class="split-result-overview--contain d-lg-flex">
          <section class="split-result-payment-card w-100 d-flex flex-column">
            <h2 class="split-result-card-title">付款狀態</h2>

            <div class="split-result-payment-stats d-flex">
              <div class="split-result-payment-stat split-result-payment-stat--paid">
                <p class="split-result-payment-stat__label">已付款</p>
                <p class="split-result-payment-stat__value">{{ paidCount }} 人</p>
              </div>
              <div class="split-result-payment-stat split-result-payment-stat--unpaid">
                <p class="split-result-payment-stat__label">未付款</p>
                <p class="split-result-payment-stat__value">{{ unpaidCount }} 人</p>
              </div>
            </div>

            <div class="split-result-progress d-flex flex-column">
              <div class="split-result-progress__header d-flex align-items-center justify-content-between">
                <span>收款進度</span>
                <span>{{ paidCount }} / {{ payableCount }} 人</span>
              </div>
              <div class="split-result-progress__track">
                <div class="split-result-progress__bar" :style="{ width: progressPercent + '%' }"></div>
              </div>
            </div>

            <div class="split-result-payer-list d-flex flex-column">
              <div
                v-for="detail in splitDetails"
                :key="detail.name"
                class="split-result-payer-row d-flex align-items-center justify-content-between"
              >
                <span class="split-result-payer-row__name"
                  >{{ detail.isPayer ? '💳' : '⏳' }} {{ detail.name }}</span
                >
                <span
                  class="split-result-status-badge"
                  :class="{
                    'split-result-status-badge--payer': detail.status == '代墊者',
                    'split-result-status-badge--paid': detail.status == '已付款',
                    'split-result-status-badge--unpaid': detail.status == '未付款',
                  }"
                  @click="togglePaid(detail)"
                  >{{ detail.status }}</span
                >
              </div>
            </div>

            <button class="btn-primary-custom" @click="endGroup">結束這團 🏁</button>
          </section>
        </div>
      </section>
    </main>
  </div>
</template>
