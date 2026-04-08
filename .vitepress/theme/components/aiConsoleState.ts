import { ref } from "vue";

export const aiConsoleOpen = ref(false);
export const aiConsoleTab = ref<"chat" | "me" | "users">("chat");

export function toggleAiConsole(nextTab?: "chat" | "me" | "users") {
  if (nextTab) {
    aiConsoleTab.value = nextTab;
  }
  aiConsoleOpen.value = !aiConsoleOpen.value;
}

export function openAiConsole(nextTab?: "chat" | "me" | "users") {
  if (nextTab) {
    aiConsoleTab.value = nextTab;
  }
  aiConsoleOpen.value = true;
}

export function closeAiConsole() {
  aiConsoleOpen.value = false;
}
