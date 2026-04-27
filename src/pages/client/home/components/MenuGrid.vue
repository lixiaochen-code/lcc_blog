<template>
  <view class="bg-white mx-24rpx my-20rpx rounded-18rpx px-10rpx py-20rpx">
    <view class="grid grid-cols-4 gap-y-20rpx">
      <view
        v-for="(item, index) in items"
        :key="index"
        class="flex flex-col items-center"
        @click="emit('select', item)"
      >
        <view class="w-88rpx h-88rpx rounded-18rpx flex items-center justify-center bg-[#fff5f5]">
          <image class="w-56rpx h-56rpx" :src="item.iconUrl" mode="aspectFit"></image>
        </view>
        <text class="mt-10rpx text-24rpx text-[#555]">{{ item.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import type { ChannelItem } from '@/api/Home/interfaces'

  defineProps<{
    items: ChannelItem[]
  }>()

  const emit = defineEmits<{
    (e: 'select', item: ChannelItem): void
  }>()
</script>
