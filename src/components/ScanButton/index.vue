<template>
  <view
    class="flex items-center"
    :style="{ paddingRight: safeRightGap + 'px' }"
    @click="handleScan"
  >
    <up-icon name="scan" color="#333" size="22"></up-icon>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  const emit = defineEmits<{
    (e: 'scan', result: UniApp.ScanCodeSuccessRes): void
  }>()

  const safeRightGap = ref(0)

  onMounted(() => {
    // #ifdef MP-WEIXIN
    // 获取胶囊按钮的布局位置信息
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
    // 屏幕宽度 - 胶囊左边界 = 胶囊占用的总宽度（含右侧边距）
    const systemInfo = uni.getSystemInfoSync()
    safeRightGap.value = systemInfo.screenWidth - menuButtonInfo.left
    // #endif
  })

  const handleScan = () => {
    uni.scanCode({
      success: res => {
        emit('scan', res)
      },
      fail: err => {
        console.error('扫码失败:', err)
      },
    })
  }
</script>
