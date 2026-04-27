<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-white flex flex-col items-center justify-center px-[40rpx]">
      <view class="mb-[80rpx] flex flex-col items-center">
        <view
          class="w-[160rpx] h-[160rpx] bg-[#e8403a] rounded-[40rpx] flex items-center justify-center mb-[24rpx]"
        >
          <up-icon name="car" color="#fff" size="80"></up-icon>
        </view>
        <text class="text-[40rpx] font-700 text-[#222]">江小南洗车中心</text>
        <text class="text-[24rpx] text-[#999] mt-[12rpx]">欢迎使用，请先登录</text>
      </view>

      <view class="w-full flex flex-col gap-[32rpx]">
        <up-button
          type="success"
          size="large"
          shape="circle"
          text="微信一键登录"
          :custom-style="{ height: '100rpx', backgroundColor: '#07c160', border: 'none' }"
          @click="handleWechatLogin"
        ></up-button>
      </view>

      <view v-if="isDev" class="w-full mt-[56rpx] flex flex-col items-center">
        <up-button
          type="info"
          size="large"
          shape="circle"
          text="开发身份切换"
          :custom-style="{ height: '88rpx', backgroundColor: '#f5f5f5', border: 'none' }"
          @click="toggleDevRoles"
        ></up-button>

        <view v-if="showDevRoles" class="w-full mt-[24rpx] flex flex-col gap-[24rpx]">
          <up-button
            type="primary"
            size="large"
            shape="circle"
            text="我是车主 (C端)"
            :custom-style="{ height: '100rpx', backgroundColor: '#e8403a', border: 'none' }"
            @click="handleDevRoleClick(UserRole.CLIENT)"
          ></up-button>

          <up-button
            type="warning"
            size="large"
            shape="circle"
            text="我是店员 (B端)"
            :custom-style="{ height: '100rpx', backgroundColor: '#ff9900', border: 'none' }"
            @click="handleDevRoleClick(UserRole.STAFF)"
          ></up-button>

          <up-button
            type="error"
            size="large"
            shape="circle"
            text="我是管理员 (A端)"
            :custom-style="{ height: '100rpx', backgroundColor: '#2979ff', border: 'none' }"
            @click="handleDevRoleClick(UserRole.MANAGER)"
          ></up-button>
        </view>

        <text class="mt-[20rpx] text-[22rpx] text-[#ccc]">仅开发环境可见</text>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onBackPress } from '@dcloudio/uni-app'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { loginByWeixin } from '@/api/AccountManagement'
  import { useUserStore, UserRole } from '@/store/user'
  import type { WxLoginInfo } from '@/api/AccountManagement/interfaces'

  // 拦截系统级返回（手势滑动、物理返回键），跳转到对应首页
  onBackPress(() => {
    const userStore = useUserStore()
    let homeUrl = '/pages/client/home/index'
    if (userStore.role === UserRole.MANAGER) {
      homeUrl = '/pages/manager/home/index'
    } else if (userStore.role === UserRole.STAFF) {
      homeUrl = '/pages/staff/home/index'
    }
    uni.reLaunch({ url: homeUrl })
    return true // 阻止默认返回行为
  })

  const isDev = import.meta.env.VITE_APP_ON_DEV === 'true'
  console.log(isDev, 'isDev')
  const userStore = useUserStore()
  const showDevRoles = ref(false)

  const toggleDevRoles = (): void => {
    showDevRoles.value = !showDevRoles.value
  }

  const handleLogin = (role: UserRole): void => {
    // 设置身份
    userStore.setRole(role)

    // 根据身份跳转到对应主包首页
    let url = ''
    switch (role) {
      case UserRole.CLIENT:
        url = '/pages/client/home/index'
        break
      case UserRole.STAFF:
        url = '/pages/staff/home/index'
        break
      case UserRole.MANAGER:
        url = '/pages/manager/home/index'
        break
    }

    if (url) {
      uni.reLaunch({
        url,
        success: () => {
          uni.showToast({
            title: `以${role === UserRole.CLIENT ? '车主' : role === UserRole.STAFF ? '店员' : '管理员'}身份登录`,
            icon: 'none',
          })
        },
      })
    }
  }

  const handleDevRoleClick = (role: UserRole): void => {
    showDevRoles.value = false
    handleLogin(role)
  }

  const getLoginCode = async (): Promise<UniApp.LoginRes> => {
    return await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: res => resolve(res),
        fail: err => reject(err),
      })
    })
  }

  const handleWechatLogin = async (): Promise<void> => {
    try {
      uni.showLoading({ title: '登录中' })

      const loginRes = await getLoginCode()
      if (!loginRes.code) {
        throw new Error('未获取到微信登录 code')
      }

      const payload: WxLoginInfo = {
        code: loginRes.code,
        userInfo: {
          ...(userStore.referrerUserId ? { referrerUserId: userStore.referrerUserId } : {}),
        },
      }
      const res = await loginByWeixin(payload)
      // 登录成功后清除 referrerUserId
      userStore.setReferrerUserId(null)
      console.log(res, 'res')
      const loginData = res as any
      if (loginData?.token) userStore.setToken(loginData.token)
      if (loginData?.userData?.id) userStore.setUserId(loginData.userData.id)
      if (loginData?.userData)
        userStore.setUserData({
          ...loginData.userData,
          ...(loginData.userInfo ? loginData.userInfo : {}),
        })
      if (loginData?.staffInfo) {
        userStore.setStaffInfo(loginData.staffInfo)
        if (loginData?.storeInfo) userStore.setStoreInfo(loginData.storeInfo)
        // role 字段包含 "2" 表示店长，否则为店员
        const roles = String(loginData.staffInfo.role).split(',')
        if (roles.includes('2')) {
          userStore.setRole(UserRole.MANAGER)
          uni.reLaunch({
            url: '/pages/manager/home/index',
            success: () => {
              uni.showToast({ title: '微信登录成功', icon: 'none' })
            },
          })
        } else {
          userStore.setRole(UserRole.STAFF)
          uni.reLaunch({
            url: '/pages/staff/home/index',
            success: () => {
              uni.showToast({ title: '微信登录成功', icon: 'none' })
            },
          })
        }
      } else {
        userStore.setRole(UserRole.CLIENT)
        // 仅客户端需要检查授权信息
        if (!userStore.userData.mobile) {
          console.log('设置 needAuthCheck 为 true')
          userStore.setNeedAuthCheck(true)
        }
        uni.reLaunch({
          url: '/pages/client/home/index',
          success: () => {
            uni.showToast({ title: '微信登录成功', icon: 'none' })
          },
        })
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      uni.showToast({ title: '微信登录失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
</script>
