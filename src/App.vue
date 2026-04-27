<script setup lang="ts">
  import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
  import { getLocation } from '@/api/Location'
  import { getAutoLocation } from '@/utils/location'
  import { useUserStore, UserRole } from './store/user'
  import { useCategoryStore } from './store/category'
  import { watch } from 'vue'
  const userStore = useUserStore()
  const categoryStore = useCategoryStore()
  let scanHandledInLaunch = false

  // 处理扫码参数的通用函数，onLaunch 和 onShow 都需要处理
  const handleScanParams = (options: any): boolean => {
    console.log('handleScanParams options', options)
    const scene = options?.query?.scene
    if (!scene) return false

    const queryStr = decodeURIComponent(scene)
    console.log('scene', scene, 'queryStr', queryStr)
    const sceneQuery: Record<string, string> = {}
    queryStr.split('&').forEach(pair => {
      const [key, val] = pair.split('=')
      if (key) sceneQuery[key] = val || ''
    })
    const orderSn = sceneQuery['orderSn']
    const referrerUserId = sceneQuery['referrerUserId']
    console.log('Parsed scene query:', referrerUserId, orderSn)

    if (orderSn) {
      categoryStore.setScene(orderSn)
      if (userStore.token) {
        // 先根据角色跳转到对应首页，再打开订单详情，确保返回时回到正确的首页
        const homeMap: Record<string, string> = {
          [UserRole.STAFF]: '/pages/staff/home/index',
          [UserRole.MANAGER]: '/pages/manager/home/index',
        }
        const homeUrl = homeMap[userStore.role] || '/pages/client/home/index'
        uni.reLaunch({
          url: homeUrl,
          success: () => {
            setTimeout(() => {
              uni.navigateTo({ url: '/pages_client/pages/order/detail/index?orderSn=' + orderSn })
            }, 300)
          },
        })
      } else {
        uni.reLaunch({ url: '/pages/login/index' })
      }
      return true
    }

    if (referrerUserId) {
      if (!userStore.token) {
        userStore.setReferrerUserId(Number(referrerUserId))
        uni.reLaunch({ url: '/pages/login/index' })
        return true
      }
    }

    return false
  }

  onLaunch((options: any) => {
    console.log('onLaunch options', options)

    if (handleScanParams(options)) {
      scanHandledInLaunch = true
      return
    }

    // 已登录且非客户端角色，跳转到对应身份首页
    if (userStore.token && userStore.role) {
      const roleHomeMap: Record<string, string> = {
        [UserRole.STAFF]: '/pages/staff/home/index',
        [UserRole.MANAGER]: '/pages/manager/home/index',
      }
      const targetUrl = roleHomeMap[userStore.role]
      if (targetUrl) {
        uni.reLaunch({ url: targetUrl })
      }
    }

    // 获取位置并逆地理编码得到城市名
    getAutoLocation()
      .then(({ lat, lng }) => {
        userStore.setLocation({ lat, lng })
        return getLocation(lat, lng)
      })
      .then(res => {
        userStore.setCity(res.address)
      })
      .catch(err => {
        console.error('App 获取位置失败:', err)
      })
  })

  onShow((options: any) => {
    console.log('onShow options', options)
    // onLaunch 之后 onShow 会自动触发一次，跳过避免重复处理
    if (scanHandledInLaunch) {
      scanHandledInLaunch = false
      return
    }
    // 小程序从后台恢复时 onLaunch 不会再次触发，需在 onShow 中处理扫码参数
    handleScanParams(options)
  })

  onHide(() => {
    console.log('App Hide')
  })

  watch(
    () => userStore.token,
    newVal => {
      if (newVal && categoryStore.scene) {
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages_client/pages/order/detail/index?orderSn=${categoryStore.scene}`,
          })
          categoryStore.clearScene()
        }, 1500)
      }
    }
  )
</script>
<style lang="scss">
  @import 'uview-plus/index.scss';
</style>
