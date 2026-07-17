<script setup lang="ts">
import { computed, inject, reactive, ref } from 'vue';
import type { FieldDef, RuleGroup, RuleLeaf, RuleNode, RulePreviewResponse } from './types';
import { isGroup } from './types';
import RuleTreeLeaf from './RuleTreeLeaf.vue';

const props = defineProps<{
  group: RuleGroup;
  fields: FieldDef[];
  depth: number;
  canRemove?: boolean;
  groupPath: number[];
  ancestorDisabled: boolean;
  previewEnabled?: boolean;
  previewResponse?: RulePreviewResponse | null;
}>();

const emit = defineEmits<{
  update: [group: RuleGroup];
  remove: [];
  preview: [detail: { path: number[] }];
}>();

// ── Drag-and-drop inject ─────────────────────────────────────────────────────
const dragState = inject<{ path: number[] | null }>('rtbDragState', reactive({ path: null }));
const startDrag = inject<(path: number[]) => void>('rtbStartDrag', () => {});
const endDrag = inject<() => void>('rtbEndDrag', () => {});
const moveNode = inject<(groupPath: number[], insertIndex: number) => void>('rtbMoveNode', () => {});

const activeDropZone = ref<number | null>(null);

function onDragOverZone(e: DragEvent, insertIndex: number) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  activeDropZone.value = insertIndex;
}

function onDragLeaveZone() {
  activeDropZone.value = null;
}

function onDropZone(e: DragEvent, insertIndex: number) {
  e.preventDefault();
  activeDropZone.value = null;
  moveNode(props.groupPath, insertIndex);
}

// Group header itself is draggable (drag the whole sub-group)
function onGroupDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }
  startDrag(props.groupPath);
}

function onGroupDragEnd() {
  endDrag();
}

// ── Group logic ──────────────────────────────────────────────────────────────
function toggleOp() {
  emit('update', { ...props.group, op: props.group.op === 'AND' ? 'OR' : 'AND' });
}

function toggleEnabled() {
  emit('update', { ...props.group, enabled: props.group.enabled === false });
}

const isDisabled = computed(() => props.group.enabled === false);
const isEffectivelyDisabled = computed(() => props.ancestorDisabled || isDisabled.value);
const isPreviewBusy = computed(() => props.previewResponse?.loading === true);
const previewForThisNode = computed(() => {
  const response = props.previewResponse;
  if (!response || response.path.length !== props.groupPath.length) return null;
  return response.path.every((value, index) => props.groupPath[index] === value) ? response : null;
});

function previewNode() {
  emit('preview', { path: props.groupPath });
}

function updateChild(index: number, node: RuleNode) {
  const children = [...props.group.children];
  children[index] = node;
  emit('update', { ...props.group, children });
}

function removeChild(index: number) {
  const children = props.group.children.filter((_, i) => i !== index);
  emit('update', { ...props.group, children });
}

function addRule() {
  const defaultField = props.fields[0];
  if (!defaultField) return;
  const leaf: RuleLeaf = { field: defaultField.key, operator: '=', value: '' };
  emit('update', { ...props.group, children: [...props.group.children, leaf] });
}

function addGroup() {
  const childGroup: RuleGroup = { op: 'AND', children: [] };
  emit('update', { ...props.group, children: [...props.group.children, childGroup] });
}

function isDraggingThis(): boolean {
  const p = dragState.path;
  return (
    p !== null &&
    p.length === props.groupPath.length &&
    p.every((v, i) => props.groupPath[i] === v)
  );
}
</script>

<template>
  <div class="rtb-group" :class="[`rtb-depth-${depth}`, { 'is-dragging': isDraggingThis(), 'is-disabled': isEffectivelyDisabled }]">
    <!-- Group header -->
    <div class="rtb-group-header">
      <span
        v-if="canRemove"
        class="rtb-drag-handle"
        title="拖曳移動群組"
        draggable="true"
        @dragstart="onGroupDragStart"
        @dragend="onGroupDragEnd"
      >⠿</span>

      <button
        class="rtb-op-toggle"
        :class="group.op === 'OR' ? 'is-or' : 'is-and'"
        type="button"
        :title="group.op === 'OR' ? '此群組內各條件「任一成立」即符合，點擊切換為 AND' : '此群組內各條件「全部成立」才符合，點擊切換為 OR'"
        @click="toggleOp"
      >{{ group.op }}</button>

      <span class="rtb-group-label">條件群組</span>
      <span class="rtb-op-hint">（{{ group.op === 'OR' ? '群組內任一條件成立' : '群組內所有條件都成立' }}）</span>

      <span v-if="ancestorDisabled" class="rtb-disabled-hint">受上層停用影響</span>

      <button
        v-if="canRemove"
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
      >{{ previewForThisNode?.loading ? '計算中…' : (canRemove ? '計算筆數' : '計算總筆數') }}</button>

      <div class="rtb-group-actions">
        <button
          class="rtb-add-btn"
          type="button"
          :disabled="fields.length === 0"
          :title="fields.length === 0 ? '請先選擇名單，才能新增規則' : undefined"
          @click="addRule"
        >+ 規則</button>
        <button
          class="rtb-add-btn"
          type="button"
          :disabled="fields.length === 0"
          :title="fields.length === 0 ? '請先選擇名單，才能新增群組' : undefined"
          @click="addGroup"
        >+ 群組</button>
        <button v-if="canRemove" class="rtb-remove-btn" type="button" @click="emit('remove')">✕</button>
      </div>
    </div>

    <!-- Children with drop zones between each -->
    <div class="rtb-group-body" v-if="group.children.length > 0">
      <!-- Drop zone before first child -->
      <div
        class="rtb-drop-zone"
        :class="{ 'is-active': activeDropZone === 0 }"
        @dragover="onDragOverZone($event, 0)"
        @dragleave="onDragLeaveZone"
        @drop="onDropZone($event, 0)"
      ></div>

      <template v-for="(child, i) in group.children" :key="i">
        <RuleTreeGroup
          v-if="isGroup(child)"
          :group="child as RuleGroup"
          :fields="fields"
          :depth="depth + 1"
          :can-remove="true"
          :group-path="[...groupPath, i]"
          :ancestor-disabled="isEffectivelyDisabled"
          :preview-enabled="previewEnabled"
          :preview-response="previewResponse"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
          @preview="emit('preview', $event)"
        />
        <RuleTreeLeaf
          v-else
          :leaf="child as RuleLeaf"
          :fields="fields"
          :depth="depth"
          :leaf-path="[...groupPath, i]"
          :ancestor-disabled="isEffectivelyDisabled"
          :preview-enabled="previewEnabled"
          :preview-response="previewResponse"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
          @preview="emit('preview', $event)"
        />

        <!-- Drop zone after each child -->
        <div
          class="rtb-drop-zone"
          :class="{ 'is-active': activeDropZone === i + 1 }"
          @dragover="onDragOverZone($event, i + 1)"
          @dragleave="onDragLeaveZone"
          @drop="onDropZone($event, i + 1)"
        ></div>
      </template>
    </div>

    <!-- Empty group: acts as a drop zone when no children -->
    <div
      v-else
      class="rtb-group-empty"
      :class="{ 'is-drop-target': activeDropZone === 0 }"
      @dragover.prevent="onDragOverZone($event, 0)"
      @dragleave="onDragLeaveZone"
      @drop="onDropZone($event, 0)"
    >
      <span>無條件（點擊「+ 規則」新增）</span>
    </div>

    <div v-if="previewForThisNode?.result" class="rtb-preview-result">
      <strong>{{ canRemove ? '僅套用此規則' : '全部啟用規則' }}：符合 {{ previewForThisNode.result.count.toLocaleString() }} 筆</strong>
    </div>
    <div v-else-if="previewForThisNode?.error" class="rtb-preview-error">{{ previewForThisNode.error }}</div>
  </div>
</template>
