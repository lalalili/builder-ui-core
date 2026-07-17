<script setup lang="ts">
import { computed, inject } from 'vue';
import type { FieldDef, RuleLeaf, Operator, RelativeDateValue, RulePreviewResponse } from './types';
import { OPERATORS_BY_TYPE, isRelativeDateValue } from './types';

const props = defineProps<{
  leaf: RuleLeaf;
  fields: FieldDef[];
  depth: number;
  leafPath: number[];
  ancestorDisabled: boolean;
  previewEnabled?: boolean;
  previewResponse?: RulePreviewResponse | null;
}>();

const emit = defineEmits<{
  update: [leaf: RuleLeaf];
  remove: [];
  preview: [detail: { path: number[] }];
}>();

// ── Drag-and-drop inject ─────────────────────────────────────────────────────
const dragState = inject<{ path: number[] | null }>('rtbDragState')!;
const startDrag = inject<(path: number[]) => void>('rtbStartDrag')!;
const endDrag = inject<() => void>('rtbEndDrag')!;

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }
  startDrag(props.leafPath);
}

function onDragEnd() {
  endDrag();
}

const isDragging = computed(() => {
  const p = dragState.path;
  return (
    p !== null &&
    p.length === props.leafPath.length &&
    p.every((v, i) => props.leafPath[i] === v)
  );
});

const isDisabled = computed(() => props.leaf.enabled === false);
const isEffectivelyDisabled = computed(() => props.ancestorDisabled || isDisabled.value);
const isPreviewBusy = computed(() => props.previewResponse?.loading === true);
const previewForThisNode = computed(() => {
  const response = props.previewResponse;
  if (!response || response.path.length !== props.leafPath.length) return null;
  return response.path.every((value, index) => props.leafPath[index] === value) ? response : null;
});

function toggleEnabled() {
  emit('update', { ...props.leaf, enabled: props.leaf.enabled === false });
}

function previewNode() {
  emit('preview', { path: props.leafPath });
}

// ── Field / operator / value ─────────────────────────────────────────────────
const fieldDef = computed(() => props.fields.find((f) => f.key === props.leaf.field) ?? null);

const operators = computed(() => {
  if (!fieldDef.value) return [];
  return OPERATORS_BY_TYPE[fieldDef.value.type] ?? [];
});

const noValue = computed(() =>
  props.leaf.operator === 'is_null' || props.leaf.operator === 'is_not_null',
);

const isMultiValue = computed(() =>
  props.leaf.operator === 'in' || props.leaf.operator === 'not_in',
);

const isEnum = computed(() => fieldDef.value?.type === 'enum');
const isBoolean = computed(() => fieldDef.value?.type === 'boolean');
const isDate = computed(() => fieldDef.value?.type === 'date');
const isRelativeDate = computed(() => isDate.value && isRelativeDateValue(props.leaf.value));

function relativeDateOffset(): number {
  return isRelativeDateValue(props.leaf.value) ? props.leaf.value.offset : 0;
}

function toggleDateMode() {
  if (isRelativeDate.value) {
    emit('update', { ...props.leaf, value: '' });
  } else {
    const rdv: RelativeDateValue = { type: 'relative_date', offset: 0, unit: 'day' };
    emit('update', { ...props.leaf, value: rdv });
  }
}

function onRelativeOffsetChange(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const offset = raw === '' ? 0 : parseInt(raw, 10);
  const rdv: RelativeDateValue = { type: 'relative_date', offset: isNaN(offset) ? 0 : offset, unit: 'day' };
  emit('update', { ...props.leaf, value: rdv });
}

function relativeOffsetLabel(offset: number): string {
  if (offset === 0) return 'today'
  return offset > 0 ? `today + ${offset} 天` : `today − ${Math.abs(offset)} 天`
}

// enum with options → multi-select; string/number → comma-separated text input
const useEnumMultiSelect = computed(
  () => isEnum.value && isMultiValue.value && (fieldDef.value?.options?.length ?? 0) > 0,
);
const useTagInput = computed(
  () => isMultiValue.value && !useEnumMultiSelect.value,
);

function onFieldChange(key: string) {
  const newField = props.fields.find((f) => f.key === key);
  const ops = newField ? OPERATORS_BY_TYPE[newField.type] : [];
  const firstOp = ops[0]?.value ?? '=';
  emit('update', {
    field: key,
    operator: firstOp,
    value: undefined,
    enabled: props.leaf.enabled,
  });
}

function onOperatorChange(op: string) {
  const noVal = op === 'is_null' || op === 'is_not_null';
  emit('update', {
    ...props.leaf,
    operator: op as Operator,
    value: noVal ? undefined : props.leaf.value,
  });
}

function onValueChange(val: unknown) {
  emit('update', { ...props.leaf, value: val });
}

function multiValueAsArray(): string[] {
  const v = props.leaf.value;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v) return v.split(',').map((s) => s.trim());
  return [];
}

function onMultiValueChange(e: Event) {
  const select = e.target as HTMLSelectElement;
  const selected = Array.from(select.selectedOptions).map((o) => o.value);
  emit('update', { ...props.leaf, value: selected });
}

const valuePlaceholder = computed(() => {
  const op = props.leaf.operator;
  const type = fieldDef.value?.type;
  if (op === 'contains') return '輸入關鍵字';
  if (op === 'starts_with') return '開頭文字，例如：台北';
  if (op === 'ends_with') return '結尾文字，例如：路';
  if (type === 'number') return '輸入數值';
  if (type === 'date') return 'YYYY-MM-DD';
  return '輸入值';
});

function tagInputDisplay(): string {
  return multiValueAsArray().join(', ');
}

function onTagInputChange(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const arr = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  emit('update', { ...props.leaf, value: arr });
}
</script>

<template>
  <div class="rtb-leaf-wrap">
  <div class="rtb-leaf" :class="{ 'is-dragging': isDragging, 'is-disabled': isEffectivelyDisabled }">
    <span
      class="rtb-drag-handle"
      title="拖曳移動規則"
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    >⠿</span>

    <!-- Field select -->
    <select class="rtb-select rtb-field-select" :value="leaf.field" @change="onFieldChange(($event.target as HTMLSelectElement).value)">
      <option value="" disabled>選擇欄位</option>
      <option v-for="f in fields" :key="f.key" :value="f.key">{{ f.label }}</option>
    </select>

    <!-- Operator select -->
    <select class="rtb-select rtb-op-select" :value="leaf.operator" @change="onOperatorChange(($event.target as HTMLSelectElement).value)">
      <option v-for="op in operators" :key="op.value" :value="op.value">{{ op.label }}</option>
    </select>

    <!-- Value input -->
    <template v-if="!noValue">
      <!-- Enum multi-select (in / not_in with predefined options) -->
      <select
        v-if="useEnumMultiSelect"
        class="rtb-select rtb-value-select"
        multiple
        :value="multiValueAsArray()"
        @change="onMultiValueChange"
      >
        <option v-for="opt in fieldDef?.options" :key="opt.value" :value="String(opt.value)">
          {{ opt.label }}
        </option>
      </select>

      <!-- Comma-separated tag input (in / not_in for string/number, or enum without options) -->
      <input
        v-else-if="useTagInput"
        class="rtb-input rtb-value-input rtb-tag-input"
        type="text"
        :value="tagInputDisplay()"
        @change="onTagInputChange"
        placeholder="D31, D21（逗號分隔）"
        title="多個值請用逗號分隔，例如：D31, D21"
      />

      <!-- Enum single select -->
      <select
        v-else-if="isEnum"
        class="rtb-select rtb-value-select"
        :value="String(leaf.value ?? '')"
        @change="onValueChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>選擇值</option>
        <option v-for="opt in fieldDef?.options" :key="opt.value" :value="String(opt.value)">
          {{ opt.label }}
        </option>
      </select>

      <!-- Boolean select -->
      <select
        v-else-if="isBoolean"
        class="rtb-select rtb-value-select"
        :value="String(leaf.value ?? 'true')"
        @change="onValueChange(($event.target as HTMLSelectElement).value === 'true')"
      >
        <option value="true">是</option>
        <option value="false">否</option>
      </select>

      <!-- Date input (absolute or relative) -->
      <template v-else-if="isDate">
        <button
          type="button"
          class="rtb-date-mode-btn"
          :class="{ 'is-relative': isRelativeDate }"
          :title="isRelativeDate ? '切換為固定日期' : '切換為相對日期（today±N）'"
          @click="toggleDateMode"
        >{{ isRelativeDate ? '相對' : '固定' }}</button>
        <!-- Relative date: offset number input -->
        <input
          v-if="isRelativeDate"
          class="rtb-input rtb-value-input rtb-relative-offset-input"
          type="number"
          :value="relativeDateOffset()"
          placeholder="0"
          title="正數 = 未來天數，負數 = 過去天數，0 = today"
          @change="onRelativeOffsetChange"
        />
        <span v-if="isRelativeDate" class="rtb-relative-date-preview">{{ relativeOffsetLabel(relativeDateOffset()) }}</span>
        <!-- Absolute date picker -->
        <input
          v-else
          class="rtb-input rtb-value-input rtb-date-input"
          type="date"
          :value="String(leaf.value ?? '')"
          @change="onValueChange(($event.target as HTMLInputElement).value)"
        />
      </template>

      <!-- Text / number input -->
      <input
        v-else
        class="rtb-input rtb-value-input"
        :type="fieldDef?.type === 'number' ? 'number' : 'text'"
        :value="String(leaf.value ?? '')"
        @input="onValueChange(fieldDef?.type === 'number' ? Number(($event.target as HTMLInputElement).value) : ($event.target as HTMLInputElement).value)"
        :placeholder="valuePlaceholder"
      />
    </template>

    <span v-if="ancestorDisabled" class="rtb-disabled-hint">受上層停用影響</span>

    <button
      class="rtb-enable-btn"
      :class="{ 'is-off': isDisabled }"
      type="button"
      :aria-pressed="!isDisabled"
      @click="toggleEnabled"
    >{{ isDisabled ? '已停用' : '啟用中' }}</button>

    <button
      v-if="previewEnabled"
      class="rtb-preview-btn"
      type="button"
      :disabled="isPreviewBusy"
      @click="previewNode"
    >{{ previewForThisNode?.loading ? '計算中…' : '計算筆數' }}</button>

    <button class="rtb-remove-btn" type="button" @click="emit('remove')" title="刪除規則">✕</button>
  </div>
  <div v-if="previewForThisNode?.result" class="rtb-preview-result">
    <strong>僅套用此規則：符合 {{ previewForThisNode.result.count.toLocaleString() }} 筆</strong>
  </div>
  <div v-else-if="previewForThisNode?.error" class="rtb-preview-error">{{ previewForThisNode.error }}</div>
  </div>
</template>
