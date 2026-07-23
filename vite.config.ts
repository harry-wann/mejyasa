import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import legacy from '@vitejs/plugin-legacy'

// 兩種輸出：
// - 一般 build（預設）：現代瀏覽器用 <script type="module">，給 LiveServer / Vercel 這種
//   走真正 http:// 的情境用
// - offline build（VITE_BUILD_TARGET=offline）：base 用相對路徑、輸出到獨立的
//   dist-offline 資料夾（不會跟 dist 互相覆蓋，兩份可以同時保留）。legacy plugin 的
//   兩份 bundle（modern + legacy）都留著——renderModernChunks 設 false 雖然可以讓
//   Chrome 不去嘗試載入 module，但會連 CSS 的 <link> 一起弄丟，是這個選項本身的限制。
//   改用 build 完後的 scripts/patch-offline-html.mjs 把 index.html 裡「判斷瀏覽器
//   支不支援 module」的偵測邏輯整段拿掉，強制永遠走 legacy（非 module）bundle，
//   同時拿掉 crossorigin（一樣會讓瀏覽器改用 CORS 模式抓取，file:// 底下同樣被擋）。
//   CSS 的 <link> 完全不受這些調整影響。
const isOfflineBuild = process.env.VITE_BUILD_TARGET === 'offline'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    ...(isOfflineBuild ? [legacy({ targets: ['defaults', 'not IE 11'] })] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: isOfflineBuild ? './' : '/',
  build: {
    outDir: isOfflineBuild ? 'dist-offline' : 'dist',
  },
})
