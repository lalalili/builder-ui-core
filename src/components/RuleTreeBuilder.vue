<script setup lang="ts">
import { provide, reactive, ref, shallowRef, toRaw, watch } from 'vue';
import type { FieldDef, RuleGroup, RuleNode, RulePreviewResponse } from './rule-tree/types';
import { isGroup } from './rule-tree/types';
import { getNodeAtPath, insertAtPath, isAncestorPath, moveNodeWithinParent, removeAtPath } from './rule-tree/ruleTreeUtils';
import RuleTreeGroup from './rule-tree/RuleTreeGroup.vue';
import {
  rtbCancelKeyboardMoveKey,
  rtbDragStateKey,
  rtbDropKeyboardMoveKey,
  rtbEndDragKey,
  rtbKeyboardMoveStateKey,
  rtbMoveKeyboardNodeKey,
  rtbMoveNodeKey,
  rtbNodeKeyKey,
  rtbStartDragKey,
  rtbStartKeyboardMoveKey,
} from './rule-tree/ruleTreeContext';

const props = defineProps<{
  modelValue?: RuleNode | null;
  availableFields: FieldDef[];
  previewEnabled?: boolean;
  previewResponse?: RulePreviewResponse | null;
  dark?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [node: RuleNode];
  change: [node: RuleNode];
  preview: [detail: { path: number[] }];
}>();

function makeRoot(): RuleGroup {
  return { op: 'AND', children: [] };
}

const tree = ref<RuleGroup>(
  props.modelValue && isGroup(props.modelValue)
    ? (props.modelValue as RuleGroup)
    : makeRoot(),
);

const nodeKeys = new WeakMap<object, string>();
let nodeKeySequence = 0;

watch(
  () => props.modelValue,
  (val) => {
    if (val && isGroup(val)) tree.value = val as RuleGroup;
  },
);

function reconcileNodeKeys(previous: RuleNode, updated: RuleNode): void {
  const previousKey = nodeKeys.get(toRaw(previous) as object);
  if (previousKey) nodeKeys.set(toRaw(updated) as object, previousKey);

  if (!isGroup(previous) || !isGroup(updated)) return;

  updated.children.forEach((updatedChild, index) => {
    if (nodeKeys.has(toRaw(updatedChild) as object)) return;

    const previousChild = previous.children[index];
    if (!previousChild || isGroup(previousChild) !== isGroup(updatedChild)) return;

    reconcileNodeKeys(previousChild, updatedChild);
  });
}

function onUpdate(updated: RuleGroup) {
  reconcileNodeKeys(tree.value, updated);
  tree.value = updated;
  emit('update:modelValue', updated);
  emit('change', updated);
}

// ── Drag-and-drop state ──────────────────────────────────────────────────────

const dragState = reactive<{ path: number[] | null }>({ path: null });

provide(rtbDragStateKey, dragState);
provide(rtbStartDragKey, (path: number[]) => {
  dragState.path = [...path];
});
provide(rtbEndDragKey, () => {
  dragState.path = null;
});
provide(rtbMoveNodeKey, (targetGroupPath: number[], insertIndex: number) => {
  const sourcePath = dragState.path;
  if (!sourcePath) return;

  // Prevent dropping a group into its own descendant
  if (isAncestorPath(sourcePath, targetGroupPath)) return;

  // Prevent no-op: same parent, same position
  const sourceParent = sourcePath.slice(0, -1);
  const sourceIndex = sourcePath[sourcePath.length - 1];
  const sameParent =
    sourceParent.length === targetGroupPath.length &&
    sourceParent.every((v, i) => targetGroupPath[i] === v);
  if (sameParent && (insertIndex === sourceIndex || insertIndex === sourceIndex + 1)) return;

  const node = getNodeAtPath(tree.value, sourcePath);
  if (!node) return;

  let newTree = removeAtPath(tree.value, sourcePath);

  // Removing source shifts later indices down by 1 within the same parent
  let adjustedIndex = insertIndex;
  if (sameParent && sourceIndex < insertIndex) {
    adjustedIndex = insertIndex - 1;
  }

  newTree = insertAtPath(newTree, targetGroupPath, adjustedIndex, node);
  onUpdate(newTree);
  dragState.path = null;
});

// ── Keyboard reorder state ──────────────────────────────────────────────────

const keyboardMoveState = reactive<{ path: number[] | null }>({ path: null });
const keyboardOriginalTree = shallowRef<RuleGroup | null>(null);
const keyboardAnnouncement = shallowRef('');

function getNodeKey(node: RuleNode): string {
  const objectNode = toRaw(node) as object;
  const existingKey = nodeKeys.get(objectNode);
  if (existingKey) return existingKey;

  const key = `node-${nodeKeySequence++}`;
  nodeKeys.set(objectNode, key);
  return key;
}

function keyboardPosition(path: number[]): { position: number; total: number } | null {
  if (path.length === 0) return null;

  const parent = getNodeAtPath(tree.value, path.slice(0, -1));
  if (!parent || !isGroup(parent)) return null;

  return {
    position: path[path.length - 1] + 1,
    total: parent.children.length,
  };
}

function startKeyboardMove(path: number[]): void {
  if (keyboardMoveState.path || path.length === 0 || !getNodeAtPath(tree.value, path)) return;

  keyboardOriginalTree.value = tree.value;
  keyboardMoveState.path = [...path];
  const position = keyboardPosition(path);
  keyboardAnnouncement.value = position
    ? `已開始移動規則，目前第 ${position.position} 項，共 ${position.total} 項。使用上下鍵移動，按 Enter 或空白鍵放下，按 Escape 取消。`
    : '已開始移動規則。使用上下鍵移動，按 Enter 或空白鍵放下，按 Escape 取消。';
}

function moveKeyboardNode(direction: -1 | 1): void {
  const sourcePath = keyboardMoveState.path;
  if (!sourcePath) return;

  const result = moveNodeWithinParent(tree.value, sourcePath, direction);
  if (!result) {
    keyboardAnnouncement.value = direction === -1 ? '規則已在此群組最前面。' : '規則已在此群組最後面。';
    return;
  }

  onUpdate(result.tree);
  keyboardMoveState.path = result.path;
  keyboardAnnouncement.value = `已移動至第 ${result.position} 項，共 ${result.total} 項。`;
}

function dropKeyboardMove(): void {
  const path = keyboardMoveState.path;
  if (!path) return;

  const position = keyboardPosition(path);
  keyboardMoveState.path = null;
  keyboardOriginalTree.value = null;
  keyboardAnnouncement.value = position
    ? `已完成移動，規則位於第 ${position.position} 項。`
    : '已完成移動。';
}

function cancelKeyboardMove(): void {
  const originalTree = keyboardOriginalTree.value;
  if (originalTree) onUpdate(originalTree);

  keyboardMoveState.path = null;
  keyboardOriginalTree.value = null;
  keyboardAnnouncement.value = '已取消移動，順序已還原。';
}

provide(rtbKeyboardMoveStateKey, keyboardMoveState);
provide(rtbStartKeyboardMoveKey, startKeyboardMove);
provide(rtbMoveKeyboardNodeKey, moveKeyboardNode);
provide(rtbDropKeyboardMoveKey, dropKeyboardMove);
provide(rtbCancelKeyboardMoveKey, cancelKeyboardMove);
provide(rtbNodeKeyKey, getNodeKey);
</script>

<template>
  <div class="rtb-root" :class="{ 'rtb-dark': dark }">
    <span class="rtb-sr-only" role="status" aria-live="polite">{{ keyboardAnnouncement }}</span>
    <RuleTreeGroup
      :group="tree"
      :fields="availableFields"
      :depth="0"
      :can-remove="false"
      :group-path="[]"
      :ancestor-disabled="false"
      :preview-enabled="previewEnabled"
      :preview-response="previewResponse"
      @update="onUpdate"
      @preview="emit('preview', $event)"
    />
  </div>
</template>
