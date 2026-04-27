<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-[#f6f6f6] pb-180rpx">
      <!-- 顶部状态横幅 -->
      <view class="bg-[#ff6b6b] px-30rpx py-30rpx flex items-start gap-20rpx">
        <view
          class="w-60rpx h-60rpx rounded-50% border-2rpx border-white flex items-center justify-center mt-4rpx flex-shrink-0"
        >
          <up-icon :name="statusIcon" size="32" color="#fff"></up-icon>
        </view>
        <view class="flex-1">
          <text class="text-32rpx font-600 color-white block mb-8rpx">
            {{ detail.orderStatusText || '加载中...' }}
          </text>
          <text class="text-26rpx color-white op-90 leading-relaxed">{{ statusDesc }}</text>
        </view>
      </view>

      <!-- 服务信息 -->
      <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">服务信息</view>
      <view
        class="bg-white rounded-16rpx mx-24rpx p-24rpx flex flex-col gap-12rpx"
        @click.stop="handleToDetails"
      >
        <view class="flex items-center justify-between">
          <text class="text-30rpx font-600 color-[#222]">{{ detail.serviceName || '-' }}</text>
          <text class="text-28rpx font-600 color-[#e8403a]">
            ¥ {{ (detail.actualPrice ?? 0).toFixed(2) }}
          </text>
        </view>
        <view class="flex items-center gap-8rpx">
          <up-icon name="clock" size="24" color="#999"></up-icon>
          <text class="text-24rpx color-[#888]">
            预约时间：{{ detail.appointmentTime || '-' }}
          </text>
        </view>
        <view class="flex items-center gap-8rpx">
          <up-icon name="map" size="24" color="#999"></up-icon>
          <text class="text-24rpx color-[#888]">地址：{{ detail.address || '-' }}</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <up-icon name="home" size="24" color="#999"></up-icon>
          <text class="text-24rpx color-[#888]"> 门店：{{ detail?.storeInfo?.name || '-' }} </text>
        </view>
      </view>

      <!-- 车辆信息 -->
      <view v-if="hasVehicleSection">
        <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">车辆信息</view>
        <view class="bg-white rounded-16rpx mx-24rpx p-24rpx flex items-center gap-16rpx">
          <image
            v-if="detail.vehicles.coverUrl"
            :src="detail.vehicles.coverUrl"
            class="w-100rpx h-100rpx rounded-12rpx flex-shrink-0 bg-[#f6f6f6]"
            mode="aspectFill"
          />
          <view
            v-else
            class="w-100rpx h-100rpx rounded-12rpx bg-[#f6f6f6] flex items-center justify-center flex-shrink-0"
          >
            <up-icon name="car" size="28" color="#ccc"></up-icon>
          </view>
          <view class="flex-1 flex flex-col gap-8rpx min-w-0">
            <text v-if="displayLicensePlate" class="text-30rpx font-600 color-[#333]">
              {{ displayLicensePlate }}
            </text>
            <text v-if="displayCallName" class="text-26rpx color-[#666]"
              >车主：{{ displayCallName }}</text
            >
            <text v-if="displayPhone" class="text-24rpx color-[#999]"
              >电话：{{ displayPhone }}</text
            >
          </view>
          <view v-if="canEditVehicle" class="flex-shrink-0 self-center">
            <up-button
              type="error"
              size="mini"
              shape="circle"
              plain
              text="修改车辆"
              :custom-style="vehicleActionStyle"
              @click.stop="openVehiclePopup"
            />
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">费用明细</view>
      <view class="bg-white rounded-16rpx mx-24rpx p-24rpx">
        <view class="flex items-center justify-between py-12rpx border-b-2rpx border-[#f2f2f2]">
          <text class="text-26rpx color-[#666]">服务费用</text>
          <text class="text-26rpx color-[#333]"> ¥ {{ (detail.goodsPrice ?? 0).toFixed(2) }}</text>
        </view>
        <view class="flex items-center justify-between pt-16rpx">
          <text class="text-26rpx color-[#666]">实付金额</text>
          <text class="text-30rpx font-600 color-[#e8403a]">
            ¥ {{ (detail.actualPrice ?? 0).toFixed(2) }}
          </text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">订单信息</view>
      <view class="bg-white rounded-16rpx mx-24rpx p-24rpx flex flex-col gap-16rpx">
        <view class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">订单编号</text>
          <view class="flex items-center gap-10rpx">
            <text class="text-26rpx color-[#333]">{{ detail.orderSn || '-' }}</text>
            <text class="text-22rpx color-[#e8403a]" @click="copyOrderSn">复制</text>
          </view>
        </view>
        <view class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">下单时间</text>
          <text class="text-26rpx color-[#333]">{{ detail.addTime || '-' }}</text>
        </view>
        <view class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">支付方式</text>
          <text class="text-26rpx color-[#333]">{{ payTypeText }}</text>
        </view>
        <view v-if="displayCallName" class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">车主称呼</text>
          <text class="text-26rpx color-[#333]">{{ displayCallName }}</text>
        </view>
        <view v-if="displayPhone" class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">联系电话</text>
          <text class="text-26rpx color-[#333]">{{ displayPhone }}</text>
        </view>
        <view class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">订单状态</text>
          <text class="text-26rpx color-[#e8403a]">{{ detail.orderStatusText || '-' }}</text>
        </view>
        <view v-if="detail.message" class="flex items-center justify-between">
          <text class="text-26rpx color-[#888]">备注</text>
          <text class="text-26rpx color-[#333]">{{ detail.message }}</text>
        </view>
      </view>

      <!-- 服务人员 -->
      <view v-if="detail.staff && detail.staff.length > 0">
        <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">服务人员</view>
        <view class="bg-white rounded-16rpx mx-24rpx p-24rpx flex flex-col gap-16rpx">
          <view v-for="s in detail.staff" :key="s.id" class="flex items-center gap-16rpx">
            <image
              :src="s.avatarUrl || '/static/default-avatar.png'"
              class="w-72rpx h-72rpx rounded-50% flex-shrink-0"
              mode="aspectFill"
            />
            <view class="flex flex-col gap-4rpx">
              <text class="text-28rpx color-[#333] font-500">{{ s.name || '-' }}</text>
              <text class="text-24rpx color-[#888]">{{ s.phone || '' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 服务进度 -->
      <view v-if="detail.eventList && detail.eventList.length > 0">
        <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">服务进度</view>
        <view class="bg-white rounded-16rpx mx-24rpx p-24rpx">
          <view v-for="(evt, index) in detail.eventList" :key="evt.id" class="flex gap-16rpx">
            <!-- 左侧时间线 -->
            <view class="flex flex-col items-center flex-shrink-0">
              <view
                class="w-40rpx h-40rpx rounded-50% flex items-center justify-center text-22rpx color-white"
                :class="index === 0 ? 'bg-[#e8403a]' : 'bg-[#ff8a8a]'"
              >
                {{ index + 1 }}
              </view>
              <view
                v-if="index < detail.eventList.length - 1"
                class="w-2rpx flex-1 bg-[#e5e5e5] my-8rpx"
              ></view>
            </view>
            <!-- 右侧内容 -->
            <view class="flex-1 pb-30rpx">
              <view class="flex items-center gap-12rpx mb-6rpx">
                <image
                  :src="evt.avatar || '/static/default-avatar.png'"
                  class="w-40rpx h-40rpx rounded-50% flex-shrink-0"
                  mode="aspectFill"
                />
                <text class="text-26rpx color-[#333] font-500">{{ evt.nickname || '-' }}</text>
                <text
                  v-if="evt.roleName"
                  class="text-22rpx color-[#ff6b6b] bg-[#fff0f0] px-8rpx py-2rpx rounded-4rpx"
                  >{{ evt.roleName }}</text
                >
              </view>
              <text class="text-24rpx color-[#999] block mb-8rpx">{{ evt.addTime || '' }}</text>

              <view class="text-26rpx color-[#333] mb-12rpx font-500">
                {{ getEventTypeText(evt.orderEventType) }}
              </view>

              <!-- 描述/备注 -->
              <view
                v-if="evt.remark"
                class="text-26rpx color-[#666] mb-16rpx bg-[#f9f9f9] p-16rpx rounded-8rpx leading-relaxed"
              >
                {{ evt.remark }}
              </view>

              <!-- 指派人员详情 -->
              <view
                v-if="evt.orderEventType === 2 && evt.extra"
                class="mb-16rpx bg-[#f9f9f9] p-16rpx rounded-8rpx"
              >
                <view class="mb-8rpx color-[#999] text-24rpx">指派员工：</view>
                <view
                  v-for="(staff, sIdx) in parseExtraStaff(evt.extra)"
                  :key="sIdx"
                  class="flex items-center gap-12rpx mb-8rpx last:mb-0"
                >
                  <image
                    :src="staff.avatarUrl || staff.avatar || '/static/default-avatar.png'"
                    class="w-48rpx h-48rpx rounded-50% flex-shrink-0 bg-gray-200"
                    mode="aspectFill"
                  />
                  <text class="text-26rpx color-[#333] font-500">{{ staff.name || '-' }}</text>
                </view>
              </view>

              <!-- 图片 -->
              <view v-if="evt.picUrls" class="flex flex-wrap gap-16rpx">
                <image
                  v-for="(img, imgIdx) in evt.picUrls.split(',').filter(Boolean)"
                  :key="imgIdx"
                  :src="img"
                  class="w-160rpx h-160rpx rounded-8rpx"
                  mode="aspectFill"
                  @click="previewImage(evt.picUrls.split(',').filter(Boolean), imgIdx)"
                />
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="detail.comment">
        <view class="text-30rpx font-600 color-[#222] px-24rpx pt-20rpx pb-10rpx">评价信息</view>
        <view class="bg-white rounded-16rpx mx-24rpx p-20rpx shadow-sm">
          <view class="p-20rpx">
            <view class="flex justify-between items-start">
              <view class="flex items-center gap-8rpx">
                <up-rate
                  :model-value="detail.comment.star ?? 5"
                  :size="14"
                  active-color="#f5a623"
                  :gutter="2"
                  readonly
                />
                <text class="text-22rpx text-[#f5a623] font-500">
                  {{ ((detail.comment.star ?? 5) as number).toFixed(1) }}分
                </text>
              </view>
              <text class="text-22rpx text-[#999] mt-4rpx">
                {{ formatCommentDate(detail.comment.addTime) }}
              </text>
            </view>

            <text class="text-28rpx text-[#444] leading-relaxed mt-16rpx block">
              {{ detail.comment.content || '该用户未填写文字评价' }}
            </text>

            <view v-if="commentImages.length > 0" class="grid grid-cols-3 gap-12rpx mt-16rpx">
              <image
                v-for="(img, imgIdx) in commentImages"
                :key="imgIdx"
                :src="img"
                class="w-full h-180rpx rounded-12rpx bg-[#f5f5f5]"
                mode="aspectFill"
                @click.stop="previewImage(commentImages, imgIdx)"
              />
            </view>

            <view
              v-if="detail.comment.adminContent"
              class="mt-12rpx bg-[#f9f9f9] rounded-12rpx p-20rpx"
            >
              <text class="text-24rpx text-[#e8403a] font-500">商家回复：</text>
              <text class="text-24rpx text-[#666]">{{ detail.comment.adminContent }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view
      v-if="hasActions && detail.handleOption"
      class="fixed left-0 right-0 bottom-0 bg-white px-24rpx pt-20rpx flex justify-end gap-20rpx z-10"
      style="
        box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
        padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
      "
    >
      <OrderActionButtons
        :order="detail"
        :handle-option="detail.handleOption"
        role="client"
        :is-detail="true"
        @refresh="handleRefresh"
      />
    </view>

    <OrderEventPopup
      v-model:show="showVehiclePopup"
      :order-id="detail.id || 0"
      action-type="staffUpdateVehicle"
      title="修改车辆信息"
      @success="handleVehicleUpdateSuccess"
    />
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import OrderActionButtons from '@/components/OrderActionButtons/index.vue'
  import OrderEventPopup from '@/components/OrderEventPopup/index.vue'
  import { getOrderDetail, getOrderDetailBySn } from '@/api/OrderService'
  import { OrderStatus, getOrderDisplayStatusConfig } from '@/api/OrderService/interfaces'
  import type { OrderListItem } from '@/api/OrderService/interfaces'
  import { UserRole, useUserStore } from '@/store/user'
  import { useCategoryStore } from '@/store/category'

  const userStore = useUserStore()
  const categoryStore = useCategoryStore()

  // ========== 详情数据 ==========
  interface OrderDetail extends OrderListItem {
    orderStatusText?: string
  }

  const detail = ref<Partial<OrderDetail>>({})
  const hasRedirectedAfterError = ref(false)
  const showVehiclePopup = ref(false)

  const redirectToHomeByRole = () => {
    if (hasRedirectedAfterError.value) return
    hasRedirectedAfterError.value = true

    const url =
      userStore.role === UserRole.CLIENT ? '/pages/client/home/index' : '/pages/staff/home/index'

    setTimeout(() => {
      uni.switchTab({ url })
    }, 1500)
  }

  const fetchDetail = async (options: { orderId?: number; orderSn?: string }) => {
    try {
      const res = options.orderSn
        ? await getOrderDetailBySn({ orderSn: options.orderSn })
        : await getOrderDetail({ orderId: options.orderId })
      const cfg = getOrderDisplayStatusConfig(res)
      // eslint-disable-next-line no-constant-binary-expression
      detail.value = { ...res, orderStatusText: cfg.text } || {}
    } catch (e) {
      console.error('获取订单详情失败', e)
      uni.showToast({ title: '订单不存在或已失效，即将返回首页', icon: 'none', duration: 1500 })
      redirectToHomeByRole()
    }
  }

  const handleRefresh = (orderId: number) => {
    if (orderId)
      fetchDetail({
        orderId,
      })
  }

  const DETAIL_STATUS_EXTRA: Record<number, { icon: string; desc: string }> = {
    [OrderStatus.CREATE]: {
      icon: 'clock',
      desc: '您的订单已提交，请按照预约时间前往门店进行核验。',
    },
    [OrderStatus.USER_CANCEL]: { icon: 'close-circle', desc: '订单已取消。' },
    [OrderStatus.CANCEL]: { icon: 'close-circle', desc: '订单已取消。' },
    [OrderStatus.STAFF_CANCEL]: { icon: 'close-circle', desc: '订单已取消。' },
    [OrderStatus.ADMIN_CANCEL]: { icon: 'close-circle', desc: '订单已取消。' },
    [OrderStatus.CHECKED]: { icon: 'rmb-circle', desc: '订单已到店，请尽快完成支付。' },
    [OrderStatus.PAY]: { icon: 'car', desc: '订单已支付，等待分配技师。' },
    [OrderStatus.SHIP]: { icon: 'car', desc: '技师已分配，服务进行中。' },
    [OrderStatus.SERVICE_COMPLETED]: {
      icon: 'checkmark-circle',
      desc: '服务已完成，请确认完成。',
    },
    [OrderStatus.CONFIRM]: { icon: 'checkmark-circle', desc: '服务已完成，感谢您的信任!' },
    [OrderStatus.AUTO_CONFIRM]: { icon: 'checkmark-circle', desc: '服务已完成（系统自动确认）!' },
  }

  const DEFAULT_EXTRA = { icon: 'info-circle', desc: '订单处理中，请耐心等待。' }

  const displayStatus = computed(() => {
    if (
      (detail.value.payed === 1 || detail.value.payed === true) &&
      [OrderStatus.CREATE, OrderStatus.CHECKED, OrderStatus.PAY].includes(
        detail.value.orderStatus as OrderStatus
      )
    ) {
      return OrderStatus.PAY
    }
    return detail.value.orderStatus
  })

  const statusConfig = computed(() => {
    const s = displayStatus.value!
    return {
      ...getOrderDisplayStatusConfig(detail.value),
      ...(DETAIL_STATUS_EXTRA[s] ?? DEFAULT_EXTRA),
    }
  })

  const statusIcon = computed(() => statusConfig.value.icon)

  const statusDesc = computed(() => statusConfig.value.desc)

  const displayLicensePlate = computed(() => detail.value.vehicles?.licensePlate || '')
  const displayCallName = computed(
    () => detail.value.callName || detail.value.vehicles?.callName || ''
  )
  const displayPhone = computed(
    () => detail.value.phone || detail.value.mobile || detail.value.vehicles?.phone || ''
  )
  const hasVehicleSection = computed(
    () =>
      !!detail.value.vehicles &&
      !!(
        detail.value.vehicles?.coverUrl ||
        displayLicensePlate.value ||
        displayCallName.value ||
        displayPhone.value
      )
  )
  const canEditVehicle = computed(() => !!detail.value.handleOption?.staffUpdateVehicle)
  const vehicleActionStyle = {
    minWidth: '112rpx',
    height: '44rpx',
    margin: '0',
    padding: '0 14rpx',
    fontSize: '20rpx',
    flexShrink: '0',
  }
  const commentImages = computed(() => {
    const comment = detail.value.comment
    if (!comment?.hasPicture) return []
    if (Array.isArray(comment.picUrls)) return comment.picUrls.filter(Boolean)
    return []
  })
  const formatCommentDate = (value?: string) => value || ''

  // ========== 支付方式文本 ==========
  const payTypeText = computed(() => {
    const t = detail.value.payType
    if (t === 1) return '现金支付'
    if (t === 2) return '抵扣券支付'
    if (t === 3) return '在线支付'
    return '-'
  })

  // ========== 解析额外指派人员信息 ==========
  const parseExtraStaff = (extra: string) => {
    try {
      return JSON.parse(extra)
    } catch {
      return []
    }
  }

  // ========== 事件类型文本 ==========
  const getEventTypeText = (type: number) => {
    const map: Record<number, string> = {
      1: '上传图片',
      2: '指派技师',
      3: '修改预约时间',
      11: '开始服务',
      12: '结束服务',
      101: '创建订单',
      102: '用户取消订单',
      103: '取消订单',
      104: '核销二维码',
      105: '店长取消订单',
      106: '管理员取消订单',
      201: '确认付款',
      301: '开始服务',
      302: '完成服务',
      401: '确认完成',
      402: '系统自动确认完成',
    }
    return map[type] || `状态更新(${type})`
  }

  // ========== 预览图片 ==========
  const previewImage = (urls: string[], current: number) => {
    uni.previewImage({
      urls,
      current,
    })
  }

  // ========== 是否有操作按钮 ==========
  const hasActions = computed(() => {
    const opt = detail.value.handleOption
    if (!opt) return false
    return Object.entries(opt).some(([key, val]) => key !== 'staffUpdateVehicle' && !!val)
  })

  const openVehiclePopup = () => {
    showVehiclePopup.value = true
  }

  const handleVehicleUpdateSuccess = () => {
    if (detail.value.id) {
      handleRefresh(detail.value.id)
    }
  }

  // ========== 复制订单号 ==========
  const copyOrderSn = () => {
    if (!detail.value.orderSn) return
    uni.setClipboardData({
      data: detail.value.orderSn,
      success: () => {
        uni.showToast({ title: '已复制', icon: 'success' })
      },
    })
  }

  // ========== 生命周期 ==========
  onLoad(options => {
    if (options?.orderId) {
      fetchDetail({
        orderId: Number(options.orderId),
      })
    }
    if (options?.orderSn) {
      fetchDetail({
        orderSn: options.orderSn,
      })
      if (categoryStore.scene === options.orderSn) {
        categoryStore.clearScene()
      }
    }
    if (options?.scene) {
      fetchDetail({
        orderSn: options.scene,
      })
    }
    if (!userStore.token) {
      if (options?.scene || options?.orderSn) {
        categoryStore.setScene(options?.scene || options?.orderSn)
      }
    }
  })

  const handleToDetails = () => {
    uni.navigateTo({
      url: `/pages_client/pages/service/details/index?id=${detail.value.storeServicesId}`,
    })
  }
</script>
