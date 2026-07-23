import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import WheelView from '@/views/WheelView.vue'
import LunchGroupView from '@/views/LunchGroupView.vue'
import SplitResultView from '@/views/SplitResultView.vue'

// 雙擊 index.html（file://）打開時，沒有真正的伺服器路徑可以比對，
// history.pushState 在 file:// 這種 null origin 底下換路徑也會直接丟 SecurityError，
// 乾淨網址的 history 模式沒辦法用，要改用 hash 模式（網址帶 #）
const isOfflineBuild = import.meta.env.VITE_BUILD_TARGET === 'offline'

const router = createRouter({
  history: isOfflineBuild ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  linkExactActiveClass: 'is-active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/wheel',
      name: 'wheel',
      component: WheelView
    },
    {
      path: '/lunch-group',
      name: 'lunch-group',
      component: LunchGroupView
    },
    {
      path: '/split-result',
      name: 'split-result',
      component: SplitResultView
    }
  ],
})

export default router
