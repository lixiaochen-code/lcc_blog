import type { App } from 'vue'

const list = import.meta.glob('./**/*.ts', {
  eager: true,
  import: 'default',
})

/**
 * 安装vue插件或者启用某一些方法
 */
export default (app: App) => {
  for (let i in list) {
    const item = list[i]
    if (typeof item === 'function') {
      item(app)
    }
  }
}
