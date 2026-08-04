<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef } from 'vue'

interface MultiSelectOption {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue: string[]
  options: MultiSelectOption[]
  fieldLabel: string
  invalid?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const isOpen = shallowRef(false)
const searchQuery = shallowRef('')
const root = useTemplateRef<HTMLDivElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const panelId = `rtb-multi-select-${useId()}`

const selectedValues = computed(() => new Set(props.modelValue.map(String)))
const selectedOptions = computed(() =>
  props.options.filter((option) => selectedValues.value.has(String(option.value))),
)
const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  if (!query) return props.options

  return props.options.filter((option) =>
    `${option.label} ${option.value}`.toLocaleLowerCase().includes(query),
  )
})
const selectedSummary = computed(() => {
  if (props.modelValue.length === 0) return '請選擇'
  if (props.modelValue.length === 1) return selectedOptions.value[0]?.label ?? '已選 1 項'

  return `已選 ${props.modelValue.length} 項`
})
const allVisibleSelected = computed(() =>
  filteredOptions.value.length > 0 && filteredOptions.value.every((option) => selectedValues.value.has(String(option.value))),
)

function focusSearch(): void {
  nextTick(() => searchInput.value?.focus())
}

function open(): void {
  isOpen.value = true
  focusSearch()
}

function close(restoreFocus = true): void {
  isOpen.value = false
  searchQuery.value = ''

  if (restoreFocus) {
    nextTick(() => trigger.value?.focus())
  }
}

function toggle(): void {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function emitSelection(values: Set<string>): void {
  const optionValues = new Set(props.options.map((option) => String(option.value)))
  const unknownValues = props.modelValue.filter((value) => !optionValues.has(String(value)))
  const orderedValues = props.options
    .map((option) => String(option.value))
    .filter((value) => values.has(value))

  emit('update:modelValue', [...unknownValues, ...orderedValues])
}

function toggleOption(value: string, checked: boolean): void {
  const values = new Set(selectedValues.value)

  if (checked) {
    values.add(value)
  } else {
    values.delete(value)
  }

  emitSelection(values)
}

function selectVisible(): void {
  const values = new Set(selectedValues.value)
  filteredOptions.value.forEach((option) => values.add(String(option.value)))
  emitSelection(values)
}

function clearSelection(): void {
  emit('update:modelValue', [])
}

function focusFirstOption(): void {
  nextTick(() => root.value?.querySelector<HTMLInputElement>('.rtb-multi-select-option input')?.focus())
}

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusFirstOption()
  }
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (isOpen.value && root.value && event.target instanceof Node && !root.value.contains(event.target)) {
    close(false)
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div ref="root" class="rtb-multi-select" :class="{ 'is-invalid': invalid, 'is-open': isOpen }">
    <button
      ref="trigger"
      type="button"
      class="rtb-multi-select-trigger"
      :aria-label="`條件值：${fieldLabel}`"
      :aria-controls="panelId"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-invalid="invalid || undefined"
      :title="selectedSummary"
      @click="toggle"
    >
      <span class="rtb-multi-select-summary">{{ selectedSummary }}</span>
      <span class="rtb-multi-select-chevron" aria-hidden="true">⌄</span>
    </button>

    <div v-if="isOpen" :id="panelId" class="rtb-multi-select-panel">
      <input
        ref="searchInput"
        v-model="searchQuery"
        class="rtb-input rtb-multi-select-search"
        type="search"
        :aria-label="`搜尋${fieldLabel}選項`"
        placeholder="搜尋選項…"
        autocomplete="off"
        spellcheck="false"
        @keydown="onSearchKeydown"
      />

      <div class="rtb-multi-select-actions">
        <span>{{ filteredOptions.length }} 個選項</span>
        <div>
          <button
            type="button"
            class="rtb-multi-select-action"
            :disabled="filteredOptions.length === 0 || allVisibleSelected"
            @click="selectVisible"
          >全選目前結果</button>
          <button
            type="button"
            class="rtb-multi-select-action"
            :disabled="props.modelValue.length === 0"
            @click="clearSelection"
          >清除</button>
        </div>
      </div>

      <fieldset v-if="filteredOptions.length > 0" class="rtb-multi-select-options">
        <legend class="rtb-sr-only">{{ fieldLabel }}選項</legend>
        <label v-for="option in filteredOptions" :key="String(option.value)" class="rtb-multi-select-option">
          <input
            type="checkbox"
            :value="String(option.value)"
            :checked="selectedValues.has(String(option.value))"
            :aria-label="option.label"
            @change="toggleOption(String(option.value), ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ option.label }}</span>
        </label>
      </fieldset>
      <p v-else class="rtb-multi-select-empty" role="status">找不到符合的選項</p>
    </div>
  </div>
</template>
