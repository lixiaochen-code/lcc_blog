/// <reference types="vite/client" />

declare module '*.vue' {
  import { type DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}

interface ImportMetaEnv {
  /** 应用服务器地址 */
  readonly VITE_APP_SERVER_URL: string
  /** 是否开启DEV功能 */
  readonly VITE_APP_ON_DEV: string
  /** 腾讯地图开发密钥 */
  readonly VITE_APP_LOCATION_KEY: string
  /** 腾讯地图API地址 */
  readonly VITE_APP_LOCATION_URL: string
}
