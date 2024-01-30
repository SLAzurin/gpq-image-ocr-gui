<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  const gpqToolVersion = localStorage.getItem("GPQ_TOOL_VERSION");
  
  console.log(process.cwd(), gpqToolVersion);
});
</script>

<template>
  <h1>Preparing GPQ Image OCR...</h1>
</template>

<style scoped></style>
