<script setup lang="ts">
import { ref } from "vue";
import OCR from "./components/OCR.vue";
import SetupGPQ from "./components/SetupGPQ.vue";

// const isReady = ref<boolean>(false);
// const statusMsg = ref("");
// const onReady = (status?: string) => {
//   if (status) {
//     statusMsg.value = status;
//     return;
//   }
//   isReady.value = true;
//   statusMsg.value = "";
// };
</script>

<template>
  <!--<SetupGPQ v-if="!isReady" @ready="onReady" />
  <OCR v-else />
  <div v-if="statusMsg !== ''">{{ statusMsg }}</div>-->
  <OCR />
</template>

<style>
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9feaf9);
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
