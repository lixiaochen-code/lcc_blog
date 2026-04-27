<template>
  <view>
    <template v-if="isShowImage">
      <up-image
        v-if="oneShow"
        :src="oneShowImage"
        mode="aspectFill"
        :width="props.width"
        :height="props.height"
        class="rounded-[16rpx] overflow-hidden"
      ></up-image>
      <up-swiper
        v-else
        :list="swiperImages"
        key-name="url"
        circular
        :height="props.height"
        :width="props.width"
        indicator
        indicator-mode="dot"
      ></up-swiper>
    </template>
    <ImgEmpty
      v-else
      :size="props.size"
      :text-size="props.textSize"
      :width="props.width"
      :height="props.height"
    />
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import ImgEmpty from '@/components/ImgEmpty/index.vue'

  const props = withDefaults(
    defineProps<{
      images?: any
      height?: string
      width?: string
      size?: number
      textSize?: string
    }>(),
    {
      images: () => [],
      height: '100%',
      width: '100%',
      size: 28,
      textSize: '28rpx',
    }
  )

  const isShowImage = computed(() => {
    return Array.isArray(props.images) ? props.images.length > 0 : !!props.images
  })
  const oneShowImage = computed(() => {
    const img = Array.isArray(props.images) ? props.images[0] : props.images
    return typeof img === 'string' ? img : ''
  })

  const oneShow = computed(() => {
    return Array.isArray(props.images) ? (props.images.length > 1 ? false : true) : !!props.images
  })

  const swiperImages = computed(() => {
    return Array.isArray(props.images) ? props.images : [props.images]
  })
</script>
