<template>
  <view class="px-24rpx mt-10rpx">
    <view class="flex items-center justify-between my-10rpx mb-16rpx">
      <text class="text-32rpx font-600 text-[#222]">推荐给您</text>
      <view class="text-24rpx text-[#999] flex items-center" @click="emit('more')">
        <text class="mr-4rpx">查看全部</text>
        <up-icon size="12" name="arrow-right" color="#999"></up-icon>
      </view>
    </view>
    <scroll-view scroll-x class="whitespace-nowrap">
      <view class="flex gap-20rpx">
        <view
          v-for="(item, index) in handleList"
          :key="index"
          class="flex-shrink-0 w-320rpx bg-white rounded-16rpx p-20rpx"
          @click="emit('item-click', item)"
        >
          <view class="flex gap-12rpx h-100rpx">
            <ShowPhoto :images="item.picUrl" width="100rpx" height="100rpx" text-size="12rpx" />
            <view class="flex-1 flex flex-col justify-around overflow-hidden">
              <text class="text-28rpx font-600 text-[#222] truncate">{{ item.name }}</text>
              <text class="text-22rpx text-[#999] truncate">{{ item.brief || '暂无简介' }}</text>
            </view>
          </view>
          <view class="mt-12rpx">
            <view class="flex items-center justify-between">
              <PriceDisplay :price="item.price" :cost-price="item.costPrice" />
              <view @click.stop>
                <up-button
                  size="mini"
                  shape="circle"
                  :custom-style="{ width: '160rpx' }"
                  plain
                  color="#F33B3B"
                  @click.stop="emit('item-click', item)"
                  >立即预约</up-button
                >
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { RecommendItem } from '../types'
  import ShowPhoto from '@/components/ShowPhoto/index.vue'
  import PriceDisplay from '@/components/PriceDisplay/index.vue'

  const props = defineProps<{
    list: RecommendItem[]
  }>()

  const emit = defineEmits<{
    (e: 'more'): void
    (e: 'item-click', item: RecommendItem): void
  }>()

  const handleList = computed<RecommendItem[]>(() => {
    return props.list.map(item => {
      try {
        return {
          ...item,
          picUrl: JSON.parse(item.picUrl)?.[0] || '',
        }
      } catch {
        return {
          ...item,
        }
      }
    })
  })
</script>
