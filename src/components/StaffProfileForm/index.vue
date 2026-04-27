<template>
  <view class="min-h-100vh bg-[#f6f6f6] px-24rpx py-20rpx">
    <!-- 头像 -->
    <view class="bg-white rounded-16rpx px-30rpx mb-20rpx">
      <view class="flex items-center justify-between h-[120rpx]">
        <text class="text-[28rpx] text-[#333]">头像</text>
        <view class="flex items-center" @click="handleChooseAvatar">
          <image
            class="w-80rpx h-80rpx rounded-full bg-[#f5f5f5]"
            :src="form.avatarUrl || defaultAvatar"
            mode="aspectFill"
          ></image>
          <up-icon
            name="arrow-right"
            size="14"
            color="#c8c9cc"
            custom-style="margin-left: 8rpx"
          ></up-icon>
        </view>
      </view>
    </view>

    <!-- 表单 -->
    <view class="bg-white rounded-16rpx px-30rpx mb-20rpx">
      <up-form :model="form" label-width="160rpx">
        <up-form-item label="名称" prop="name" border-bottom>
          <up-input v-model="form.name" placeholder="请输入名称" border="none"></up-input>
        </up-form-item>
        <up-form-item label="电话" prop="phone" border-bottom>
          <up-input
            v-model="form.phone"
            placeholder="请输入电话"
            border="none"
            type="number"
            maxlength="11"
          ></up-input>
        </up-form-item>
        <up-form-item label="描述" prop="desc">
          <up-input v-model="form.desc" placeholder="请输入个人描述" border="none"></up-input>
        </up-form-item>
      </up-form>
    </view>

    <!-- 保存按钮 -->
    <view class="mt-40rpx">
      <up-button
        type="error"
        shape="circle"
        text="保存"
        color="#d63b35"
        :loading="loading"
        @click="handleSave"
      ></up-button>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { updateStaff } from '@/api/MemberService'
  import { useUploadImage } from '@/hooks/useUploadImage'
  import { useUserStore } from '@/store/user'

  const defaultAvatar = 'https://cdn.uviewui.com/uview/album/1.jpg'
  const loading = ref(false)
  const userStore = useUserStore()

  const form = reactive({
    name: '',
    avatarUrl: '',
    phone: '',
    desc: '',
  })

  const { chooseAndUpload } = useUploadImage({ maxCount: 1 })
  const phoneRegExp = /^1[3-9]\d{9}$/

  // ========== 从 store 回填信息 ==========
  const loadStaffInfo = () => {
    const info = userStore.staffInfo
    if (info) {
      form.name = info.name || ''
      form.avatarUrl = info.avatarUrl || ''
      form.phone = info.phone || ''
      form.desc = info.desc || ''
    }
  }

  onShow(() => {
    loadStaffInfo()
  })

  // ========== 选择头像 ==========
  const handleChooseAvatar = async () => {
    try {
      const results = await chooseAndUpload()
      if (results.length > 0 && results[0].url) {
        form.avatarUrl = results[0].url
      }
    } catch {
      /* ignore */
    }
  }

  // ========== 保存 ==========
  const handleSave = async () => {
    const name = form.name.trim()
    const phone = form.phone.trim()
    const desc = form.desc.trim()

    if (!name) {
      uni.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    if (!phone) {
      uni.showToast({ title: '请输入电话', icon: 'none' })
      return
    }
    if (!phoneRegExp.test(phone)) {
      uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    loading.value = true
    try {
      await updateStaff({
        name,
        avatarUrl: form.avatarUrl,
        phone,
        desc,
      })
      // 同步更新 store 中的 staffInfo
      if (userStore.staffInfo) {
        userStore.setStaffInfo({
          ...userStore.staffInfo,
          name,
          avatarUrl: form.avatarUrl,
          phone,
          desc,
        })
      }
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } catch (e) {
      console.error('保存失败', e)
      uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
</script>
