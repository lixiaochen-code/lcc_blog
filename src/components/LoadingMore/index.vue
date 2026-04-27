<template>
  <scroll-view
    scroll-y
    class="w-full"
    :style="scrollStyle"
    :refresher-enabled="refresherEnabled"
    :refresher-triggered="refresherTriggered"
    @refresherrefresh="handleRefresh"
    @scrolltolower="handleLoadMore"
  >
    <view v-for="(item, index) in list" :key="index">
      <slot name="item" :item="item" :index="index" />
    </view>

    <view v-if="showEmpty" class="py-40rpx">
      <up-empty :mode="emptyMode" :text="emptyText" :icon="emptyIcon" />
    </view>

    <up-loadmore v-if="showLoadMore" class="py-40rpx" :status="loadMoreStatus" />
  </scroll-view>
</template>

<script setup lang="ts">
  import type { AlovaGenerics, Method } from 'alova'
  import { useRequest } from 'alova/client'
  import { computed, onMounted, ref, watch } from 'vue'

  type ListItem = Record<string, unknown>
  interface ListResponse {
    list: ListItem[]
    total: number
  }
  type AnyAlovaMethod = Method<AlovaGenerics>

  const props = withDefaults(
    defineProps<{
      height: string | number
      api: (params: { page: number; limit: number } & Record<string, unknown>) => AnyAlovaMethod
      params?: Record<string, unknown>
      limit?: number
      immediate?: boolean
      emptyMode?: string
      emptyText?: string
      emptyIcon?: string
      refresherEnabled?: boolean
    }>(),
    {
      limit: 10,
      immediate: true,
      params: () => ({}),
      emptyMode: 'data',
      emptyText: '暂无数据',
      emptyIcon: '',
      refresherEnabled: true,
    }
  )

  const list = ref<ListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const isFinished = ref(false)
  const hasLoaded = ref(false)
  const requestMode = ref<'refresh' | 'loadMore' | 'init'>('init')

  const buildParams = () => ({
    page: page.value,
    limit: props.limit,
    ...props.params,
  })

  const { loading, send } = useRequest(() => props.api(buildParams()), {
    immediate: false,
    force: true,
  })

  const applyResponse = (res: ListResponse) => {
    const nextList = Array.isArray(res.list) ? res.list : []
    total.value = Number(res.total || 0)
    if (requestMode.value === 'loadMore') {
      list.value.push(...nextList)
    } else {
      list.value = nextList
    }

    if (nextList.length === 0) {
      isFinished.value = true
      return
    }

    if (total.value > 0 && list.value.length >= total.value) {
      isFinished.value = true
      return
    }

    isFinished.value = false
  }

  const fetchList = async (mode: 'refresh' | 'loadMore' | 'init') => {
    if (loading.value) {
      return
    }

    const prevPage = page.value
    requestMode.value = mode

    if (mode === 'loadMore') {
      if (isFinished.value) return
      page.value += 1
    } else {
      page.value = 1
      isFinished.value = false
    }

    try {
      const res = (await send()) as ListResponse
      hasLoaded.value = true
      applyResponse(res)
    } catch (err) {
      page.value = prevPage
      console.error('加载列表失败', err)
    }
  }

  const handleRefresh = () => {
    fetchList('refresh')
  }

  const handleLoadMore = () => {
    fetchList('loadMore')
  }

  const scrollStyle = computed(() => ({
    height: typeof props.height === 'number' ? `${props.height}rpx` : props.height,
  }))

  const loadMoreStatus = computed(() => {
    if (loading.value) return 'loading'
    if (isFinished.value && list.value.length > 0) return 'nomore'
    return 'loadmore'
  })

  const showEmpty = computed(() => hasLoaded.value && total.value === 0)
  const showLoadMore = computed(() => !showEmpty.value)

  const refresherTriggered = computed(() => loading.value && requestMode.value === 'refresh')

  onMounted(() => {
    if (props.immediate) {
      fetchList('init')
    }
  })

  /** 根据 key 更新列表中的某条数据 */
  const updateItemByKey = (key: string, value: unknown, newData: Partial<ListItem>) => {
    const index = list.value.findIndex(item => item[key] === value)
    if (index !== -1) {
      list.value[index] = { ...list.value[index], ...newData }
    }
  }

  watch(
    () => props.params,
    () => {
      if (props.immediate) {
        fetchList('refresh')
      }
    },
    { deep: true }
  )

  defineExpose({
    list,
    fetchList,
    updateItemByKey,
  })
</script>
