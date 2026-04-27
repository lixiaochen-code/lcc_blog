<!-- eslint-disable @typescript-eslint/ban-ts-comment -->
<template>
  <DefaultLayout>
    <view class="pb-20rpx">
      <!-- 服务信息卡片 -->
      <view
        class="bg-white rounded-[24rpx] mx-[24rpx] mt-[24rpx] p-[30rpx] flex gap-[24rpx] shadow-sm items-center"
      >
        <view class="rounded-[16rpx] overflow-hidden bg-[#f9f9f9]">
          <ShowPhoto
            :images="serviceInfo?.picUrl"
            height="120rpx"
            width="120rpx"
            :size="18"
            text-size="18rpx"
          />
        </view>
        <view class="flex-1 flex flex-col gap-[12rpx] py-[4rpx]">
          <text class="text-[32rpx] font-bold text-[#222] line-clamp-1">{{
            serviceInfo?.serviceName || '服务项目'
          }}</text>
          <text class="text-[24rpx] text-[#888] line-clamp-1">{{
            serviceInfo?.brief || '暂无服务描述'
          }}</text>
          <view class="flex items-baseline gap-[6rpx]">
            <text class="text-[24rpx] text-[#e8403a] font-bold">¥</text>
            <text class="text-[36rpx] text-[#e8403a] font-bold">{{ serviceInfo?.price ?? 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 选择车辆 / 选择门店 -->
      <view
        class="bg-white rounded-[24rpx] mx-[24rpx] mt-[24rpx] p-[30rpx] flex flex-col gap-[32rpx] shadow-sm"
      >
        <view class="flex items-center justify-between" @click="handleSelectCar">
          <view class="flex items-center gap-[24rpx]">
            <image
              v-if="defaultVehicle?.coverUrl"
              :src="defaultVehicle.coverUrl"
              class="h-[80rpx] w-[80rpx] rounded-[20rpx] bg-[#fff5f5]"
              mode="aspectFill"
            />
            <view
              v-else
              class="w-[80rpx] h-[80rpx] rounded-[20rpx] bg-[#fff5f5] flex items-center justify-center"
            >
              <u-icon name="car" size="44" color="#e8403a"></u-icon>
            </view>
            <view class="flex flex-col gap-[8rpx]">
              <text class="text-[28rpx] text-[#222] font-bold">选择车辆</text>
              <text class="text-[26rpx] text-[#666]">{{ vehicleDesc || '请选择车辆' }}</text>
              <text v-if="vehicleOwnerInfo" class="text-[24rpx] text-[#999]">{{
                vehicleOwnerInfo
              }}</text>
            </view>
          </view>
          <u-icon name="arrow-right" size="28" color="#ccc"></u-icon>
        </view>

        <view class="w-full h-[2rpx] bg-[#f5f5f5] ml-[104rpx]"></view>

        <view class="flex items-center justify-between" @click="handleSelectStore">
          <view class="flex items-center gap-[24rpx]">
            <view
              class="w-[80rpx] h-[80rpx] rounded-[20rpx] bg-[#f0f7ff] flex items-center justify-center"
            >
              <u-icon name="home" size="44" color="#2b85e4"></u-icon>
            </view>
            <view class="flex flex-col gap-[8rpx]">
              <text class="text-[28rpx] text-[#222] font-bold">选择门店</text>
              <text class="text-[26rpx] text-[#666]">{{ selectedStoreName || '请选择门店' }}</text>
            </view>
          </view>
          <u-icon name="arrow-right" size="28" color="#ccc"></u-icon>
        </view>
      </view>

      <!-- 预约时间 -->
      <view
        class="bg-white rounded-[24rpx] mx-[24rpx] mt-[24rpx] p-[30rpx] flex flex-col gap-[24rpx] shadow-sm"
      >
        <view class="flex items-center gap-[12rpx] mb-[10rpx]">
          <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
          <text class="text-[32rpx] font-bold text-[#222]">预约时间</text>
        </view>

        <view
          class="flex items-center justify-between bg-[#f9f9f9] p-[24rpx] rounded-[16rpx]"
          @click="showDatePicker = true"
        >
          <text class="text-[28rpx] text-[#444] font-500">预约日期</text>
          <view class="flex items-center gap-[8rpx]">
            <text class="text-[28rpx] text-[#e8403a] font-bold">{{
              selectedDate || '请选择日期'
            }}</text>
            <u-icon name="arrow-right" size="24" color="#ccc"></u-icon>
          </view>
        </view>
        <up-picker
          :show="showDatePicker"
          :columns="datePickerColumns"
          placeholder="请选择预约日期"
          @confirm="handleDateConfirm"
          @cancel="showDatePicker = false"
          @close="showDatePicker = false"
        ></up-picker>

        <view v-if="loadingAppointmentTime" class="text-center text-[26rpx] text-[#999] mt-[20rpx]">
          加载可用时间段中...
        </view>
        <view
          v-else-if="currentDaySchedule && currentTimeSlots.length === 0"
          class="flex items-center justify-center text-[26rpx] text-[#e8403a] py-[60rpx]"
        >
          当前日期无空闲预约时间，请选择其他日期
        </view>
        <template v-else>
          <scroll-view
            v-if="hasTimelineGroup"
            scroll-x
            class="whitespace-nowrap mt-[4rpx]"
            :show-scrollbar="false"
          >
            <view class="inline-flex gap-[12rpx]">
              <view
                v-for="(_, tabIndex) in currentTimelineGroup"
                :key="tabIndex"
                :class="[
                  'px-[24rpx] py-[12rpx] rounded-[999rpx] text-[24rpx] border border-solid',
                  selectedWorkbenchIndex === tabIndex
                    ? 'bg-[#e8403a] text-white border-[#e8403a]'
                    : 'bg-[#f8f8f8] text-[#666] border-[#ececec]',
                ]"
                @click="handleWorkbenchChange(tabIndex)"
              >
                工位{{ tabIndex + 1 }}
              </view>
            </view>
          </scroll-view>
          <view class="grid grid-cols-3 gap-[16rpx] mt-[10rpx]">
            <view
              v-for="(timeScope, index) in currentTimeSlots"
              :key="index"
              :class="[
                'h-[68rpx] rounded-[16rpx] border-2 border-solid flex items-center justify-center text-[26rpx] transition-colors duration-200',
                !isTimeSelectable(timeScope)
                  ? 'border-[#eaeaea] text-[#ccc] bg-[#f9f9f9] cursor-not-allowed'
                  : selectedTimeIndex === index
                    ? 'border-[#e8403a] text-[#e8403a] bg-[#fff5f5] font-bold'
                    : 'border-[#f0f0f0] text-[#666] bg-[#fafafa]',
              ]"
              @click="isTimeSelectable(timeScope) && (selectedTimeIndex = index)"
            >
              {{ formatTimeLabel(timeScope.startTime) }}
            </view>
          </view>
          <view
            v-if="
              currentDaySchedule && currentTimeSlots.filter(s => isTimeSelectable(s)).length === 0
            "
            class="text-center text-[26rpx] text-[#e8403a] mt-[20rpx]"
          >
            该日期暂无可用预约时段，请选择其他日期
          </view>
        </template>
      </view>

      <!-- 支付方式 -->
      <view class="bg-white rounded-[24rpx] mx-[24rpx] mt-[24rpx] mb-[180rpx] p-[30rpx] shadow-sm">
        <view class="flex items-center gap-[12rpx] mb-[24rpx]">
          <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
          <text class="text-[32rpx] font-bold text-[#222]">支付方式</text>
        </view>
        <view class="grid grid-cols-3 gap-[16rpx]">
          <view
            v-for="(item, index) in PAY_TYPE_LIST"
            :key="item"
            class="flex items-center justify-between rounded-[18rpx] border-2 border-solid px-[20rpx] py-[22rpx]"
            :class="
              payType === index + 1
                ? 'border-[#e8403a] bg-[#fff5f5]'
                : 'border-[#f1f1f1] bg-[#fafafa]'
            "
            @click="payType = index + 1"
          >
            <u-icon
              :name="payType === index + 1 ? 'checkmark-circle-fill' : 'checkmark-circle'"
              :color="payType === index + 1 ? '#e8403a' : '#ccc'"
              size="24"
            ></u-icon>
            <text
              class="text-[26rpx] leading-none"
              :class="payType === index + 1 ? 'text-[#e8403a] font-bold' : 'text-[#444]'"
            >
              {{ item }}
            </text>
          </view>
        </view>
      </view>

      <!-- 选择车辆弹框 -->
      <up-popup :show="showVehiclePopup" round="24" mode="bottom" @close="showVehiclePopup = false">
        <view class="px-[30rpx] pt-[30rpx] pb-[calc(env(safe-area-inset-bottom)+30rpx)]">
          <view class="flex items-center justify-between mb-[30rpx]">
            <text class="text-[32rpx] font-bold text-[#222]">选择车辆</text>
            <up-icon
              name="close"
              size="22"
              color="#999"
              @click="showVehiclePopup = false"
            ></up-icon>
          </view>

          <scroll-view scroll-y class="max-h-[600rpx]">
            <up-empty
              v-if="vehicleList.length === 0"
              text="暂无车辆信息"
              icon-size="120"
            ></up-empty>
            <view
              v-for="item in vehicleList"
              :key="item.id"
              :class="[
                'flex items-center gap-[20rpx] rounded-[16rpx] p-[24rpx] mb-[20rpx] border-2 border-solid transition-colors',
                defaultVehicle?.id === item.id
                  ? 'border-[#e8403a] bg-[#fff5f5]'
                  : 'border-[#f0f0f0] bg-white',
              ]"
              @click="handlePickVehicle(item)"
            >
              <image
                v-if="item.coverUrl"
                :src="item.coverUrl"
                class="w-[100rpx] h-[100rpx] rounded-[12rpx] flex-shrink-0 bg-[#f9f9f9]"
                mode="aspectFill"
              />
              <view
                v-else
                class="w-[100rpx] h-[100rpx] rounded-[12rpx] bg-[#f6f6f6] flex items-center justify-center flex-shrink-0"
              >
                <up-icon name="car" size="28" color="#ccc"></up-icon>
              </view>
              <view class="flex-1 flex flex-col gap-[12rpx]">
                <view class="flex items-center justify-between gap-[16rpx]">
                  <view class="flex items-center gap-[16rpx] min-w-0">
                    <text class="text-[#333] text-[32rpx] font-600">{{ item.licensePlate }}</text>
                    <view
                      v-if="item.isDefault"
                      class="bg-[rgba(214,59,53,0.1)] text-[#d63b35] rounded-[8rpx] px-[12rpx] py-[4rpx] text-[20rpx]"
                    >
                      默认
                    </view>
                  </view>
                  <view class="flex items-center gap-[20rpx]" @click.stop>
                    <text class="text-[24rpx] text-[#2b85e4]" @click="handleEditVehicle(item)"
                      >编辑</text
                    >
                    <u-icon
                      :name="
                        defaultVehicle?.id === item.id
                          ? 'checkmark-circle-fill'
                          : 'checkmark-circle'
                      "
                      :size="24"
                      :color="defaultVehicle?.id === item.id ? '#e8403a' : '#ccc'"
                    ></u-icon>
                  </view>
                </view>
                <text class="text-[#666] text-[26rpx]">{{ item.callName || '--' }}</text>
                <text class="text-[#999] text-[24rpx]">{{ item.phone || '--' }}</text>
              </view>
            </view>
          </scroll-view>

          <up-button
            type="error"
            shape="circle"
            text="添加车辆"
            color="#d63b35"
            class="mt-[20rpx]"
            @click="handleAddVehicle"
          ></up-button>
        </view>
      </up-popup>

      <!-- 底部栏 -->
      <view
        class="fixed left-0 right-0 bottom-0 bg-white px-[32rpx] pb-[calc(env(safe-area-inset-bottom)+24rpx)] pt-[20rpx] flex items-center justify-between shadow-[0_-4rpx_16rpx_rgba(0,0,0,0.05)] z-50"
      >
        <view class="flex flex-col gap-[4rpx]">
          <text class="text-[24rpx] text-[#888]">实付金额</text>
          <view class="flex items-baseline gap-[4rpx]">
            <text class="text-[28rpx] text-[#e8403a] font-bold">¥</text>
            <text class="text-[44rpx] text-[#e8403a] font-bold leading-none">{{
              displayPrice
            }}</text>
          </view>
        </view>
        <up-button
          type="error"
          shape="circle"
          :loading="submitting"
          :disabled="submitting"
          :custom-style="{
            width: '240rpx',
            height: '80rpx',
            fontSize: '30rpx',
            fontWeight: 'bold',
            margin: '0',
          }"
          @click="handleSubmit"
        >
          立即预约
        </up-button>
      </view>
    </view>

    <!-- 门店选择弹框 -->
    <StoreSelectPopup
      :show="showStoreSelect"
      :service-code="serviceCode"
      :store-service-id="selectedStoreServiceId"
      :longitude="userStore.location.lng"
      :latitude="userStore.location.lat"
      :selected-store-id="selectedStoreId"
      @update:show="showStoreSelect = $event"
      @update:selected-store-id="selectedStoreId = $event"
      @confirm="handleStoreSelectConfirm"
      @close="handleStoreSelectClose"
    />

    <!-- 用户信息授权弹框 -->
    <UserAuthPopup ref="authPopupRef" v-model:show="showAuthPopup" @cancel="handleAuthCancel" />
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import ShowPhoto from '@/components/ShowPhoto/index.vue'
  import StoreSelectPopup from '@/components/StoreSelectPopup/index.vue'
  import UserAuthPopup from '@/components/UserAuthPopup/index.vue'
  import { ref, computed, onMounted } from 'vue'
  import { onLoad, onShow } from '@dcloudio/uni-app'
  import { useUserStore } from '@/store/user'
  import { findDefault, getList } from '@/api/UserVehicleService'
  import { getStoreDetail, getStoreServiceList } from '@/api/CarStoreService'
  import { submitCarOrder, getAppointmentTimeRange } from '@/api/OrderService'
  import type { CarUserVehicles } from '@/api/UserVehicleService/interfaces'
  import type { StoreServiceListItem, StoreListItem } from '@/api/CarStoreService/interfaces'
  import type { DailySchedule, TimeScope } from '@/api/OrderService/interfaces'

  const userStore = useUserStore()

  const showAuthPopup = ref(false)
  const authPopupRef = ref<InstanceType<typeof UserAuthPopup>>()

  // ========== 路由参数 ==========
  const serviceCode = ref('')
  const selectedStoreId = ref<number>()
  const selectedStoreServiceId = ref<number>()
  const selectedStoreName = ref('')

  // ========== 门店选择弹框 ==========
  const showStoreSelect = ref(false)

  // ========== 默认车辆 ==========
  const defaultVehicle = ref<CarUserVehicles | null>(null)
  const vehicleList = ref<CarUserVehicles[]>([])
  const showVehiclePopup = ref(false)

  const vehicleDesc = computed(() => {
    if (!defaultVehicle.value) return ''
    const v = defaultVehicle.value
    return v.licensePlate || ''
  })

  const vehicleOwnerInfo = computed(() => {
    if (!defaultVehicle.value) return ''
    const v = defaultVehicle.value
    return [v.callName, v.phone].filter(Boolean).join(' · ')
  })

  const fetchDefaultVehicle = async () => {
    try {
      const res = await findDefault()
      defaultVehicle.value = res || null
    } catch {
      defaultVehicle.value = null
    }
  }

  const fetchVehicleList = async () => {
    try {
      const method = getList()
      method.config.cacheFor = 0
      const res = await method
      vehicleList.value = res.list || []
    } catch (e) {
      console.error('获取车辆列表失败', e)
    }
  }

  const handlePickVehicle = (item: CarUserVehicles) => {
    defaultVehicle.value = item
    showVehiclePopup.value = false
  }

  const handleAddVehicle = () => {
    showVehiclePopup.value = false
    uni.navigateTo({ url: '/pages_client/pages/user/vehicle/edit/index' })
  }

  const handleEditVehicle = (item: CarUserVehicles) => {
    if (!item.id) return
    showVehiclePopup.value = false
    uni.navigateTo({ url: `/pages_client/pages/user/vehicle/edit/index?id=${item.id}` })
  }

  // ========== 服务信息 ==========
  const serviceInfo = ref<Partial<StoreServiceListItem>>({})
  // 店铺信息
  const storeInfo = ref<Recordable>({})

  const displayPrice = computed(() => (serviceInfo.value?.price ?? 0).toFixed(2))

  const fetchServiceInfo = async () => {
    if (!serviceCode.value) return
    try {
      const res = await getStoreServiceList({ serviceCode: serviceCode.value })
      const stores = res.list.find(item => item.storeId == selectedStoreId.value)
      storeInfo.value = stores || {}
      if (!selectedStoreName.value && stores?.storeName) {
        selectedStoreName.value = stores.storeName
      }

      let detailMatched = null
      if (selectedStoreId.value) {
        try {
          const detailRes = await getStoreDetail({ id: selectedStoreId.value })
          const detailServiceList = detailRes.carStoreServicesList || []
          detailMatched = serviceCode.value
            ? detailServiceList.find((item: any) => item.serviceCode === serviceCode.value)
            : null

          if (detailMatched && detailMatched.id) {
            selectedStoreServiceId.value = detailMatched.id
          }
        } catch (e) {
          console.error('尝试获取门店详情失败', e)
        }
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const serviceList = stores?.serviceList
      const matched = serviceCode.value
        ? serviceList?.find((item: StoreServiceListItem) => item.serviceCode === serviceCode.value)
        : null
      console.log(matched, serviceCode.value, serviceList)
      serviceInfo.value = matched || detailMatched

      // 服务信息获取成功后，获取预约时间范围
      if (selectedStoreServiceId.value) {
        await fetchAppointmentTimeRange()
      }
    } catch (e) {
      console.error('获取服务信息失败:', e)
    }
  }

  // ========== 预约时间 ==========
  const now = new Date()

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const showDatePicker = ref(false)
  const selectedDate = ref(formatDate(now))
  const selectedTimeIndex = ref(-1)
  const selectedWorkbenchIndex = ref(0)

  // 预约时间相关数据
  const appointmentSchedules = ref<DailySchedule[]>([])
  const loadingAppointmentTime = ref(false)

  // 当前选中日期的可用时间段
  const currentDaySchedule = computed(() => {
    return appointmentSchedules.value.find(item => item.date === selectedDate.value)
  })
  const hasTimelineGroup = computed(() => !!currentDaySchedule.value?.timelineGroup?.length)
  const currentTimelineGroup = computed(() => currentDaySchedule.value?.timelineGroup || [])
  const currentTimeSlots = computed(() => {
    if (hasTimelineGroup.value) {
      return currentTimelineGroup.value[selectedWorkbenchIndex.value] || []
    }
    return currentDaySchedule.value?.freeTimeScope || []
  })
  const isTimeSelectable = (time: TimeScope) => time.selectEnable ?? time.valid
  const formatTimeLabel = (time: string) => time.split(' ')[1]?.slice(0, 5) || time.slice(0, 5)
  const applyScheduleSelection = (schedule?: DailySchedule) => {
    if (!schedule) {
      selectedWorkbenchIndex.value = 0
      selectedTimeIndex.value = -1
      return
    }
    if (schedule.timelineGroup?.length) {
      const workbenchIndex = schedule.timelineGroup.findIndex(group =>
        group.some(item => isTimeSelectable(item))
      )
      selectedWorkbenchIndex.value = workbenchIndex >= 0 ? workbenchIndex : 0
      const currentGroup = schedule.timelineGroup[selectedWorkbenchIndex.value] || []
      const firstValidIdx = currentGroup.findIndex(item => isTimeSelectable(item))
      selectedTimeIndex.value = firstValidIdx >= 0 ? firstValidIdx : -1
      return
    }
    const firstValidIdx = schedule.freeTimeScope.findIndex(item => isTimeSelectable(item))
    selectedTimeIndex.value = firstValidIdx >= 0 ? firstValidIdx : -1
  }
  const handleWorkbenchChange = (index: number) => {
    selectedWorkbenchIndex.value = index
    const slots = currentTimelineGroup.value[index] || []
    const firstValidIdx = slots.findIndex(item => isTimeSelectable(item))
    selectedTimeIndex.value = firstValidIdx >= 0 ? firstValidIdx : -1
  }

  // 日期选择器列数据（up-picker columns 必须是二维数组）
  const datePickerColumns = computed(() => {
    return [appointmentSchedules.value.map(item => item.date)]
  })

  // 获取预约时间范围
  const fetchAppointmentTimeRange = async () => {
    if (!selectedStoreServiceId.value) return

    loadingAppointmentTime.value = true
    try {
      const res = await getAppointmentTimeRange({
        storeServiceId: selectedStoreServiceId.value,
      })
      appointmentSchedules.value = res || []

      // 自动选中第一个有空闲可用时段的日期，若都没有则停留在最后一天
      if (appointmentSchedules.value.length > 0) {
        const available = appointmentSchedules.value.find(s =>
          s.timelineGroup?.length
            ? s.timelineGroup.some(group => group.some(t => isTimeSelectable(t)))
            : s.freeTimeScope.length > 0 && s.freeTimeScope.some(t => isTimeSelectable(t))
        )
        selectedDate.value = available
          ? available.date
          : appointmentSchedules.value[appointmentSchedules.value.length - 1].date

        const schedule =
          available || appointmentSchedules.value.find(s => s.date === selectedDate.value)
        applyScheduleSelection(schedule)
      }
    } catch (e) {
      console.error('获取预约时间失败:', e)
      uni.showToast({ title: '获取预约时间失败', icon: 'none' })
    } finally {
      loadingAppointmentTime.value = false
    }
  }

  const handleDateConfirm = (e: { value: string[] }) => {
    const value = e.value?.[0]
    if (value && value !== selectedDate.value) {
      selectedDate.value = value
      const schedule = appointmentSchedules.value.find(s => s.date === value)
      applyScheduleSelection(schedule)
    }
    showDatePicker.value = false
  }

  // ========== 门店选择 ==========
  const handleStoreSelectConfirm = (store: StoreListItem) => {
    selectedStoreId.value = store.stores.id
    selectedStoreName.value = store.stores.name
  }

  const handleStoreSelectClose = () => {
    // 弹框关闭时的清理逻辑
  }

  // ========== 支付方式 ==========
  const PAY_TYPE_LIST = ['现金', '抵扣券', '套餐卡']
  const payType = ref(1)
  const phoneRegExp = /^1[3-9]\d{9}$/

  // ========== 提交预约 ==========
  const submitting = ref(false)

  const handleSubmit = async () => {
    if (submitting.value) return
    if (!defaultVehicle.value?.id) {
      return uni.showToast({ title: '请先选择车辆', icon: 'none' })
    }
    if (!defaultVehicle.value.licensePlate) {
      return uni.showToast({ title: '请先完善车牌号', icon: 'none' })
    }
    if (!defaultVehicle.value.callName) {
      return uni.showToast({ title: '请先完善车主称呼', icon: 'none' })
    }
    if (!defaultVehicle.value.phone) {
      return uni.showToast({ title: '请先完善联系电话', icon: 'none' })
    }
    if (!phoneRegExp.test(defaultVehicle.value.phone)) {
      return uni.showToast({ title: '联系电话格式不正确', icon: 'none' })
    }
    if (!selectedStoreId.value) {
      return uni.showToast({ title: '请先选择门店', icon: 'none' })
    }
    if (!selectedDate.value) {
      return uni.showToast({ title: '请选择预约日期', icon: 'none' })
    }

    const timeScope = currentTimeSlots.value[selectedTimeIndex.value]
    if (!timeScope) {
      return uni.showToast({ title: '请选择预约时间', icon: 'none' })
    }
    const appointmentTime = timeScope.startTime

    submitting.value = true
    try {
      const res = await submitCarOrder({
        appointmentTime,
        payType: payType.value,
        serviceCode: serviceCode.value,
        storeId: selectedStoreId.value,
        storeServiceId: selectedStoreServiceId.value || 0,
        vehiclesId: defaultVehicle.value.id,
        licensePlate: defaultVehicle.value.licensePlate,
        callName: defaultVehicle.value.callName,
        phone: defaultVehicle.value.phone,
        userId: userStore.userId || 0,
      })
      uni.showToast({ title: '预约成功', icon: 'success' })
      const orderId = (res as any)?.id || (res as any)?.orderId || ''
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages_client/pages/order/detail/index?orderId=${orderId}`,
        })
      }, 1500)
    } catch (e: any) {
      console.error('提交预约失败:', e)
      uni.showToast({
        title: e?.data?.errmsg || '预约失败，请重试',
        icon: 'none',
      })
    } finally {
      submitting.value = false
    }
  }

  // ========== 导航跳转 ==========
  const handleSelectCar = () => {
    fetchVehicleList()
    showVehiclePopup.value = true
  }

  const handleSelectStore = () => {
    if (!serviceCode.value) {
      uni.showToast({ title: '请先选择服务', icon: 'none' })
      return
    }
    showStoreSelect.value = true
  }

  const handleAuthCancel = () => {
    uni.navigateBack()
  }

  // ========== 生命周期 ==========
  onLoad(options => {
    if (options?.serviceCode) serviceCode.value = options.serviceCode
    if (options?.storeId) selectedStoreId.value = Number(options.storeId)
    if (options?.storeServiceId) selectedStoreServiceId.value = Number(options.storeServiceId)
    if (options?.storeName) selectedStoreName.value = decodeURIComponent(options.storeName)
    fetchServiceInfo()
  })

  onShow(() => {
    fetchDefaultVehicle()
  })
  onMounted(() => {
    authPopupRef.value?.checkAndShow()
  })
</script>
