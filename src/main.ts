import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/css/base.css'
import './assets/css/layout.css'
import './assets/css/components.css'
import './assets/css/pages/home.css'
import './assets/css/pages/wheel.css'
import './assets/css/pages/lunch-group.css'
import './assets/css/pages/split-result.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')