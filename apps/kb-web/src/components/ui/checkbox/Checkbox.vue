<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { Check } from 'lucide-vue-next'
  import { CheckboxIndicator, CheckboxRoot, type CheckboxRootProps } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const checked = defineModel<boolean>({ default: false })

  const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <CheckboxRoot
    v-model:checked="checked"
    data-slot="checkbox"
    v-bind="props"
    :class="
      cn(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="flex items-center justify-center text-current"
    >
      <Check />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
