<script setup lang="ts">
const { type = 'text' } = defineProps<{
  type?: string
  title: string
  placeholder?: string
  modelValue: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (type === 'number') {
    if (isNaN(input.valueAsNumber)) {
        emit('update:modelValue', 0)
    } else {
        emit('update:modelValue', input.valueAsNumber)
    }
  } else {
    emit('update:modelValue', input.value)
  }
}
</script>

<template>
  <div class="d-flex flex-column">
    <label>{{ title }}</label>
    <input :type="type" :placeholder="placeholder" :value="modelValue" @input="handleInput" />
  </div>
</template>

<style scoped>
div {
  gap: 4px;
}

label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-coffee);
}

input {
  width: 100%;
  padding: 12px;
  font-size: 13px;
  border: 1px solid rgba(61, 44, 46, 0.16);
  border-radius: 8px;
  background: #fff;
}
</style>
