<template>
  <view class="px-24rpx mt-10rpx">
    <view class="flex items-center justify-between my-10rpx mb-16rpx">
      <text class="text-32rpx font-600 text-[#222]">附近门店</text>
      <view class="text-24rpx text-[#999] flex items-center" @click="emit('more')">
        <text class="mr-4rpx">查看全部</text>
        <up-icon name="arrow-right" size="12" color="#999"></up-icon>
      </view>
    </view>
    <view class="flex flex-col gap-20rpx">
      <view
        v-for="(item, index) in list"
        :key="index"
        class="bg-white rounded-16rpx p-20rpx"
        @click="emit('item-click', item)"
      >
        <view class="flex gap-20rpx">
          <image
            v-if="item.image && item.image.length > 0"
            :src="item.image[0]"
            class="w-160rpx h-160rpx rounded-16rpx"
            mode="scaleToFill"
          />
          <view class="flex-1 flex flex-col justify-between overflow-hidden">
            <view class="flex justify-between items-start">
              <text class="text-28rpx font-600 text-[#222] line-clamp-1">{{ item.name }}</text>
              <view class="flex items-center gap-4rpx flex-shrink-0">
                <template v-if="item.score">
                  <up-icon name="star-fill" size="24" color="#f5a623"></up-icon>
                  <text class="text-24rpx text-[#333] font-500">{{
                    Number(item.score).toFixed(1)
                  }}</text>
                </template>
                <text v-else class="text-24rpx text-[#999]">暂无评分</text>
              </view>
            </view>

            <view class="flex items-center gap-8rpx text-24rpx text-[#666]">
              <up-icon name="map" size="24" color="#999"></up-icon>
              <text class="line-clamp-1">{{ item.address }}</text>
            </view>

            <view class="flex justify-between items-center text-24rpx text-[#666]">
              <text>距离：{{ item.distance }}</text>
              <text>营业：{{ item.hours }}</text>
            </view>

            <view v-if="item.tags && item.tags.length" class="flex flex-wrap gap-12rpx">
              <text
                v-for="(tag, tIndex) in item.tags"
                :key="tIndex"
                class="border-2rpx border-solid border-[#f7a443] text-[#f7a443] px-16rpx py-4rpx rounded-20rpx text-22rpx"
                >{{ tag }}</text
              >
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import type { StoreViewItem } from '../types'

  defineProps<{
    list: StoreViewItem[]
  }>()

  const emit = defineEmits<{
    (e: 'more'): void
    (e: 'item-click', item: StoreViewItem): void
  }>()
</script>
