<template>
  <DefaultLayout>
    <view class="flex flex-col h-full">
      <up-tabs
        :list="tabList"
        :current="currentTab"
        :active-style="{
          color: '#FF2727',
          fontWeight: 'bold',
        }"
        line-height="0px"
        @click="handleTabClick"
      ></up-tabs>

      <view class="flex-1 h-0 px-[24rpx] pt-[20rpx]">
        <LoadingMore
          ref="listRef"
          :height="'100%'"
          :api="fetchOrderList"
          :params="queryParams"
          :limit="10"
          empty-mode="order"
          empty-text="暂无相关订单"
        >
          <template #item="{ item }">
            <view class="bg-white rounded-[16rpx] p-[20rpx] mb-[20rpx]" @click="handleDetail(item)">
              <view
                class="flex items-center justify-between border-b border-[#f9f9f9] pb-[20rpx] mb-[20rpx]"
              >
                <text class="text-[26rpx] text-[#333]">
                  订单编号:{{ (item as unknown as OrderListItem).orderSn }}
                </text>
                <up-tag
                  plain-fill
                  size="mini"
                  :text="mapStatus(item as unknown as OrderListItem).text"
                  :type="mapStatus(item as unknown as OrderListItem).tagType"
                  plain
                ></up-tag>
              </view>
              <view class="flex gap-[24rpx]">
                <view class="flex-1 flex flex-col p-0">
                  <view class="flex gap-[12rpx]">
                    <image
                      :src="(item as unknown as OrderListItem)?.storeInfo?.picUrl"
                      class="w-[100rpx] h-[100rpx] rounded-[12rpx]"
                      mode="aspectFill"
                      @click.stop="handleToStore(item)"
                    ></image>
                    <view class="flex-1">
                      <view class="flex justify-between">
                        <text class="text-[30rpx] font-600 text-[#222]">
                          {{ (item as unknown as OrderListItem).serviceName }}
                        </text>
                        <text class="text-[32rpx] font-600 text-[#333]">
                          ¥
                          {{
                            (item as unknown as OrderListItem).actualPrice ??
                            (item as unknown as OrderListItem).orderPrice ??
                            (item as unknown as OrderListItem).goodsPrice ??
                            0
                          }}
                        </text>
                      </view>
                      <text class="text-[24rpx] text-[#999] mt-[8rpx] block">
                        {{ (item as unknown as OrderListItem).message }}
                      </text>
                    </view>
                  </view>
                  <text class="text-[24rpx] text-[#666] mt-[8rpx]">
                    预约时间：
                    {{
                      (item as unknown as OrderListItem).appointmentTime ??
                      (item as unknown as OrderListItem).addTime ??
                      (item as unknown as OrderListItem).payTime
                    }}
                  </text>
                  <view class="flex justify-between items-center">
                    <text class="text-[24rpx] text-[#666] mt-[8rpx]">
                      服务门店：{{ item.storeInfo.name || item.address }}
                    </text>
                  </view>
                  <!-- 车辆信息 -->
                  <view
                    v-if="(item as unknown as OrderListItem).vehicles"
                    class="flex items-center gap-[12rpx] mt-[16rpx] bg-[#f9f9f9] rounded-[8rpx] p-[12rpx]"
                  >
                    <image
                      :src="(item as unknown as OrderListItem).vehicles.coverUrl"
                      class="w-[64rpx] h-[64rpx] rounded-[8rpx] flex-shrink-0"
                      mode="aspectFill"
                    />
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
                  <view v-if="(item as unknown as OrderListItem).handleOption" class="pt-16rpx">
                    <OrderActionButtons
                      :order="item"
                      :handle-option="(item as unknown as OrderListItem).handleOption"
                      role="client"
                      size="mini"
                      @refresh="refreshList"
                    />
                  </view>
                </view>
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
  import LoadingMore from '@/components/LoadingMore/index.vue'
  import OrderActionButtons from '@/components/OrderActionButtons/index.vue'
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { getOrderList } from '@/api/OrderService'
  import { getOrderDisplayStatusConfig } from '@/api/OrderService/interfaces'
  import type { OrderListItem } from '@/api/OrderService/interfaces'

  const listRef = ref<InstanceType<typeof LoadingMore> | null>(null)

  const refreshList = () => {
    listRef.value?.fetchList('refresh')
  }

  onMounted(() => {
    uni.$on('refreshOrderList', refreshList)
  })

  onUnmounted(() => {
    uni.$off('refreshOrderList', refreshList)
  })

  type TabItem = { name: string }

  // ========== Tab 配置: 全部 / 已完成 / 待评价 ==========
  const tabList = ref<TabItem[]>([{ name: '全部' }, { name: '已完成' }, { name: '待评价' }])

  const currentTab = ref(0)

  const mapStatus = (order: OrderListItem) => getOrderDisplayStatusConfig(order)

  // Tab 对应的查询参数
  const TAB_QUERY_MAP: Record<number, Record<string, unknown>> = {
    0: {},
    1: { orderStatus: '302,401,402' },
    2: { stateType: 6 },
  }

  const queryParams = computed<Record<string, unknown>>(() => ({
    orderType: '1',
    ...TAB_QUERY_MAP[currentTab.value],
  }))

  const fetchOrderList = (params: any) => {
    const { page, limit, ...rest } = params
    return getOrderList({
      ...rest,
      pageNumber: page,
      pageSize: limit,
    })
  }

  const handleTabClick = (item: TabItem, index: number) => {
    currentTab.value = index
    console.log(item)
  }

  const handleDetail = (item: unknown) => {
    const orderItem = item as OrderListItem
    uni.navigateTo({ url: `/pages_client/pages/order/detail/index?orderId=${orderItem.id}` })
  }

  const handleToStore = (item: any) => {
    const orderItem = item as OrderListItem
    if (orderItem.storeId) {
      uni.navigateTo({
        url: `/pages_client/pages/store/detail/index?id=${orderItem.storeId}`,
      })
    }
  }
</script>

<style lang="scss" scoped></style>
