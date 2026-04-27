import { UserRole, useUserStore } from '@/store/user'

const goFunc = ['switchTab', 'navigateTo', 'redirectTo', 'reLaunch', 'navigateBack']

const isLogined = () => {
  // 登陆
  return false
}

export default () => {
  goFunc.forEach((name: string) => {
    uni.addInterceptor(name, {
      invoke({ url }: { url: string }) {
        // --- 处理返回逻辑 ---
        if (name === 'navigateBack') {
          const pages = getCurrentPages()
          const curRoute = pages[pages.length - 1]?.route || ''

          // 在登录页点返回：未登录则跳客户端首页，已登录则按角色跳首页
          if (curRoute === 'pages/login/index') {
            const userStore = useUserStore()
            let homeUrl = '/pages/client/home/index'
            if (userStore.role === UserRole.MANAGER) {
              homeUrl = '/pages/manager/home/index'
            } else if (userStore.role === UserRole.STAFF) {
              homeUrl = '/pages/staff/home/index'
            }
            uni.reLaunch({ url: homeUrl })
            return false
          }

          if (pages.length <= 1) {
            const userStore = useUserStore()
            // 栈内没有页面了，直接去首页
            uni.reLaunch({
              url:
                userStore.role === UserRole.CLIENT
                  ? '/pages/client/home/index'
                  : '/pages/staff/home/index',
            })
            return false // 拦截原生的 navigateBack
          }
          return true
        }
        const path = url?.split('?')?.[0]
        let needLoginPages: string[] = []
        // 为了防止开发时出现BUG，这里每次都获取一下。生产环境可以移到函数外，性能更好
        if (!import.meta.env.DEV) {
          console.log('生产环境')
        }
        const isNeedLogin = needLoginPages.includes(path)
        if (!isNeedLogin || isLogined()) {
          return true
        }
        // uni.navigateTo({ url: login })
        return false
      },
    })
  })
}
