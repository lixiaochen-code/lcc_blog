<template>
  <view class="flex flex-col h-100vh overflow-hidden">
    <up-loading-page
      bg-color="rgba(0, 0, 0, 0.2)"
      :loading-text="loadingText"
      :loading="loading"
      loading-color="#333"
      color="black"
      font-size="28rpx"
    ></up-loading-page>
    <up-navbar
      :fixed="true"
      placeholder
      :left-icon="isTabBar ? 'arrow-left' : ''"
      :auto-back="!isTabBar"
      :title-style="{
        fontSize: '32rpx',
        fontWeight: 'bold',
      }"
    >
      <template #left>
        <view class="flex items-center">
          <up-icon v-if="!isTabBar" name="arrow-leftward" size="22"></up-icon>
          <view class="ml-4px font-bold">
            {{ currentPageData.style.navigationBarTitleText }}
          </view>
        </view>
      </template>
      <template #right>
        <view :style="{ marginRight: navbarRightMargin + 'px' }">
          <slot name="navbar-right"></slot>
        </view>
      </template>
    </up-navbar>
    <scroll-view
      :scroll-top="scrollTop"
      class="flex-1 h-0"
      style="background-color: #f6f7f9"
      :scroll-y="true"
      @scrolltolower="handleScrollBottom"
      @scrolltoupper="handleScrollTop"
    >
      <slot></slot>
    </scroll-view>
    <view>
      <up-tabbar
        v-if="isTabBar"
        :value="currentTab"
        :fixed="true"
        placeholder
        active-color="#e8403a"
        inactive-color="#999999"
        z-index="100"
        @change="handleChange"
      >
        <up-tabbar-item
          v-for="(item, index) in tabbarList"
          :key="index"
          class="flex-grow-1"
          :text="item.text"
          :name="item.pagePath"
          :icon="item.icon.includes('/') ? '' : item.icon"
        >
          <template v-if="item.selectedIcon.includes('/')" #active-icon>
            <image class="w-44rpx h-44rpx" :src="item.selectedIcon"></image>
          </template>
          <template v-if="item.icon.includes('/')" #inactive-icon>
            <image class="w-44rpx h-44rpx" :src="item.icon"></image>
          </template>
        </up-tabbar-item>
      </up-tabbar>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { getCurrentPageData, getCurrentPageIsTabBar } from '@/utils/page'
  import { computed, ref } from 'vue'
  import { useUserStore } from '@/store/user'
  import type { EmitsType, ExposeType, PropsType } from './interface'
  import type {
    ScrollViewOnScrolltolowerEvent,
    ScrollViewOnScrolltoupperEvent,
  } from '@uni-helper/uni-app-types'
  const emits = defineEmits<EmitsType>()
  withDefaults(defineProps<PropsType>(), {
    loading: false,
    loadingText: '正在加载中...',
  })

  const scrollTop = ref(0)
  const currentPageData = getCurrentPageData()
  const isTabBar = getCurrentPageIsTabBar()
  const userStore = useUserStore()

  // 计算 navbar 右侧安全距离（避开胶囊按钮）
  const navbarRightMargin = (() => {
    try {
      const { right } = uni.getMenuButtonBoundingClientRect()
      const { windowWidth } = uni.getSystemInfoSync()
      return windowWidth - right
    } catch {
      return 15
    }
  })()
  // 获取当前页面的路径，用于高亮 TabBar
  const currentTab = computed(() => {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    return page ? `/${page.route}` : ''
  })
  const tabbarList = computed(() => userStore.tabbarList)

  const handleScrollBottom = (e: ScrollViewOnScrolltolowerEvent) => {
    emits('scrollToBottom', e)
  }
  const handleScrollTop = (e: ScrollViewOnScrolltoupperEvent) => {
    emits('scrollToTop', e)
  }
  const handleChange = (name: string) => {
    if (name === currentTab.value) return
    if (isTabBar) {
      uni.switchTab({
        url: name,
      })
    } else {
      uni.navigateTo({
        url: name,
      })
    }
  }

  const handleScrollToTop = () => {
    scrollTop.value = 0
  }
  const handleScrollTo = (position: number) => {
    scrollTop.value = position
  }

  defineExpose<ExposeType>({
    handleScrollToTop,
    handleScrollTo,
  })
</script>

<style lang="scss">
  page {
    height: 100%;
    display: block;
  }
</style>
