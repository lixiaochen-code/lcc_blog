<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-[#f6f6f6] px-24rpx py-20rpx">
      <!-- 头像（微信授权获取） -->
      <view class="bg-white rounded-16rpx px-30rpx mb-20rpx">
        <view class="flex items-center justify-between h-[100rpx]">
          <text class="text-[28rpx] text-[#333]">头像</text>
          <button
            class="p-0 m-0 bg-transparent border-none after:border-none flex items-center"
            open-type="chooseAvatar"
            @chooseavatar="handleChooseAvatar"
          >
            <image
              class="w-80rpx h-80rpx rounded-full"
              :src="form.avatar || defaultAvatar"
              mode="aspectFill"
            ></image>
            <up-icon
              name="arrow-right"
              size="14"
              color="#c8c9cc"
              custom-style="margin-left: 8rpx"
            ></up-icon>
          </button>
        </view>
      </view>

      <!-- 表单 -->
      <view class="bg-white rounded-16rpx px-30rpx mb-20rpx">
        <up-form :model="form" label-width="160rpx">
          <!-- 昵称（微信授权填充） -->
          <up-form-item label="昵称" prop="nickname" border-bottom>
            <input
              type="nickname"
              class="text-[28rpx] text-[#333] h-full w-full"
              :value="form.nickname"
              placeholder="点击获取微信昵称"
              @change="handleNicknameChange"
              @blur="handleNicknameChange"
            />
          </up-form-item>
          <up-form-item label="性别" prop="gender" border-bottom>
            <view class="flex gap-24rpx">
              <up-tag
                text="男"
                :plain="form.gender !== 1"
                :type="form.gender === 1 ? 'error' : 'info'"
                @click="form.gender = 1"
              ></up-tag>
              <up-tag
                text="女"
                :plain="form.gender !== 2"
                :type="form.gender === 2 ? 'error' : 'info'"
                @click="form.gender = 2"
              ></up-tag>
            </view>
          </up-form-item>
          <up-form-item label="生日" prop="birthday" border-bottom>
            <view class="flex-1" @click="showDatePicker = true">
              <text class="text-[28rpx]" :class="form.birthday ? 'text-[#333]' : 'text-[#c0c4cc]'">
                {{ form.birthday || '请选择生日' }}
              </text>
            </view>
          </up-form-item>
          <up-form-item label="手机号" prop="mobile">
            <text class="text-[28rpx] text-[#333]">{{ form.mobile || '未绑定' }}</text>
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

      <!-- 生日选择器 -->
      <up-datetime-picker
        :show="showDatePicker"
        mode="date"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="handleDateConfirm"
        @cancel="showDatePicker = false"
        @close="showDatePicker = false"
      ></up-datetime-picker>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { ref, reactive } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getUserInfo, updateUserInfo } from '@/api/MemberService'
  import type { MallUser } from '@/api/MemberService/interfaces'
  import { useUserStore } from '@/store/user'
  import { uploadWxAvatar } from '@/hooks/useUploadImage'
  import dayjs from 'dayjs'

  const defaultAvatar = 'https://cdn.uviewui.com/uview/album/1.jpg'

  const loading = ref(false)
  const showDatePicker = ref(false)
  const minDate = new Date('1950-01-01').getTime()
  const maxDate = new Date().getTime()
  const userStore = useUserStore()

  const form = reactive<MallUser>({
    nickname: '',
    gender: 0,
    mobile: '',
    avatar: '',
    birthday: '',
  })

  // ========== 加载用户信息 ==========
  const loadUserInfo = async () => {
    try {
      const method = getUserInfo()
      method.config.cacheFor = 0
      const res = await method
      if (res) {
        form.nickname = res.nickname || ''
        form.gender = res.gender ?? 0
        form.mobile = res.mobile || ''
        form.birthday = res.birthday || ''
        form.avatar = res.avatar || ''
        form.id = res.id
      }
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  }

  onShow(() => {
    loadUserInfo()
  })

  // ========== 微信授权头像 ==========
  const handleChooseAvatar = async (e: any) => {
    if (!e.detail.avatarUrl) return
    try {
      uni.showLoading({ title: '上传中...' })
      form.avatar = await uploadWxAvatar(e.detail.avatarUrl)
    } catch {
      uni.showToast({ title: '上传头像失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }

  // ========== 微信授权昵称 ==========
  const handleNicknameChange = (e: any) => {
    const value = e.detail?.value ?? e.detail ?? ''
    if (value) form.nickname = value
  }

  // ========== 生日选择 ==========
  const handleDateConfirm = (e: any) => {
    // up-datetime-picker confirm 回调可能是 { value } 或直接是时间戳
    const val = typeof e === 'object' ? e.value : e
    form.birthday = dayjs(Number(val)).format('YYYY-MM-DD')
    showDatePicker.value = false
  }

  // ========== 保存 ==========
  const handleSave = async () => {
    if (!form.nickname) {
      uni.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    loading.value = true
    try {
      await updateUserInfo({
        id: form.id,
        nickname: form.nickname,
        gender: form.gender,
        birthday: form.birthday,
        avatar: form.avatar,
      })
      // 保存成功后调用接口刷新本地用户信息
      const method = getUserInfo()
      method.config.cacheFor = 0
      const res = await method
      if (res) {
        userStore.setUserData({
          id: res.id!,
          nickname: res.nickname || '',
          avatar: res.avatar || '',
          mobile: res.mobile || '',
          gender: res.gender || 0,
          userLevel: res.userLevel || 0,
          weixinOpenid: res.weixinOpenid || '',
        })
      }
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } catch (e) {
      console.error('保存失败', e)
      uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
</script>
