<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import AiConsoleDock from "./AiConsoleDock.vue";
import AiConsoleLauncher from "./AiConsoleLauncher.vue";
import { aiConsoleOpen } from "./aiConsoleState";

const shellClass = computed(() => ({
  "ai-app-shell": true,
  "ai-open": aiConsoleOpen.value,
}));

function syncAppOpenClass(isOpen: boolean) {
  if (typeof document === "undefined") {
    return;
  }
  const app = document.querySelector("#app");
  if (app) {
    app.classList.toggle("ai-open", isOpen);
  }
  document.body.classList.toggle("ai-open", isOpen);
}

onMounted(() => {
  syncAppOpenClass(aiConsoleOpen.value);
});

onBeforeUnmount(() => {
  syncAppOpenClass(false);
});

watch(aiConsoleOpen, (isOpen) => {
  syncAppOpenClass(isOpen);
});
</script>

<template>
  <div :class="shellClass">
    <DefaultTheme.Layout>
      <template #nav-bar-content-after>
        <AiConsoleLauncher />
      </template>
    </DefaultTheme.Layout>
  </div>
  <Teleport to="body">
    <AiConsoleDock />
  </Teleport>
</template>
