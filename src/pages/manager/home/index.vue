<template>
  <DefaultLayout :loading="loading">
    <!-- <template #navbar-right>
      <ScanButton @scan="handleScanResult" />
    </template> -->

    <view class="min-h-100vh bg-[#f6f6f6]">
      <!-- Work Overview -->
      <view class="mx-[24rpx] mt-[20rpx]">
        <view class="bg-[#41b0e9] rounded-[20rpx] p-[32rpx] text-white">
          <view class="flex items-center gap-[12rpx] mb-[40rpx]">
            <text class="text-[28rpx] font-500">{{ todayStr }}</text>
            <text class="text-[28rpx] font-500">工作概览</text>
          </view>
          <view class="flex justify-between items-center px-[20rpx]">
            <view class="flex flex-col items-center">
              <text class="text-[44rpx] font-700 mb-[16rpx]">{{ homeData?.totalToDay ?? 0 }}</text>
              <text class="text-[24rpx] opacity-90">今日订单数</text>
            </view>
            <view class="flex flex-col items-center">
              <text class="text-[44rpx] font-700 mb-[16rpx]">{{
                homeData?.confirmTotalToDay ?? 0
              }}</text>
              <text class="text-[24rpx] opacity-90">已完成</text>
            </view>
            <view class="flex flex-col items-center">
              <text class="text-[44rpx] font-700 mb-[16rpx]">{{ homeData?.toDoCount ?? 0 }}</text>
              <text class="text-[24rpx] opacity-90">待办</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Pending Tasks -->
      <view class="mt-[40rpx] px-[24rpx]">
        <view class="mb-[20rpx]">
          <view class="flex items-center justify-between gap-[16rpx] flex-wrap">
            <text class="text-[32rpx] font-600 text-[#222]">待办事项</text>
            <view class="flex items-center gap-[12rpx] flex-wrap">
              <view
                class="h-[44rpx] px-[18rpx] rounded-[999rpx] bg-[#fff4eb] flex items-center gap-[8rpx]"
              >
                <text class="text-[22rpx] text-[#f08a24]">待核销</text>
                <text class="text-[24rpx] font-600 text-[#f08a24]">{{ pendingCheckCount }}</text>
              </view>
              <view
                class="h-[44rpx] px-[18rpx] rounded-[999rpx] bg-[#edf6ff] flex items-center gap-[8rpx]"
              >
                <text class="text-[22rpx] text-[#3f8cff]">待分配</text>
                <text class="text-[24rpx] font-600 text-[#3f8cff]">{{ pendingAssignCount }}</text>
              </view>
            </view>
          </view>

          <!-- 筛选栏 -->
          <view
            v-if="toDoList.length > 0"
            class="mt-[16rpx] flex flex-wrap items-center gap-[16rpx]"
          >
            <view
              class="w-[240rpx] max-w-full bg-white rounded-[999rpx] px-[24rpx] h-[56rpx] shadow-sm flex items-center justify-between"
              @click="selectEventName"
            >
              <text class="text-[24rpx] text-[#666] truncate">
                {{ selectedEventName || '全部' }}
              </text>
              <up-icon name="arrow-down" size="14" color="#999"></up-icon>
            </view>
            <view class="flex-1 min-w-[280rpx] bg-white rounded-[999rpx] px-[20rpx] shadow-sm">
              <up-input
                v-model="searchKeyword"
                placeholder="搜索订单号/车牌号"
                border="none"
                clearable
                shape="circle"
                font-size="24rpx"
              >
                <template #prefix>
                  <up-icon name="search" size="16" color="#999"></up-icon>
                </template>
              </up-input>
            </view>
          </view>
        </view>

        <!-- 有待办事项 -->
        <view
          v-if="filteredToDoList.length > 0"
          class="bg-white rounded-[16rpx] p-[24rpx] flex flex-col gap-[20rpx]"
        >
          <view
            v-for="(task, index) in filteredToDoList"
            :key="task.orderId"
            class="rounded-[12rpx] p-[24rpx] border-l-[12rpx]"
            :class="getTaskTheme(index)"
            @click="handleTaskClick(task)"
          >
            <view class="flex gap-[20rpx] mb-[16rpx] items-start">
              <image
                v-if="getVehicleImage(task)"
                :src="getVehicleImage(task)!"
                class="w-[112rpx] h-[112rpx] rounded-[12rpx] bg-[#f3f3f3] flex-shrink-0"
                mode="aspectFill"
              />
              <ImgEmpty v-else width="112rpx" height="112rpx" text-size="20rpx" :size="24" />
              <view class="flex-1 min-w-0">
                <view class="flex items-start justify-between gap-[12rpx] mb-[8rpx]">
                  <view class="text-[30rpx] font-600 text-[#222] truncate flex-1 min-w-0">
                    {{ task.serviceName || '--' }}
                  </view>
                  <up-tag
                    :text="task.eventName || '--'"
                    type="error"
                    size="mini"
                    plain
                    shape="circle"
                  ></up-tag>
                </view>
                <view class="text-[24rpx] text-[#666] mb-[6rpx]">
                  订单编号：{{ getOrderSn(task) || '--' }}
                </view>
                <view v-if="task.vehiclesLicensePlate" class="text-[24rpx] text-[#666]">
                  车牌号：{{ task.vehiclesLicensePlate }}
                </view>
                <view v-if="task.callName" class="text-[24rpx] text-[#666] mt-[6rpx]">
                  车主：{{ task.callName }}
                </view>
                <view v-if="task.phone" class="text-[24rpx] text-[#666] mt-[6rpx]">
                  电话：{{ task.phone }}
                </view>
              </view>
            </view>
            <view class="text-[26rpx] text-[#666]">
              {{ task.timeLabel || '预计时间' }}：{{ formatTime(task.time) || '--' }}
            </view>
          </view>
        </view>

        <!-- 筛选无结果 -->
        <view
          v-else-if="toDoList.length > 0 && filteredToDoList.length === 0"
          class="bg-white rounded-[16rpx] p-[60rpx] flex flex-col items-center"
        >
          <up-icon name="search" size="80" color="#ccc"></up-icon>
          <text class="text-[28rpx] text-[#999] mt-[20rpx]">无匹配的待办事项</text>
        </view>

        <!-- 无待办事项 -->
        <view
          v-else-if="!loading"
          class="bg-white rounded-[16rpx] p-[60rpx] flex flex-col items-center"
        >
          <up-icon name="checkmark-circle" size="80" color="#88c988"></up-icon>
          <text class="text-[28rpx] text-[#999] mt-[20rpx]">暂无待办事项</text>
        </view>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import ImgEmpty from '@/components/ImgEmpty/index.vue'
  import { computed, ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { useRequest } from 'alova/client'
  import { getStaffHome } from '@/api/OrderService'
  import type { StaffHomeResponse, StaffHomeToDoItem } from '@/api/OrderService/interfaces'

  // ========== 今日日期 ==========
  const todayStr = computed(() => {
    const d = new Date()
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
  })

  // ========== 数据请求 ==========
  const homeData = ref<StaffHomeResponse>()
  const toDoList = computed(() => homeData.value?.toDoList ?? [])

  // ========== 筛选 & 排序 ==========
  const selectedEventName = ref('')
  const searchKeyword = ref('')
  const eventSelectOptions = computed(() => {
    const names = [...new Set(toDoList.value.map(item => item.eventName).filter(Boolean))]
    return names.map(name => ({ text: name, value: name }))
  })

  const selectEventName = () => {
    const itemList = ['全部', ...eventSelectOptions.value.map(item => item.text)]
    uni.showActionSheet({
      itemList,
      success: ({ tapIndex }) => {
        selectedEventName.value = tapIndex === 0 ? '' : itemList[tapIndex]
      },
    })
  }

  /** 时间字符串格式化为 "2026年03月10日 08:00:00" */
  const parseTime = (time: string) => {
    if (!time) return null
    const normalized = time.replace(/年|月/g, '/').replace(/日/g, '').replace(/-/g, '/').trim()
    const d = new Date(normalized)
    return isNaN(d.getTime()) ? null : d
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const d = parseTime(time)
    if (!d) return time
    const Y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return `${Y}年${M}月${D}日 ${h}:${m}:${s}`
  }

  /** 解析时间字符串为时间戳，time 为空时用 orderId 兜底 */
  const getSortValue = (item: StaffHomeToDoItem): number => {
    if (item.time) {
      const d = parseTime(item.time)
      if (d) return d.getTime()
    }
    return item.orderId
  }

  const getOrderSn = (item: StaffHomeToDoItem) => item.ordersn || item.orderSn || ''

  const getVehicleImage = (item: StaffHomeToDoItem) =>
    item.vehiclespicUrl || item.vehiclesPicUrl || ''

  const pendingCheckCount = computed(
    () => toDoList.value.filter(item => (item.eventName || '').includes('核销')).length
  )

  const pendingAssignCount = computed(
    () => toDoList.value.filter(item => (item.eventName || '').includes('分配')).length
  )

  /** 筛选 + 排序后的列表 */
  const filteredToDoList = computed(() => {
    let list = [...toDoList.value]
    if (selectedEventName.value) {
      list = list.filter(item => item.eventName === selectedEventName.value)
    }
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (keyword) {
      list = list.filter(item => {
        const orderSn = getOrderSn(item).toLowerCase()
        const licensePlate = (item.vehiclesLicensePlate || '').toLowerCase()
        return orderSn.includes(keyword) || licensePlate.includes(keyword)
      })
    }
    list.sort((a, b) => {
      const diff = getSortValue(a) - getSortValue(b)
      return diff
    })
    return list
  })

  const { loading, send: fetchHome } = useRequest(() => getStaffHome({}), {
    immediate: false,
  })

  const loadHomeData = async () => {
    try {
      const res = await fetchHome()
      homeData.value = res as unknown as StaffHomeResponse
    } catch (err) {
      console.error('获取管理员首页数据失败:', err)
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 每次页面显示时刷新数据
  onShow(() => {
    loadHomeData()
  })

  // ========== 待办主题色（循环分配） ==========
  const themes = [
    'bg-[#d8f0d8] border-[#88c988]',
    'bg-[#ffedc8] border-[#fbbd5c]',
    'bg-[#ffccd0] border-[#f88d95]',
    'bg-[#d8e8f0] border-[#6daed0]',
  ]
  const getTaskTheme = (index: number) => themes[index % themes.length]

  // ========== 点击待办 -> 跳转订单详情 ==========
  const handleTaskClick = (task: StaffHomeToDoItem) => {
    uni.navigateTo({
      url: `/pages_client/pages/order/detail/index?orderId=${task.orderId}`,
    })
  }
</script>

<style lang="scss" scoped></style>
