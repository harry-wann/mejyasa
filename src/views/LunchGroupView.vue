<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavView from '@/components/NavView.vue'
import HeaderView from '@/components/HeaderView.vue'
import WTEInput from '@/components/WTEInput.vue'
import restaurantsData from '@/assets/data/restaurants.json'

const LUNCH_GROUP_DATA_KEY = "LUNCH_GROUP_DATA_KEY"
const ONE_HOUR_MS = 60 * 60 * 1000

const route = useRoute()
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

// 整包 localStorage 存的是「每間餐廳各自一筆」的 map，key 是 restaurantId
function loadAllLunchGroupData(): Record<number, any> {
  return JSON.parse(localStorage.getItem(LUNCH_GROUP_DATA_KEY) ?? '{}')
}

let lunchGroupData = loadAllLunchGroupData()[restaurantId]

const isExpired = ((lunchGroupData?.savedAt ?? 0) + ONE_HOUR_MS) < Date.now()
if (isExpired) {
  lunchGroupData = null
}


function createEmptyGroupInfo() {
  return {
    deadline: '',
    payer: '',
    deliveryFee: 0,
    discount: 0,
    note: '',
  }
}

const groupInfo = reactive(lunchGroupData?.groupInfo ?? createEmptyGroupInfo())

const isBasicInfoSaved = ref(lunchGroupData?.groupInfo != null)

const infoList = computed(() => {
  return [
    {
      emoji: '⏰',
      title: '截止時間',
      value: groupInfo.deadline,
    },
    {
      emoji: '🛵',
      title: '外送費',
      value: groupInfo.deliveryFee,
    },
    {
      emoji: '🏷️',
      title: '折扣金額',
      value: groupInfo.discount,
    },
    {
      emoji: '💳',
      title: '付款人',
      value: groupInfo.payer,
    },
    {
      emoji: '📝',
      title: '備註',
      value: groupInfo.note,
    },
  ].filter((info) => info.value)
})

function saveBasicInfo() {
  isBasicInfoSaved.value = true
  persistLunchGroup()
}

function clearBasicInfo() {
  Object.assign(groupInfo, createEmptyGroupInfo())
  isBasicInfoSaved.value = false

  const all = loadAllLunchGroupData()
  delete all[restaurantId]
  localStorage.setItem(LUNCH_GROUP_DATA_KEY, JSON.stringify(all))
}

// New order form fields

interface Order {
  id: number
  name: string
  order: string
  note: string
  price: number
  amount: number
}

// TODO: 驗證用 mock 資料，確認畫面/排序沒問題後記得刪掉
const orders = ref<Order[]>(lunchGroupData?.orders ?? [])
const tmpOrder = reactive(createEmptyOrderDraft())

function createEmptyOrderDraft(): Omit<Order, 'id'> {
  return {
    name: '',
    order: '',
    note: '',
    price: 0,
    amount: 1,
  }
}

function addOrder() {
  orders.value.push({ ...tmpOrder, id: Date.now() })
  Object.assign(tmpOrder, createEmptyOrderDraft())
  persistLunchGroup()
}

function deleteOrder(id: number) {
  orders.value = orders.value.filter((order) => order.id != id )

  persistLunchGroup()
}

function persistLunchGroup() {
  const all = loadAllLunchGroupData()
  all[restaurantId] = {
    groupInfo: groupInfo,
    orders: orders.value,
    savedAt: Date.now(),
  }
  localStorage.setItem(LUNCH_GROUP_DATA_KEY, JSON.stringify(all))
}

const orderTotalPrice = computed(() => {
  return orders.value.map((order) => order.price * order.amount).reduce((prev, next) => { return prev + next }, 0)
})

const router = useRouter()

function toCheck() {
  router.push({
    path: '/split-result',
    query: { restaurantId: restaurantId }
  })
}
</script>

<template>
  <div class="lunch-group-page sub-page container-fluid d-flex flex-column min-vh-100">
    <NavView />

    <HeaderView
      title="開團點餐"
      desc="店家決定了，接下來讓大家自己填。"
    />

    <main class="lunch-group-main d-flex flex-column">
      <section class="lunch-group-overview d-flex flex-column flex-lg-row">
        <div class="lunch-group-overview--contain d-lg-flex">
          <article class="lunch-group-info-card w-100 d-flex flex-column">
            <div class="lunch-group-card-header d-flex align-items-center justify-content-between">
              <h2 class="lunch-group-card-title">午餐團資訊</h2>
              <span class="lunch-group-status">📋 收單中</span>
            </div>

            <div class="lunch-group-store d-flex flex-column">
              <span class="lunch-group-store__label">已選店家</span>
              <h3 class="lunch-group-store__name">{{ restaurant?.name ?? '請先選擇餐廳' }}</h3>
            </div>

            <div v-if="!isBasicInfoSaved">
              <div class="lunch-group-info-list d-flex flex-column">
                <div class="d-flex gap-3">
                  <WTEInput
                    class="wte-input-full"
                    type="time"
                    title="截止時間"
                    v-model="groupInfo.deadline"
                  />
                  <WTEInput
                    class="wte-input-full"
                    title="付款人"
                    placeholder="Harry"
                    v-model="groupInfo.payer"
                  />
                </div>
                <div class="d-flex gap-3">
                  <WTEInput
                    type="number"
                    class="wte-input-full"
                    title="外送費"
                    placeholder="60"
                    v-model="groupInfo.deliveryFee"
                  />
                  <WTEInput
                    type="number"
                    class="wte-input-full"
                    title="折扣金額"
                    placeholder="30"
                    v-model="groupInfo.discount"
                  />
                </div>
                <div class="d-flex wte-input-full">
                  <WTEInput
                    class="wte-input-full"
                    title="團購備註"
                    placeholder="例如：滿 500 免外送、12:10 統一收單"
                    v-model="groupInfo.note"
                  />
                </div>
              </div>
            </div>

            <button
              @click="saveBasicInfo"
              v-if="!isBasicInfoSaved"
              :disabled="!restaurant"
              class="btn-primary-custom"
              style="margin-top: auto"
            >
              儲存午餐團資訊
            </button>

            <div v-if="isBasicInfoSaved" class="lunch-group-info-list d-flex flex-column">
              <div v-for="info in infoList" :key="info.title" class="lunch-group-info-row">
                <span class="lunch-group-info-row__label">
                  <span class="lunch-group-info-row__icon">{{ info.emoji }}</span>
                  {{ info.title }}
                </span>
                <span class="lunch-group-info-row__value">{{ info.value }}</span>
              </div>
            </div>

            <button
              @click="clearBasicInfo"
              v-if="isBasicInfoSaved"
              class="btn-text-custom"
              style="margin-top: auto; align-self: flex-end;"
            >
              清除
            </button>
          </article>
        </div>

        <div class="lunch-group-overview--contain d-lg-flex">
          <section class="lunch-group-form-card w-100 d-flex flex-column">
            <h2 class="lunch-group-card-title">新增餐點</h2>
            <div v-if="!isBasicInfoSaved" class="lunch-group-form-card-reminder">
              <p class="lunch-group-form-card-reminder-title">請先儲存團購設定</p>
              <p class="lunch-group-form-card-reminder-desc">
                設定截止時間、外送費、折扣和付款人後，大家就可以開始新增餐點。
              </p>
            </div>

            <div class="lunch-group-form-card-fields d-flex flex-column">
              <WTEInput
                class="wte-input-full"
                title="姓名"
                placeholder="誰訂的"
                v-model="tmpOrder.name"
              />

              <WTEInput
                class="wte-input-full"
                title="餐點名稱"
                placeholder="點什麼"
                v-model="tmpOrder.order"
              />

              <WTEInput
                class="wte-input-full"
                title="備註"
                placeholder=""
                v-model="tmpOrder.note"
              />

              <div class="lunch-group-form-card-price_amount d-flex">
                <WTEInput
                  type="number"
                  class="wte-input-full"
                  title="金額"
                  v-model="tmpOrder.price"
                />

                <WTEInput
                  type="number"
                  class="wte-input-full"
                  title="數量"
                  v-model="tmpOrder.amount"
                />
              </div>
            </div>

            <button
              @click="addOrder"
              :disabled="!isBasicInfoSaved"
              class="btn-dark-custom"
              style="margin-top: auto"
            >
              新增餐點
            </button>
          </section>
        </div>
      </section>

      <section class="lunch-group-orders-card">
        <div
          class="lunch-group-orders-card__header-row d-flex align-items-center justify-content-between"
        >
          <h4 class="lunch-group-orders-card__header">目前訂餐清單</h4>
          <span class="lunch-group-orders-card__count">{{ orders.length }} 筆訂單</span>
        </div>

        <div class="lunch-group-table-wrap">
          <table class="lunch-group-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>餐點</th>
                <th>金額</th>
                <th>數量</th>
                <th>小計</th>
                <th>備註</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody class="lunch-group-table__border-bottom">
              <tr v-for="order in orders" :key="order.id">
                <td class="lunch-group-table__name">{{ order.name }}</td>
                <td>{{ order.order }}</td>
                <td>${{ order.price }}</td>
                <td>{{ order.amount }}</td>
                <td class="lunch-group-table__subtotal">${{ order.price * order.amount }}</td>
                <td>{{ order.note }}</td>
                <td class="lunch-group-table__action">
                  <button @click="deleteOrder(order.id)" class="btn-delete-custom">刪除</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="lunch-group-total-row__note">
                  <div class="d-flex gap-3">
                    <span style="padding-left: 16px">品項合計 ${{ orderTotalPrice }}</span>
                    <span v-if="groupInfo.deliveryFee != 0"
                      >外送費 +${{ groupInfo.deliveryFee }}</span
                    >
                    <span v-if="groupInfo.discount != 0">折扣 −${{ groupInfo.discount }}</span>
                  </div>
                </td>
                <td class="lunch-group-total-row__amount">
                  ${{ orderTotalPrice + groupInfo.deliveryFee - groupInfo.discount }}
                </td>
                <td></td>
                <td class="lunch-group-table__action">
                  <button
                   :disabled="orders.length == 0"
                  class="btn-dark-small-custom"
                  @click="toCheck"
                  >前往結帳</button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>
