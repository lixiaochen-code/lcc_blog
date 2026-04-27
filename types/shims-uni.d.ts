/// <reference types='@dcloudio/types' />
/// <reference types='uview-plus/types' />
/// <reference types='@uni-helper/uni-app-types' />
/// <reference types='miniprogram-api-typings' />
import 'vue'

declare module '@vue/runtime-core' {
  type Hooks = App.AppInstance & Page.PageInstance

  interface ComponentCustomOptions extends Hooks {}
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}
