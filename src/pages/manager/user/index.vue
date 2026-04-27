<template>
  <DefaultLayout :loading="loading">
    <view class="min-h-100vh bg-[#f6f6f6] pb-[120rpx]">
      <!-- Header -->
      <view
        class="bg-[#e8403a] pt-[120rpx] pb-[100rpx] px-[40rpx] flex items-center gap-[24rpx] relative overflow-hidden"
      >
        <!-- Background Logo Watermark -->
        <view class="absolute right-[-40rpx] top-[40rpx] opacity-10">
          <up-icon name="car" color="#fff" size="300"></up-icon>
        </view>

        <view @click="goProfile">
          <up-avatar
            :src="userStore.staffInfo?.avatarUrl || 'https://cdn.uviewui.com/uview/album/1.jpg'"
            :size="100"
            border-color="#fff"
            :border-width="2"
          ></up-avatar>
        </view>
        <view class="flex-1 text-white z-10" @click="goProfile">
          <view class="text-[36rpx] font-700 mb-[8rpx]">{{
            userStore.staffInfo?.name || '店长'
          }}</view>
          <view v-if="userStore.staffInfo?.desc" class="text-[24rpx] opacity-90">{{
            userStore.staffInfo.desc
          }}</view>
          <view v-else class="text-[24rpx] opacity-90">欢迎使用汽车服务系统</view>
          <view v-if="userStore.staffInfo?.phone" class="text-[22rpx] opacity-80 mt-[4rpx]">{{
            userStore.staffInfo.phone
          }}</view>
        </view>
        <view class="flex items-center gap-[16rpx] z-10">
          <view v-if="isDev" @click="handleScanCode">
            <up-icon name="scan" color="#fff" size="24"></up-icon>
          </view>
          <view @click="handleShowQrCode">
            <up-icon name="share-square" color="#fff" size="24"></up-icon>
          </view>
          <view @click="goProfile">
            <up-icon name="setting" color="#fff" size="24"></up-icon>
          </view>
        </view>
      </view>

      <!-- Stats Cards -->
      <view class="px-[24rpx] mt-[-60rpx] flex flex-col gap-[32rpx] z-20 relative">
        <!-- Today's Stats -->
        <view class="bg-white rounded-[16rpx] p-[32rpx] shadow-sm">
          <view class="text-[30rpx] font-600 text-[#222] mb-[32rpx]">今日工作统计</view>
          <view class="flex justify-between items-center">
            <view
              v-for="(item, index) in todayStats"
              :key="item.name"
              class="flex flex-col items-center flex-1"
              :class="{ 'border-x border-[#f2f2f2]': index === 1 }"
            >
              <text class="text-[40rpx] font-700 text-[#e8403a] mb-[12rpx]">{{
                item.number ?? 0
              }}</text>
              <text class="text-[24rpx] text-[#999]">{{ item.name }}</text>
            </view>
          </view>
        </view>

        <!-- Total Stats -->
        <view class="bg-white rounded-[16rpx] p-[32rpx] shadow-sm">
          <view class="text-[30rpx] font-600 text-[#222] mb-[32rpx]">累计统计</view>
          <view class="flex justify-between items-center">
            <view
              v-for="(item, index) in totalStats"
              :key="item.name"
              class="flex flex-col items-center flex-1"
              :class="{ 'border-x border-[#f2f2f2]': index === 1 }"
            >
              <text class="text-[40rpx] font-700 text-[#e8403a] mb-[12rpx]">{{
                item.number ?? 0
              }}</text>
              <text class="text-[24rpx] text-[#999]">{{ item.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 退出登录按钮 -->
      <view class="px-[24rpx] mt-[48rpx]">
        <up-button
          type="error"
          plain
          shape="circle"
          text="退出登录"
          :custom-style="{ height: '88rpx', fontSize: '30rpx' }"
          @click="handleLogout"
        ></up-button>
      </view>

      <!-- 二维码分享弹窗 -->
      <up-popup
        :show="showQrPopup"
        mode="center"
        :round="16"
        :closeable="true"
        @close="showQrPopup = false"
      >
        <view
          v-if="showQrPopup"
          class="w-[560rpx] px-[40rpx] pt-[60rpx] pb-[40rpx] flex flex-col items-center"
        >
          <text class="text-[32rpx] font-700 text-[#222] mb-[24rpx]">我的二维码</text>
          <image
            v-if="qrCodeUrl"
            :src="qrCodeUrl"
            class="w-[400rpx] h-[400rpx] mb-[32rpx]"
            mode="aspectFit"
          />
          <view v-else class="w-[400rpx] h-[400rpx] mb-[32rpx] flex items-center justify-center">
            <up-loading-icon :size="40"></up-loading-icon>
          </view>
          <button class="share-btn" open-type="share" :disabled="!qrCodeUrl">
            <up-button
              type="error"
              shape="circle"
              text="分享给好友"
              color="#e8403a"
              custom-style="width: 400rpx"
              :disabled="!qrCodeUrl"
            ></up-button>
          </button>
          <up-button
            type="error"
            plain
            shape="circle"
            text="查看图片"
            color="#e8403a"
            custom-style="width: 400rpx; margin-top: 20rpx"
            :disabled="!qrCodeUrl"
            @click="uni.previewImage({ urls: [qrCodeUrl], current: qrCodeUrl })"
          ></up-button>
        </view>
      </up-popup>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { getStaffMine } from '@/api/OrderService'
  import { getStaffQrCode } from '@/api/MemberService'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { computed, ref } from 'vue'
  import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
  import { useRequest } from 'alova/client'
  import type { StaffMineResponse, StaffMineStatItem } from '@/api/OrderService/interfaces'
  import { useUserStore } from '@/store/user'
  import { logout as logoutApi } from '@/api/AccountManagement'

  const userStore = useUserStore()
  const isDev = import.meta.env.VITE_APP_ON_DEV === 'true'

  const mineData = ref<StaffMineResponse>()

  const todayStats = computed<StaffMineStatItem[]>(
    () =>
      mineData.value?.today ?? [
        { number: 0, name: '订单数' },
        { number: 0, name: '总金额' },
        { number: 0, name: '评分' },
      ]
  )

  const totalStats = computed<StaffMineStatItem[]>(
    () =>
      mineData.value?.toDoCount ?? [
        { number: 0, name: '订单数' },
        { number: 0, name: '总金额' },
        { number: 0, name: '评分' },
      ]
  )

  const { loading, send: fetchMine } = useRequest(() => getStaffMine({}), {
    immediate: false,
  })

  const loadMineData = async () => {
    try {
      const res = await fetchMine()
      mineData.value = res as unknown as StaffMineResponse
    } catch (err) {
      console.error('获取我的数据失败:', err)
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  onShow(() => {
    loadMineData()
  })

  const goProfile = () => {
    uni.navigateTo({ url: '/pages_manager/pages/profile/index' })
  }

  // ========== 扫码测试 ==========
  const handleScanCode = () => {
    uni.scanCode({
      onlyFromCamera: false,
      success: res => {
        console.log('===== 扫码结果 =====')
        console.log('result:', res.result)
        console.log('scanType:', res.scanType)
        console.log('charSet:', res.charSet)
        console.log('path:', res.path)
        console.log('rawData:', res.rawData)
        console.log('完整结果:', JSON.stringify(res, null, 2))
        uni.showModal({
          title: '扫码结果',
          content: JSON.stringify(res, null, 2),
          showCancel: false,
        })
      },
      fail: err => {
        console.error('扫码失败:', err)
      },
    })
  }

  // ========== 二维码分享 ==========
  const showQrPopup = ref(false)
  const qrCodeUrl = ref('')

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

  // ========== 微信分享 ==========
  onShareAppMessage(() => ({
    title: '汽车服务，就选我们',
    path: `/pages/client/home/index?referrerUserId=${userStore.userId}`,
    imageUrl: userStore.storeInfo?.picUrl || '',
  }))

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
          uni.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }
</script>

<style lang="scss" scoped>
  .share-btn {
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    line-height: 1;
    font-size: 0;

    &::after {
      border: none;
    }
  }
</style>
