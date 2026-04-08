<script setup lang="ts">
import { aiConsoleOpen, toggleAiConsole } from "./aiConsoleState";
</script>

<template>
  <div class="ai-console-launcher">
    <button
      class="ai-console-navtab"
      :class="{ active: aiConsoleOpen }"
      :title="aiConsoleOpen ? '收起 AI 控制台' : '打开 AI 控制台'"
      aria-label="切换 AI 控制台"
      @click="toggleAiConsole('chat')"
    >
      <span class="ai-console-navtab__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zm7 10l.9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13zM7 14l1.2 2.8L11 18l-2.8 1.2L7 22l-1.2-2.8L3 18l2.8-1.2L7 14z"
          />
        </svg>
      </span>
      <span class="ai-console-navtab__label">AI</span>
    </button>
  </div>
</template>
