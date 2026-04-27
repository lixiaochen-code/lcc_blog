import { createPinia } from 'pinia'
import type { App } from 'vue'

import { createPersistedState } from 'pinia-plugin-persistedstate'

const install = (app: App) => {
  const pinia = createPinia()
  pinia.use(
    createPersistedState({
      key: key => `car_service_v1.0.0_${key}`,
      storage: {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, value: string) => uni.setStorageSync(key, value),
      },
    })
  )
  app.use(pinia)
  return pinia
}

export default install
