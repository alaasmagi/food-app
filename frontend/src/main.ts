import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'leaflet/dist/leaflet.css'
import './assets/tokens/styles.css'
import App from './App.vue'
import { router } from './router'
import { initKeycloak } from './auth/keycloak'

// Resolve the Keycloak session before mounting so the first route guard sees a settled auth state.
async function bootstrap(): Promise<void> {
  await initKeycloak()
  createApp(App).use(createPinia()).use(router).mount('#app')
}

void bootstrap()
