<template>
  <DefaultLayout>
    <view class="card">
      <view class="form-row">
        <text class="form-label">更新状态</text>
        <view class="form-right">
          <text class="form-value">{{ statusText }}</text>
          <u-icon name="arrow-right" size="28" color="#999"></u-icon>
        </view>
      </view>
      <view class="form-row">
        <text class="form-label">开始时间：</text>
        <text class="form-value">2023-06-20 17:59:33</text>
      </view>
      <view class="form-row">
        <text class="form-label">结束时间：</text>
        <text class="form-value">2023-06-20 17:59:33</text>
      </view>
      <u-textarea
        v-model="content"
        placeholder="洗车体验很好，赞了，下次还来"
        height="180"
      ></u-textarea>
      <view class="upload-section">
        <text class="upload-title">上传图片</text>
        <view class="upload-box">
          <u-icon name="camera" size="40" color="#bbb"></u-icon>
        </view>
      </view>
    </view>

    <view class="action-bar">
      <u-button type="error" size="large" shape="circle" plain @click="handleBack">返回</u-button>
      <u-button type="error" size="large" shape="circle" @click="handleSubmit">提交</u-button>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { ref } from 'vue'

  const statusText = ref('准备')
  const content = ref('')

  const handleBack = () => {
    uni.navigateBack()
  }

  const handleSubmit = () => {
    uni.showToast({ title: '状态已提交', icon: 'none' })
    uni.navigateBack()
  }
</script>

<style lang="scss" scoped>
  .card {
    background: #fff;
    border-radius: 16rpx;
    margin: 20rpx 24rpx;
    padding: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 26rpx;
    color: #666;
  }

  .form-label {
    color: #666;
  }

  .form-right {
    display: flex;
    align-items: center;
    gap: 6rpx;
  }

  .form-value {
    color: #333;
  }

  .upload-section {
    margin-top: 10rpx;
  }

  .upload-title {
    font-size: 26rpx;
    color: #666;
  }

  .upload-box {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: #f2f2f2;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 16rpx;
  }

  .action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    padding: 20rpx 24rpx 30rpx;
    display: flex;
    gap: 20rpx;
  }
</style>
