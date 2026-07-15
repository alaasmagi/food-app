import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import WheelView from '../views/WheelView.vue'
import SettingsView from '../views/SettingsView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Route is reachable without authentication. */
    public?: boolean
  }
}

/**
 * Navigation guard: for protected routes, silently attempt a token exchange when
 * the store is not authenticated, then allow entry if authenticated or redirect to
 * the in-app login view otherwise. Public routes always pass.
 */
export async function authGuard(to: RouteLocationNormalized) {
  if (to.meta.public) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    await auth.fetchToken()
  }

  return auth.isAuthenticated ? true : { name: 'login' as const }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/wheel', name: 'wheel', component: WheelView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

router.beforeEach(authGuard)
