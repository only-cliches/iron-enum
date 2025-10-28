# 🦾 Iron Enum Vue

Typed Vue 3 render helpers for [`iron-enum`](https://www.npmjs.com/package/iron-enum).
Per-variant slot inference in SFC and TSX. Optional exhaustive mode.

## Install

```bash
npm i iron-enum iron-enum-vue
```

Peer requirements: TypeScript 5.1+, Vue 3.3+.

Enable strict template checks for best inference:

tsconfig.json:
```json
{ "vueCompilerOptions": { "strictTemplates": true } }
```

## API

```ts
import { createEnumMatch, createEnumMatchExhaustive } from "iron-enum-vue";
```

* `createEnumMatch(factory)` → component that renders the slot matching `of.tag`. Falls back to `_` if present.
* `createEnumMatchExhaustive(factory)` → same, but throws at runtime if the matching slot is missing.

Each named slot receives the exact payload for that tag. `_` receives the full union instance.

## Usage

### Define an enum

```ts
// status.ts
import { IronEnum } from "iron-enum";

export const Status = IronEnum<{
  Loading: undefined;
  Ready: { finishedAt: Date };
  Error: { message: string; code: number };
}>();
```

### Create a matcher component

```ts
// components/status-match.ts
import { createEnumMatch } from "iron-enum-vue";
import { Status } from "../status";

export const StatusMatch = createEnumMatch(Status);
// or strict version:
// export const StatusMatch = createEnumMatchExhaustive(Status);
```

Optionally register globally:

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { Status } from "./status";
import { createEnumMatch } from "iron-enum-vue";

const app = createApp(App);
app.component("StatusMatch", createEnumMatch(Status));
app.mount("#app");
```

### SFC template

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Status } from "@/status";
import { StatusMatch } from "@/components/status-match";

const value = ref(Status.Loading());
</script>

<template>
  <StatusMatch :of="value">
    <template #Loading>
      <div>Loading</div>
    </template>

    <!-- finishedAt is Date -->
    <template #Ready="{ finishedAt }">
      <div>Done at {{ finishedAt.toLocaleTimeString() }}</div>
    </template>

    <!-- message and code inferred -->
    <template #Error="{ message, code }">
      <div>Failed: {{ message }} ({{ code }})</div>
    </template>

    <!-- optional fallback -->
    <template #_="{ tag }">
      <div>Unknown: {{ tag }}</div>
    </template>
  </StatusMatch>
</template>
```

### TSX

```tsx
import { defineComponent } from "vue";
import { Status } from "@/status";
import { createEnumMatch } from "iron-enum-vue";

const EnumMatch = createEnumMatch(Status);

export default defineComponent({
  setup() {
    const value = Status.Ready({ finishedAt: new Date() });
    return () => (
      <EnumMatch
        of={value}
        Loading={() => <div>Loading</div>}
        Ready={({ finishedAt }) => <div>{finishedAt.toISOString()}</div>}
        Error={({ message, code }) => <div>{message} ({code})</div>}
      />
    );
  },
});
```

## Notes

* Works with reactive refs and plain values. Pass either `ref(variant)` or a variant instance to `:of`.
* For compile-time discipline, prefer `createEnumMatchExhaustive` and provide all slots. Slots are not enforceable as required at type level; the exhaustive variant surfaces missing arms at runtime.
* SSR-safe. No global state.
* Tree-shaking friendly. Only the used factory-generated component is included.

## Troubleshooting

* “Property 'of' does not exist…” → ensure `createEnumMatch` result is used directly or its `props` preserved when wrapping; do not re-`defineComponent` without forwarding props.
* Missing inference in templates → enable `"strictTemplates": true`.
* Accessing payload fields errors → ensure slot names exactly match enum tags.

MIT © 2025 Scott Lott

*Made with ❤️ by a developer who misses Rust's enums in TypeScript*
