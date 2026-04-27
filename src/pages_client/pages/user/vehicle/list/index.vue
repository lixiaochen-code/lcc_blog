<template>
  <DefaultLayout>
    <view class="bg-[#f6f6f6] pb-140rpx box-border">
      <view class="flex flex-col gap-20rpx">
        <up-empty v-if="list.length === 0" text="暂无车辆信息"></up-empty>
      </view>
      <up-card v-for="(item, index) in list" :key="index" :show-head="false" padding="0">
        <template #body>
          <view class="bg-white flex items-center justify-between rounded-16rpx p-30rpx">
            <view class="flex items-center gap-20rpx flex-1">
              <image
                v-if="item.coverUrl"
                :src="item.coverUrl"
                class="w-100rpx h-100rpx rounded-12rpx flex-shrink-0 bg-[#f9f9f9]"
                mode="aspectFill"
              />
              <view
                v-else
                class="w-100rpx h-100rpx rounded-12rpx bg-[#f6f6f6] flex items-center justify-center flex-shrink-0"
              >
                <up-icon name="car" size="28" color="#ccc"></up-icon>
              </view>
              <view class="flex-1 flex flex-col gap-12rpx">
                <view class="flex items-center gap-16rpx">
                  <text class="text-[#333] text-32rpx font-600">{{ item.licensePlate }}</text>
                  <view
                    v-if="item.isDefault"
                    class="bg-[rgba(214,59,53,0.1)] text-[#d63b35] rounded-8rpx px-12rpx py-4rpx text-20rpx"
                  >
                    默认
                  </view>
                </view>
                <text class="text-[#666] text-26rpx">{{ item.callName || '--' }}</text>
                <text class="text-[#999] text-24rpx">{{ item.phone || '--' }}</text>
              </view>
            </view>
            <view class="border-l-1rpx border-[#eee] flex items-center gap-30rpx pl-30rpx">
              <view class="flex flex-col items-center gap-6rpx" @click="handleEdit(item)">
                <up-icon name="edit-pen" size="20" color="#666"></up-icon>
                <text class="text-[#666] text-22rpx">编辑</text>
              </view>
              <view class="flex flex-col items-center gap-6rpx" @click="handleDelete(item)">
                <up-icon name="trash" size="20" color="#666"></up-icon>
                <text class="text-[#666] text-22rpx">删除</text>
              </view>
            </view>
          </view>
        </template>
        <template #foot>
          <view class="flex justify-end px-30rpx py-20rpx">
            <view>
              <up-button
                size="mini"
                plain
                plain-fill
                type="error"
                shape="circle"
                :disabled="item.isDefault"
                text="设为默认"
                color="#d63b35"
                @click="handleSetDefault(item)"
              ></up-button>
            </view>
          </view>
        </template>
      </up-card>
      <view
        class="fixed bottom-0 left-0 right-0 bg-white pb-[calc(20rpx+env(safe-area-inset-bottom))] px-30rpx py-20rpx shadow-[0_-2rpx_10rpx_rgba(0,0,0,0.05)]"
      >
        <up-button
          type="error"
          shape="circle"
          text="添加车辆"
          color="#d63b35"
          @click="handleAdd"
        ></up-button>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getList, deleteVehicle, saveVehicle } from '@/api/UserVehicleService'
  import type { CarUserVehicles } from '@/api/UserVehicleService/interfaces'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'

  const list = ref<CarUserVehicles[]>([])

  const fetchList = async () => {
    try {
      const method = getList()
      method.config.cacheFor = 0
      const res = await method
      list.value = res.list || []
    } catch (e) {
      console.error('获取车辆列表失败', e)
    }
  }

  const handleEdit = (item: CarUserVehicles) => {
    uni.navigateTo({
      url: `/pages_client/pages/user/vehicle/edit/index?id=${item.id}`,
    })
  }

  const handleDelete = (item: CarUserVehicles) => {
    uni.showModal({
      title: '提示',
      content: '确定要删除该车辆吗？',
      success: async res => {
        if (res.confirm && item.id) {
          try {
            await deleteVehicle(item.id)
            uni.showToast({ title: '删除成功', icon: 'success' })
            fetchList()
          } catch (e) {
            console.error('删除失败', e)
            uni.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleAdd = () => {
    uni.navigateTo({
      url: '/pages_client/pages/user/vehicle/edit/index',
    })
  }

  const handleSetDefault = async (item: CarUserVehicles) => {
    console.log(item)
    try {
      await saveVehicle({
        ...item,
        isDefault: true,
      })
      uni.showToast({ title: '设为默认成功', icon: 'success' })
      fetchList()
    } catch (e) {
      console.error('设为默认失败', e)
      uni.showToast({ title: '设为默认失败', icon: 'none' })
    }
  }

  onShow(() => {
    fetchList()
  })
</script>
