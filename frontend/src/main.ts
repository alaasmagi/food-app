import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'leaflet/dist/leaflet.css'
import './assets/tokens/styles.css'
import App from './App.vue'
import { router } from './router'
import { initKeycloak } from './auth/keycloak'

// Resolve the Keycloak session (silent check-sso) before mounting so the first
// route guard sees a settled auth state. A failed check degrades to unauthenticated.
async function bootstrap(): Promise<void> {
  await initKeycloak()
  createApp(App).use(createPinia()).use(router).mount('#app')
}

void bootstrap()
