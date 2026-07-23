<!-- components/LunchCard.vue -->
<script setup lang="ts">
const restaurantName = '雞腿便當專賣店'
</script>

<template>
  <article class="lunch-card">
    <p>已選店家</p>
    <h2>{{ restaurantName }}</h2>
  </article>
</template>

<style scoped>
.lunch-card {
  padding: 24px;
  border: 1px solid #eadfd2;
  border-radius: 12px;
}
</style>
