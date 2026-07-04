import { defineCustomElement, ref, computed, watch, h } from 'vue';
import RuleTreeBuilderVue from '../RuleTreeBuilder.vue';
import type { FieldDef, RuleNode, RuleGroup } from './types';
import { isGroup } from './types';
import ruleTreeStyles from './rule-tree-builder.css?inline';

const RuleTreeBuilderElement = defineCustomElement({
  styles: [ruleTreeStyles],

  props: {
    availableFields: { type: String, default: '[]' },
    value: { type: String, default: '' },
  },

  emits: ['change'],

  setup(props: { availableFields: string; value: string }, { emit }: { emit: (e: 'change', v: string) => void }) {
    const fields = computed<FieldDef[]>(() => {
      try { return JSON.parse(props.availableFields) ?? []; } catch (error) {
        console.error('[rule-tree-builder] availableFields JSON 解析失敗，改用空欄位清單', error);
        return [];
      }
    });

    const tree = ref<RuleGroup>(parseTree(props.value));

    watch(() => props.value, (v) => {
      const parsed = parseTree(v);
      if (JSON.stringify(parsed) !== JSON.stringify(tree.value)) {
        tree.value = parsed;
      }
    });

    function parseTree(v: string): RuleGroup {
      try {
        const node = v ? JSON.parse(v) : null;
        return node && isGroup(node) ? (node as RuleGroup) : { op: 'AND', children: [] };
      } catch (error) {
        // 靜默丟資料很危險：解析失敗代表儲存的規則樹已損壞，改用空樹前先留下可診斷的錯誤。
        console.error('[rule-tree-builder] value JSON 解析失敗，改用空規則樹（原值未被覆寫，重新儲存才會覆蓋）', error);
        return { op: 'AND', children: [] };
      }
    }

    function onChange(node: RuleNode) {
      if (isGroup(node)) tree.value = node as RuleGroup;
      emit('change', JSON.stringify(node));
    }

    return () =>
      h(RuleTreeBuilderVue, {
        modelValue: tree.value,
        availableFields: fields.value,
        'onUpdate:modelValue': onChange,
        onChange,
      });
  },
});

export function registerRuleTreeBuilder(): void {
  if (!customElements.get('rule-tree-builder')) {
    customElements.define('rule-tree-builder', RuleTreeBuilderElement);
  }
}
