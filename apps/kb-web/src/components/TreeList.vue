<script setup lang="ts">
  import type { TreeItem } from '../api'

  defineProps<{
    items: TreeItem[]
    activePath: string
  }>()

  const emit = defineEmits<{
    (e: 'select', path: string): void
  }>()

  function onItemClick(item: TreeItem, isActive: boolean): void {
    if (item.type !== 'article') return
    emit('select', isActive ? '' : item.path)
  }
</script>

<template>
  <ul class="tree-list">
    <li v-for="item in items" :key="item.path" class="tree-item" :class="item.type">
      <button
        :class="{ active: activePath === item.path }"
        @click="onItemClick(item, activePath === item.path)"
      >
        {{ item.type === 'directory' ? item.name : item.title || item.name }}
      </button>
      <TreeList
        v-if="item.children?.length"
        :items="item.children"
        :active-path="activePath"
        @select="(path: string) => emit('select', path)"
      />
    </li>
  </ul>
</template>
