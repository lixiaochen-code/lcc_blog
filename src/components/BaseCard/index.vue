<template>
  <view class="base-card" :style="customStyle">
    <view v-if="title" class="card-header">
      <text class="title">{{ title }}</text>
      <slot name="extra"></slot>
    </view>
    <view class="card-body">
      <slot></slot>
    </view>
    <view v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps({
    title: {
      type: String,
      default: '',
    },
    padding: {
      type: [String, Number],
      default: '30rpx',
    },
    margin: {
      type: [String, Number],
      default: '0 0 20rpx 0',
    },
    bgColor: {
      type: String,
      default: '#ffffff',
    },
    radius: {
      type: [String, Number],
      default: '16rpx',
    },
  })

  const customStyle = computed(() => {
    return {
      padding: props.padding,
      margin: props.margin,
      backgroundColor: props.bgColor,
      borderRadius: props.radius,
    }
  })
</script>

<style lang="scss" scoped>
  .base-card {
    box-shadow: 0 2rpx 12rpx 0 rgba(0, 0, 0, 0.05);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      padding-bottom: 20rpx;
      border-bottom: 1rpx solid #f5f5f5;

      .title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        position: relative;
        padding-left: 20rpx;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 8rpx;
          height: 32rpx;
          background-color: #2979ff;
          border-radius: 4rpx;
        }
      }
    }

    .card-footer {
      margin-top: 20rpx;
      padding-top: 20rpx;
      border-top: 1rpx solid #f5f5f5;
    }
  }
</style>
