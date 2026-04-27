<template>
  <DefaultLayout>
    <view class="flex flex-col h-full bg-[#f6f6f6]">
      <!-- Tabs -->
      <view class="bg-white sticky top-0 z-10">
        <up-tabs
          :list="tabList"
          :current="currentTab"
          line-color="#e8403a"
          active-color="#e8403a"
          inactive-color="#333"
          item-style="height: 88rpx; padding: 0 30rpx;"
          @click="handleTabClick"
        ></up-tabs>
      </view>

      <!-- Order List -->
      <view class="flex-1 h-0 px-[24rpx] pt-[20rpx]">
        <LoadingMore
          ref="loadingMoreRef"
          :height="'100%'"
          :api="fetchOrderList"
          :params="queryParams"
          :limit="10"
          empty-mode="order"
          empty-text="暂无相关订单"
        >
          <template #item="{ item }">
            <view class="bg-white rounded-[16rpx] p-[24rpx] mb-[20rpx]" @click="handleDetail(item)">
              <!-- 订单编号 + 状态 -->
              <view class="flex justify-between items-center mb-[24rpx]">
                <text class="text-[26rpx] text-[#333]">
                  订单编号:{{ (item as unknown as OrderListItem).orderSn }}
                </text>
                <up-tag
                  :text="mapOrderStatus(item as unknown as OrderListItem)"
                  :type="mapOrderStatusType(item as unknown as OrderListItem)"
                  size="mini"
                  plain
                  plain-fill
                ></up-tag>
              </view>

              <!-- 服务信息 -->
              <view class="flex gap-[20rpx] mb-[24rpx]">
                <image
                  v-if="(item as unknown as OrderListItem).storeInfo?.picUrl"
                  :src="(item as unknown as OrderListItem).storeInfo?.picUrl"
                  class="w-[140rpx] h-[140rpx] rounded-[12rpx] bg-gray-100"
                  mode="aspectFill"
                ></image>
                <ImgEmpty v-else width="140rpx" height="140rpx" text-size="22rpx" :size="28" />
                <view class="flex-1 flex flex-col justify-between py-[4rpx]">
                  <view class="flex justify-between items-start">
                    <text class="text-[30rpx] font-600 text-[#222]">
                      {{ (item as unknown as OrderListItem).serviceName }}
                    </text>
                    <text class="text-[24rpx] text-[#666]">
                      {{ mapPayType((item as unknown as OrderListItem).payType) }}
                    </text>
                  </view>
                  <view class="text-[26rpx] text-[#666] flex items-center gap-[12rpx]">
                    <view>
                      <view>{{
                        (item as unknown as OrderListItem).userName ||
                        (item as unknown as OrderListItem).consignee
                      }}</view>
                      <view>{{
                        (item as unknown as OrderListItem).mobile ||
                        (item as unknown as OrderListItem).userMobile
                      }}</view>
                    </view>
                    <text class="text-[#ccc]">|</text>
                    <text>{{ (item as unknown as OrderListItem).appointmentTime }}</text>
                  </view>
                </view>
              </view>

              <!-- 已派遣人员 -->
              <view
                v-if="
                  (item as unknown as OrderListItem).staff &&
                  (item as unknown as OrderListItem).staff.length > 0
                "
                class="flex items-center gap-[12rpx] mb-[16rpx] px-[8rpx]"
              >
                <text class="text-[24rpx] text-[#999] flex-shrink-0">已派遣:</text>
                <view class="flex items-center gap-[8rpx] flex-wrap">
                  <view
                    v-for="s in (item as unknown as OrderListItem).staff"
                    :key="s.id"
                    class="flex items-center gap-[6rpx] bg-[#f5f5f5] rounded-[8rpx] px-[12rpx] py-[4rpx]"
                  >
                    <image
                      :src="s.avatarUrl || '/static/default-avatar.png'"
                      class="w-[32rpx] h-[32rpx] rounded-50%"
                      mode="aspectFill"
                    />
                    <text class="text-[22rpx] text-[#666]">{{ s.name }}</text>
                  </view>
                </view>
              </view>

              <!-- 车辆信息 -->
              <view
                v-if="(item as unknown as OrderListItem).vehicles"
                class="flex items-center gap-[12rpx] mb-[16rpx] bg-[#f9f9f9] rounded-[8rpx] p-[12rpx]"
              >
                <image
                  v-if="(item as unknown as OrderListItem).vehicles.coverUrl"
                  :src="(item as unknown as OrderListItem).vehicles.coverUrl"
                  class="w-[64rpx] h-[64rpx] rounded-[8rpx] flex-shrink-0"
                  mode="aspectFill"
                />
                <ImgEmpty v-else width="64rpx" height="64rpx" text-size="12rpx" :size="20" />
                <view class="flex-1 min-w-0">
                  <text class="text-[24rpx] text-[#333] block truncate">
                    {{ (item as unknown as OrderListItem).vehicles.brand }}
                    {{ (item as unknown as OrderListItem).vehicles.model }}
                  </text>
                  <text class="text-[22rpx] text-[#999]">
                    {{ (item as unknown as OrderListItem).vehicles.licensePlate }}
                  </text>
                </view>
              </view>

              <view
                v-if="(item as unknown as OrderListItem).comment"
                class="mb-[16rpx] rounded-[12rpx] bg-[#fff7f2] p-[16rpx]"
              >
                <view class="mb-[8rpx] flex items-center justify-between gap-[16rpx]">
                  <text class="text-[24rpx] font-600 text-[#222]">评论</text>
                  <view class="flex items-center gap-[8rpx] text-[22rpx] text-[#f5a623]">
                    <up-rate
                      :model-value="(item as unknown as OrderListItem).comment?.star ?? 5"
                      :size="12"
                      active-color="#f5a623"
                      :gutter="2"
                      readonly
                    />
                    <text
                      >{{
                        ((item as unknown as OrderListItem).comment?.star ?? 5) as number
                      }}分</text
                    >
                  </view>
                </view>
                <text class="block text-[24rpx] leading-[36rpx] text-[#555]">
                  {{
                    (item as unknown as OrderListItem).comment?.content || '该用户未填写文字评价'
                  }}
                </text>
              </view>

              <!-- 操作按钮: 仅"已支付"显示派遣 -->
              <view>
                <OrderActionButtons
                  v-if="(item as unknown as OrderListItem).handleOption"
                  :order="item"
                  :handle-option="(item as unknown as OrderListItem).handleOption"
                  role="manager"
                  @refresh="refreshOrder"
                />
              </view>
            </view>
          </template>
        </LoadingMore>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import ImgEmpty from '@/components/ImgEmpty/index.vue'
  import LoadingMore from '@/components/LoadingMore/index.vue'
  import OrderActionButtons from '@/components/OrderActionButtons/index.vue'
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { getOrderList } from '@/api/OrderService'
  import { getOrderDisplayStatusConfig } from '@/api/OrderService/interfaces'
  import type { OrderListItem } from '@/api/OrderService/interfaces'

  const loadingMoreRef = ref<InstanceType<typeof LoadingMore>>()

  const refreshOrder = async () => {
    console.log('refreshOrder', '==================')
    loadingMoreRef.value?.fetchList('refresh')
  }

  onMounted(() => {
    uni.$on('refreshOrderList', refreshOrder)
  })

  onUnmounted(() => {
    uni.$off('refreshOrderList', refreshOrder)
  })

  // ========== Tab 配置 (stateType: 0~5) ==========
  const tabList = ref([
    { name: '全部' },
    { name: '待核验' },
    { name: '待付款' },
    { name: '已付款' },
    { name: '服务中' },
    { name: '待确认' },
    { name: '已完成' },
  ])
  const currentTab = ref(0)

  const queryParams = computed<Record<string, unknown>>(() => ({
    orderType: '1',
    stateType: currentTab.value === 0 ? undefined : currentTab.value - 1,
  }))

  const mapOrderStatus = (order: OrderListItem) => getOrderDisplayStatusConfig(order).text

  const mapOrderStatusType = (order: OrderListItem) => getOrderDisplayStatusConfig(order).tagType

  const mapPayType = (payType?: number) => {
    switch (payType) {
      case 1:
        return '现金支付'
      case 2:
        return '抵扣券支付'
      case 3:
        return '在线支付'
      default:
        return '现金支付'
    }
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    const match = time.match(/(\d{2}):(\d{2})/)
    return match ? `${match[1]}:${match[2]}` : time
  }

  // ========== 请求适配 ==========
  const fetchOrderList = (params: any) => {
    const { page, limit, ...rest } = params
    return getOrderList({
      ...rest,
      pageNumber: page,
      pageSize: limit,
    })
  }

  const handleTabClick = (_item: any, index: number) => {
    currentTab.value = index
  }

  const handleDetail = (item: unknown) => {
    const orderItem = item as OrderListItem
    uni.navigateTo({
      url: `/pages_client/pages/order/detail/index?orderId=${orderItem.id}`,
    })
  }

  // ========== 角色映射 ==========
  const STAFF_ROLE_MAP: Record<string, string> = {
    '1': '店长',
    '2': '技师',
    '3': '接待',
  }
  const mapStaffRole = (role?: string) => STAFF_ROLE_MAP[role ?? ''] ?? '员工'
</script>

<style lang="scss" scoped></style>
