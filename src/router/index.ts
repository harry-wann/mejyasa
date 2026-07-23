import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import WheelView from '@/views/WheelView.vue'
import LunchGroupView from '@/views/LunchGroupView.vue'
import SplitResultView from '@/views/SplitResultView.vue'

// offline build（file:// 雙擊打開）不能用 createWebHistory：
// history.pushState 在 file:// 這種「null origin」底下換路徑會直接丟 SecurityError，
// 所以 offline build 要改用 hash 模式（網址帶 #），才能在雙擊打開時正常切換頁面
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
