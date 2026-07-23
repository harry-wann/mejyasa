<script setup lang="ts">
defineProps<{
  title: string
  desc: string
}>()
</script>

<template>
  <header class="page-heading d-flex flex-column">
      <h1 class="page-heading__title">{{ title }}</h1>
      <p class="page-heading__subtitle">{{ desc }}</p>
    </header>
</template>