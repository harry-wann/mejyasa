import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import legacy from '@vitejs/plugin-legacy'

// 兩種輸出：
// - 一般 build（預設）：現代瀏覽器用 <script type="module">，給 LiveServer / Vercel 這種
//   走真正 http:// 的情境用，檔案小、載入快
// - offline build（BUILD_TARGET=offline）：關掉 module chunk，全部用舊式 <script>（SystemJS）
//   載入，因為瀏覽器對 file:// 開啟的頁面會擋掉 type="module" 的載入（CORS 限制），
//   只有非 module 的傳統 script 才能在雙擊打開 index.html 時正常運作
const isOfflineBuild = process.env.VITE_BUILD_TARGET === 'offline'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      renderModernChunks: !isOfflineBuild,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // offline build 用相對路徑，這樣不管 index.html 被放在哪個資料夾層級，
  // 或直接用 file:// 雙擊打開，資源路徑都抓得到；一般 build 維持絕對路徑（Vercel 用）
  base: isOfflineBuild ? './' : '/',
  build: {
    outDir: isOfflineBuild ? 'dist-offline' : 'dist',
  },
})
