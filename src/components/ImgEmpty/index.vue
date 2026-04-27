<template>
  <view
    class="flex items-center justify-center bg-gray-100 rounded-[16rpx]"
    :style="{ width: props.width, height: props.height }"
  >
    <view class="flex flex-col items-center justify-center">
      <u-icon name="photo" :size="props.size"></u-icon>
      <text
        :style="{
          fontSize: textSize,
        }"
        >暂无图片</text
      >
    </view>
  </view>
</template>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      width?: string
      height?: string
      size?: number
      textSize?: string
    }>(),
    {
      width: '100%',
      height: '100%',
      size: 28,
      textSize: '28rpx',
    }
  )
</script>
