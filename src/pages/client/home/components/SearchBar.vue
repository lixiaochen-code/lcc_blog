<template>
  <view class="bg-white px-24rpx pt-20rpx pb-10rpx">
    <view class="flex items-center gap-12rpx">
      <view class="flex items-center gap-8rpx text-28rpx text-[#333]" @click="emit('location')">
        <image class="w-32rpx h-32rpx" :src="positionIcon" mode="aspectFit"></image>
        <text class="text-28rpx text-[#333]">{{ currentCity }}</text>
      </view>
      <view class="flex-1">
        <view
          class="h-64rpx bg-[#f3f3f3] rounded-100px flex items-center gap-12rpx px-20rpx"
          @click="emit('search')"
        >
          <up-icon name="search" size="28" color="#999"></up-icon>
          <text class="text-26rpx text-[#999]">搜索服务/门店</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  defineProps<{
    currentCity: string
    positionIcon: string
  }>()

  const emit = defineEmits<{
    (e: 'location'): void
    (e: 'search'): void
  }>()
</script>
