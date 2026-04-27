import { createSSRApp } from 'vue'
import App from './App.vue'
import uviewPlus from 'uview-plus'
import * as Pinia from 'pinia'
import 'virtual:uno.css'
/**
 * 运行插件
 */
import pluginsInstall from './plugins/index'

export function createApp() {
  const app = createSSRApp(App)
  app.use(uviewPlus)
  pluginsInstall(app)
  return {
    app,
    Pinia,
  }
}
