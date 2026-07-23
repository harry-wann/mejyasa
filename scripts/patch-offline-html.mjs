// build:offline 之後執行：把 index.html 裡「判斷瀏覽器支不支援 module，
// 決定要不要載入 legacy」的偵測邏輯拿掉，強制永遠走 legacy（非 module）那份
// bundle，因為 file:// 底下 Chrome 一律禁止載入 module script，就算瀏覽器
// 支援 module 語法也一樣會被擋、不會自動 fallback 到 nomodule。
// CSS 的 <link rel="stylesheet"> 標籤不受影響，維持原樣。

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const distIndexPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist-offline/index.html',
)

let html = readFileSync(distIndexPath, 'utf-8')

// 拿掉 modern 版的 <script type="module" ...> entry
html = html.replace(/<script type="module" crossorigin src="[^"]*"><\/script>\s*/, '')

// 拿掉「偵測是不是現代瀏覽器」跟「不是的話才載入 legacy」這兩段 inline script
html = html.replace(/<script type="module">[\s\S]*?<\/script>\s*/g, '')

// polyfill / legacy entry 原本掛 nomodule（只有「不支援 module」的瀏覽器才會執行），
// 拿掉 nomodule，讓它不管什麼瀏覽器都無條件執行
html = html.replace(/\snomodule/g, '')

// crossorigin 屬性不管是不是 module，都會讓瀏覽器改用 CORS 模式抓取資源，
// file:// 底下一樣會被擋，跟 module 是同一類問題，一併拿掉
html = html.replace(/\scrossorigin/g, '')

writeFileSync(distIndexPath, html)
console.log('已修正 dist-offline/index.html：強制走 legacy bundle，不再偵測瀏覽器')
