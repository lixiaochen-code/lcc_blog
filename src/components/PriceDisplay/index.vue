<template>
  <view class="flex items-baseline" :class="gapClass">
    <text v-if="splitSymbol" :class="symbolClass">¥</text>
    <text :class="priceClass">{{ splitSymbol ? price : `¥${price}` }}</text>
    <text v-if="showCostPrice" class="text-[#999] line-through" :class="costPriceClass"
      >¥{{ costPrice }}</text
    >
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      price: number | string
      costPrice?: number | string
      size?: 'sm' | 'md' | 'lg'
    }>(),
    {
      size: 'md',
      costPrice: undefined,
    }
  )

  const showCostPrice = computed(
    () =>
      props.costPrice !== undefined &&
      props.costPrice !== null &&
      Number(props.costPrice) !== Number(props.price)
  )

  // sm 尺寸拆分 ¥ 符号和数字为不同大小
  const splitSymbol = computed(() => props.size === 'sm')

  const gapClass = computed(() => {
    if (props.size === 'sm') return 'gap-[6rpx]'
    if (props.size === 'lg') return 'gap-[12rpx]'
    return 'gap-[8rpx]'
  })

  const symbolClass = computed(() => {
    return 'text-[24rpx] text-[#e8403a] font-bold'
  })

  const priceClass = computed(() => {
    if (props.size === 'sm') return 'text-[34rpx] text-[#e8403a] font-bold'
    if (props.size === 'lg') return 'text-[44rpx] text-[#e8403a] font-bold'
    return 'text-[32rpx] font-600 text-[#e8403a]'
  })

  const costPriceClass = computed(() => {
    if (props.size === 'lg') return 'text-[26rpx] mt-[10rpx]'
    return 'text-[22rpx]'
  })
</script>
