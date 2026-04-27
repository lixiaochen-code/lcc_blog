import { createAlova } from 'alova'
import AdapterUniapp from '@alova/adapter-uniapp'
import VueHook from 'alova/vue'
import { getCurrentPlatform } from './platfrom'
import { useUserStore } from '@/store/user'

const getBaseURL = () => {
  return getCurrentPlatform() === 'h5' ? '/api' : import.meta.env.VITE_APP_SERVER_URL
}

let isRedirectingToLogin = false

export const alovaInst = createAlova({
  baseURL: getBaseURL(),
  ...AdapterUniapp(),
  statesHook: VueHook,
  cacheFor: null,
  responded: {
    onSuccess: async response => {
      if ('data' in response) {
        if (typeof response.data === 'object' && response.data !== null) {
          const res = response.data
          const status = (res as any).errno as number
          const message = (res as any).errmsg as string
          if (status === 501) {
            // 未登录或 token 过期，清除登录态并跳转登录页
            const pages = getCurrentPages()
            const curRoute = pages[pages.length - 1]?.route || ''
            if (!isRedirectingToLogin && curRoute !== 'pages/login/index') {
              isRedirectingToLogin = true
              const userStore = useUserStore()
              userStore.logout()
              uni.navigateTo({
                url: '/pages/login/index',
                complete: () => {
                  isRedirectingToLogin = false
                },
              })
            }
            return Promise.reject(response)
          }
          if (status !== 0) {
            uni.showToast({ title: message || '请求失败', icon: 'none' })
            return Promise.reject(response)
          }
          return (res as any).data
        }
        return response.data
      }
      return response
    },
    onError: err => {
      return Promise.reject(err)
    },
  },
  beforeRequest: method => {
    const userStore = useUserStore()
    if (getCurrentPlatform() === 'h5') {
      method.config.headers['wxUserId'] = userStore.userId || userStore.role
    }

    if (userStore.token) {
      method.config.headers['X-gxx-car-mall-token'] = userStore.token
    }
  },
})

export default alovaInst
