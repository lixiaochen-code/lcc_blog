<template>
  <DefaultLayout>
    <SearchBar
      :current-city="userStore.city"
      :position-icon="positionIcon"
      @location="handleLocation"
      @search="handleSearch"
    />

    <view class="bg-white px-[24rpx] pt-[10rpx]">
      <up-swiper
        :list="bannerList"
        key-name="url"
        height="140"
        radius="8"
        circular
        indicator
        indicator-mode="dot"
        @click="handlePreviewBanner"
      ></up-swiper>
    </view>

    <MenuGrid :items="channelList" @select="handleMenuClick" />

    <RecommendSection
      :list="recommendList"
      @more="handleRecommendMore"
      @item-click="handleRecommendClick"
    />

    <PackageSection
      :list="packageList"
      @more="handlePackageMore"
      @item-click="handlePackageClick"
    />

    <StoreSection :list="storeList" @more="handleStoreMore" @item-click="handleStoreClick" />

    <!-- 用户信息授权弹框 -->
    <UserAuthPopup ref="authPopupRef" v-model:show="showAuthPopup" @cancel="() => {}" />
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import positionIcon from '@/static/client/position.png'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import UserAuthPopup from '@/components/UserAuthPopup/index.vue'
  import SearchBar from './components/SearchBar.vue'
  import MenuGrid from './components/MenuGrid.vue'
  import RecommendSection from './components/RecommendSection.vue'
  import PackageSection from './components/PackageSection.vue'
  import StoreSection from './components/StoreSection.vue'
  import { useHomeData } from './hooks/useHomeData'
  import type { RecommendItem, StoreViewItem } from './types'
  import type { BannerItem, ChannelItem } from '@/api/Home/interfaces'
  import { useUserStore } from '@/store/user'

  const { bannerList, recommendList, packageList, storeList, channelList, refresh } = useHomeData()
  const userStore = useUserStore()

  const showAuthPopup = ref(false)
  const authPopupRef = ref<InstanceType<typeof UserAuthPopup>>()

  onLoad(query => {
    const referrerUserId = query?.referrerUserId
    if (referrerUserId) {
      if (!userStore.token) {
        userStore.setReferrerUserId(Number(referrerUserId))
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })

  onMounted(() => {
    if (userStore.needAuthCheck) {
      userStore.setNeedAuthCheck(false)
      console.log('检查手机号授权，当前手机号', authPopupRef.value?.checkAndShow)
      authPopupRef.value?.checkAndShow()
    }
  })

  const handleLocation = (): void => {
    uni.chooseLocation?.({
      success: result => {
        userStore.setCity(result.name)
        userStore.setLocation({ lat: result.latitude, lng: result.longitude })
        refresh()
      },
      fail: error => {
        console.error('选择位置失败:', error)
      },
    })
  }

  const handleSearch = (): void => {
    uni.navigateTo({ url: '/pages_client/pages/store/list/index' })
  }

  const handlePreviewBanner = (index: number) => {
    const urls = bannerList.value.map((item: BannerItem) => item.url).filter(Boolean)
    if (urls.length === 0) return
    const current = urls[index] || urls[0]
    uni.previewImage({
      urls,
      current,
    })
  }

  const handleMenuClick = (item: ChannelItem): void => {
    uni.navigateTo({ url: `/pages_client/pages/service/store-list/index?id=${item.id}` })
  }

  const handleRecommendClick = (item: RecommendItem): void => {
    uni.navigateTo({
      url: `/pages_client/pages/service/store-list/index?serviceCode=${item.serviceCode}&id=${item.category}`,
    })
  }

  const handleRecommendMore = (): void => {
    uni.navigateTo({ url: '/pages_client/pages/service/store-list/index?id=1005000' })
  }

  const handlePackageMore = (): void => {
    uni.navigateTo({ url: '/pages_client/pages/package/list/index' })
  }

  const handlePackageClick = (item: RecommendItem): void => {
    uni.navigateTo({
      url: `/pages_client/pages/package/detail/index?id=${item.id}`,
    })
  }

  const handleStoreMore = (): void => {
    uni.navigateTo({ url: '/pages_client/pages/store/list/index' })
  }

  const handleStoreClick = (item: StoreViewItem): void => {
    uni.navigateTo({ url: `/pages_client/pages/store/detail/index?id=${item.id}` })
  }
</script>
