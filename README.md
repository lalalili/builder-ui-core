# @lalalili/builder-ui-core

共用的 Vue builder 外殼與規則樹元件。供 `survey-filament`、`email-campaign-filament` 的
Builder 介面重複使用。此為 npm 套件（非 Composer），保留獨立 workspace；
Aitehub 透過 Vite alias 編譯此目錄的原始碼。

## 匯出

- `BuilderShell` — Builder 頁面外殼骨架（Vue 元件）
- `RuleTreeBuilder` — 條件規則樹編輯器（Vue 元件）
- `registerRuleTreeBuilder` — 以自訂元素形式註冊規則樹（供 Filament／非 Vue 宿主掛載）
- rule-tree `types` — 規則樹型別定義

## 規則樹功能

- AND / OR 群組巢狀條件
- 運算子：等於、包含、`IN` / `NOT IN`（逗號分隔多值）等
- 依 operator 動態顯示輸入框 placeholder 說明
- 日期欄位支援相對日期（`today±N`）

## 用法

於 workspace 內作為相依引用：

```ts
import { BuilderShell, RuleTreeBuilder, registerRuleTreeBuilder } from '@lalalili/builder-ui-core';
```

## 測試

套件保留獨立的 workspace 與 lockfile，使用 pnpm 12、Vite+ 與 Vitest 5。
在 Aitehub 根目錄執行以下命令；宿主 CI 也會安裝、測試與稽核此套件。

```bash
./vendor/bin/sail pnpm --dir packages/builder-ui-core install --frozen-lockfile
./vendor/bin/sail pnpm run test:builder-ui-core
```
