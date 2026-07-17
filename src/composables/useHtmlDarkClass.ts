import { onBeforeUnmount, ref, type Ref } from 'vue';

/**
 * 監聽 <html> 的 class 變化，回傳 html 是否帶有 .dark。
 * Shadow DOM 元件用：外部 CSS 進不了 shadow root，
 * 暗色狀態必須以 JS 橋接進來。
 */
export function useHtmlDarkClass(): Ref<boolean> {
  const root = document.documentElement;
  const isDark = ref(root.classList.contains('dark'));

  const observer = new MutationObserver(() => {
    isDark.value = root.classList.contains('dark');
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });

  onBeforeUnmount(() => observer.disconnect());

  return isDark;
}
