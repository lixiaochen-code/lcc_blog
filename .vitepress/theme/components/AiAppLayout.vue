<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { computed } from "vue";
import AiConsoleDock from "./AiConsoleDock.vue";
import AiConsoleLauncher from "./AiConsoleLauncher.vue";
import { aiConsoleOpen } from "./aiConsoleState";

const shellClass = computed(() => ({
  "ai-app-shell": true,
  "ai-open": aiConsoleOpen.value,
}));
</script>

<template>
  <div :class="shellClass">
    <DefaultTheme.Layout>
      <template #nav-bar-content-after>
        <AiConsoleLauncher />
      </template>
    </DefaultTheme.Layout>
    <AiConsoleDock />
  </div>
</template>
