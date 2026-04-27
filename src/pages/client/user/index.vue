<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-[#f6f6f6] pb-120rpx">
      <!-- 用户信息头部 -->
      <view class="bg-[#d63b35] px-24rpx pb-80rpx pt-30rpx text-white">
        <view class="flex items-center justify-between">
          <view v-if="displayUser" class="flex items-center gap-16rpx">
            <image
              class="border-4rpx h-96rpx w-96rpx rounded-full border-[rgba(255,255,255,0.6)]"
              :src="displayUser.avatar || defaultAvatar"
              mode="aspectFill"
            ></image>
            <view class="flex flex-col gap-8rpx">
              <text class="text-32rpx font-600">{{ displayUser.nickname }}</text>
              <view class="flex items-center gap-12rpx">
                <text class="bg-[#f5a623] rounded-18rpx px-16rpx py-4rpx text-22rpx text-white">
                  {{ userLevelText }}
                </text>
                <text v-if="displayUser.mobile" class="text-[#ffe7e7] text-24rpx">
                  {{ maskMobile(displayUser.mobile) }}
                </text>
              </view>
            </view>
          </view>
          <view v-else class="flex items-center gap-16rpx" @click="handleWechatLogin">
            <view
              class="border-4rpx h-96rpx w-96rpx rounded-full border-[rgba(255,255,255,0.6)] bg-[rgba(255,255,255,0.2)] flex items-center justify-center"
            >
              <up-icon name="account" size="48" color="#fff"></up-icon>
            </view>
            <view class="flex flex-col gap-8rpx">
              <text class="text-32rpx font-600">点击登录</text>
              <text class="text-24rpx text-[#ffe7e7]">登录后享受更多服务</text>
            </view>
          </view>
          <view v-if="displayUser" class="flex items-center gap-16rpx">
            <view @click="handleShowQrCode">
              <up-icon name="share-square" color="#fff" size="24"></up-icon>
            </view>
            <view @click="handleProfile">
              <up-icon name="setting" color="#fff" size="24"></up-icon>
            </view>
          </view>
        </view>
      </view>

      <!-- 我的车辆 -->
      <view class="bg-white mx-24rpx mb-20rpx mt-[-60rpx] rounded-16rpx p-20rpx">
        <view class="mb-16rpx flex items-center justify-between" @click="handleCarManage">
          <text class="text-[#222] text-28rpx font-600">我的车辆</text>
          <view class="text-[#999] text-24rpx flex items-center gap-4rpx">
            <text>管理</text>
            <up-icon name="arrow-right" size="12" color="#999"></up-icon>
          </view>
        </view>
        <view v-if="defaultVehicle" class="flex items-center gap-16rpx">
          <view
            class="bg-[#e8403a] h-72rpx w-72rpx flex items-center justify-center rounded-16rpx overflow-hidden"
          >
            <image
              v-if="defaultVehicle.coverUrl"
              :src="defaultVehicle.coverUrl"
              class="w-full h-full object-cover"
              mode="aspectFill"
            />
            <up-icon v-else name="car" size="40" color="#fff"></up-icon>
          </view>
          <view class="flex-1 flex flex-col gap-6rpx">
            <text class="text-[#222] text-28rpx"
              >{{ defaultVehicle.brand }} {{ defaultVehicle.model }}</text
            >
            <text class="text-[#888] text-24rpx">{{ defaultVehicle.licensePlate }}</text>
          </view>
          <text
            v-if="defaultVehicle.isDefault"
            class="border-[#1c7dff] text-[#1c7dff] border-2rpx rounded-12rpx px-12rpx py-4rpx text-22rpx"
            >默认</text
          >
        </view>
        <view v-else class="flex items-center justify-center py-[20rpx]" @click="handleAddVehicle">
          <text class="text-[28rpx] text-[#999]">暂无车辆，去添加</text>
          <up-icon name="arrow-right" size="14" color="#999"></up-icon>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="bg-white mx-24rpx mb-20rpx rounded-16rpx p-20rpx">
        <view class="grid grid-cols-4 gap-y-20rpx">
          <view
            v-for="(item, index) in menuList"
            :key="index"
            class="flex flex-col items-center gap-8rpx"
            @click="handleMenuClick(item)"
          >
            <view
              class="bg-[#fff5f5] h-76rpx w-76rpx flex items-center justify-center rounded-18rpx"
            >
              <up-icon :name="item.icon" size="40" color="#e8403a"></up-icon>
            </view>
            <text class="text-[#333] text-24rpx">{{ item.text }}</text>
          </view>
        </view>
      </view>

      <!-- 设置区域 -->
      <view class="bg-white mx-24rpx rounded-16rpx">
        <up-cell-group :border="false">
          <up-cell title="个人信息" :border="false" is-link @click="handleProfile">
            <template #icon>
              <view class="mr-16rpx flex items-center">
                <up-icon name="account" size="20" color="#e8403a"></up-icon>
              </view>
            </template>
          </up-cell>
        </up-cell-group>
      </view>

      <!-- 退出登录 -->
      <view v-if="displayUser" class="mx-24rpx mt-20rpx">
        <up-button
          type="error"
          shape="circle"
          plain
          text="退出登录"
          color="#e8403a"
          @click="handleLogout"
        ></up-button>
      </view>

      <ShareQrPopup :show="showQrPopup" :qr-code-url="qrCodeUrl" @close="showQrPopup = false" />
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import ShareQrPopup from '@/components/ShareQrPopup/index.vue'
  import { ref, computed } from 'vue'
  import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
  import { findDefault } from '@/api/UserVehicleService'
  import { getStaffQrCode, getUserInfo } from '@/api/MemberService'
  import { loginByWeixin, logout as logoutApi } from '@/api/AccountManagement'
  import type { WxLoginInfo } from '@/api/AccountManagement/interfaces'
  import { useUserStore } from '@/store/user'
  import { getMallPhone } from '@/api/SystemConfiguration'
  import type { CarUserVehicles } from '@/api/UserVehicleService/interfaces'
  import type { MallUser } from '@/api/MemberService/interfaces'

  const defaultAvatar = 'https://cdn.uviewui.com/uview/album/1.jpg'
  const userStore = useUserStore()

  // ========== 用户信息 ==========
  const userInfo = ref<MallUser | null>(null)
  const defaultVehicle = ref<CarUserVehicles | null>(null)
  const mallPhone = ref('')
  const showQrPopup = ref(false)
  const qrCodeUrl = ref('')

  // H5 测试环境可能通过测试 header 注入登录态，不一定有本地 token。
  // 只要接口拿到用户信息，就按已登录处理。
  const displayUser = computed(() => {
    if (userInfo.value) return userInfo.value
    if (userStore.userData) return userStore.userData
    return null
  })

  const userLevelText = computed(() => {
    const level = displayUser.value?.userLevel
    switch (level) {
      case 1:
        return 'VIP会员'
      case 2:
        return '超级VIP'
      default:
        return '普通用户'
    }
  })

  const maskMobile = (mobile: string) => {
    if (mobile.length >= 11) {
      return mobile.slice(0, 3) + '****' + mobile.slice(7)
    }
    return mobile
  }

  // ========== 菜单配置 ==========
  type MenuItem = {
    text: string
    icon: string
    path?: string
    action?: string
  }

  const menuList = ref<MenuItem[]>([
    { text: '我的订单', icon: 'list', path: '/pages/client/order/index' },
    { text: '附近门店', icon: 'map', path: '/pages_client/pages/store/list/index' },
    { text: '收藏', icon: 'star', path: '/pages_client/pages/user/collect/index' },
    { text: '评价', icon: 'edit-pen', path: '/pages_client/pages/record/index' },
    { text: '客服', icon: 'kefu-ermai', action: 'callService' },
    // { text: '帮助', icon: 'question-circle', action: 'help' },
    { text: '关于', icon: 'info-circle', action: 'about' },
  ])

  // ========== 菜单点击 ==========
  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
      // 订单页是 tabBar 页面，需要用 switchTab
      if (item.path.startsWith('/pages/client/')) {
        uni.switchTab({ url: item.path })
      } else {
        uni.navigateTo({ url: item.path })
      }
      return
    }

    switch (item.action) {
      case 'callService':
        if (!mallPhone.value) {
          uni.showToast({ title: '暂无客服电话', icon: 'none' })
          return
        }
        uni.makePhoneCall({
          phoneNumber: mallPhone.value,
          fail: () => {
            uni.showToast({ title: '拨号取消', icon: 'none' })
          },
        })
        break
      case 'help':
        uni.showToast({ title: '功能开发中', icon: 'none' })
        break
      case 'about':
        uni.showModal({
          title: '关于我们',
          content: '易捷养车 v1.0.0\n专注汽车服务，让养车更简单',
          showCancel: false,
          confirmText: '知道了',
        })
        break
      default:
        uni.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  const handleProfile = () => {
    uni.navigateTo({ url: '/pages_client/pages/user/profile/index' })
  }

  const handleShowQrCode = async () => {
    showQrPopup.value = true
    qrCodeUrl.value = ''
    try {
      const res = await getStaffQrCode()
      qrCodeUrl.value = typeof res === 'string' ? res : ((res as any)?.url ?? '')
    } catch (err) {
      console.error('获取二维码失败:', err)
      uni.showToast({ title: '获取二维码失败', icon: 'none' })
      showQrPopup.value = false
    }
  }

  const handleLogout = () => {
    uni.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async modalRes => {
        if (modalRes.confirm) {
          try {
            await logoutApi({ userId: userStore.userId })
          } catch (e) {
            console.error('退出登录接口调用失败:', e)
          }
          userStore.logout()
          userInfo.value = null
          defaultVehicle.value = null
          uni.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  // ========== 车辆管理 ==========
  const handleCarManage = () => {
    uni.navigateTo({ url: '/pages_client/pages/user/vehicle/list/index' })
  }

  const handleAddVehicle = () => {
    uni.navigateTo({ url: '/pages_client/pages/user/vehicle/edit/index' })
  }

  // ========== 一键登录 ==========
  const handleWechatLogin = async () => {
    try {
      uni.showLoading({ title: '登录中' })

      // getUserProfile 必须在用户点击事件同步调用链中
      let profile: UniApp.GetUserProfileRes | null = null
      if (uni.getUserProfile) {
        profile = await new Promise(resolve => {
          uni.getUserProfile({
            desc: '用于完善会员资料',
            success: res => resolve(res),
            fail: () => resolve(null),
          })
        })
      }

      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: res => resolve(res),
          fail: err => reject(err),
        })
      })
      if (!loginRes.code) throw new Error('未获取到微信登录 code')

      const payload: WxLoginInfo = { code: loginRes.code }
      if (profile?.userInfo) payload.userInfo = profile.userInfo

      await loginByWeixin(payload).then((res: any) => {
        if (res?.token) userStore.setToken(res.token)
        if (res?.userData?.id) userStore.setUserId(res.userData.id)
        if (res?.userData) userStore.setUserData(res.userData)
      })
      uni.showToast({ title: '登录成功', icon: 'success' })
      fetchUserInfo()
      fetchDefaultVehicle()
    } catch (e) {
      console.error('微信登录失败:', e)
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }

  // ========== 数据加载 ==========
  const fetchUserInfo = async () => {
    try {
      const method = getUserInfo()
      method.config.cacheFor = 0
      const res = await method
      userInfo.value = res || null
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  }

  const fetchDefaultVehicle = async () => {
    try {
      const method = findDefault()
      method.config.cacheFor = 0
      const res = await method
      defaultVehicle.value = res || null
    } catch (e) {
      console.error('获取默认车辆失败', e)
    }
  }

  const fetchMallPhone = async () => {
    try {
      const res = await getMallPhone()
      if (res) mallPhone.value = String(res)
    } catch (e) {
      console.error('获取客服电话失败', e)
    }
  }

  onShow(() => {
    fetchUserInfo()
    fetchDefaultVehicle()
    fetchMallPhone()
  })

  onShareAppMessage(() => ({
    title: '汽车服务，就选我们',
    path: `/pages/client/home/index?referrerUserId=${userStore.userId}`,
    imageUrl: displayUser.value?.avatar || defaultAvatar,
  }))
</script>
