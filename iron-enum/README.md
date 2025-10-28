# 🦾 Iron Enum

Super‑lightweight **Rust‑style tagged unions for TypeScript** — fully type‑safe, zero‑dependency, ~1 kB min+gz.

[![GitHub Repo stars](https://img.shields.io/github/stars/only-cliches/iron-enum)](https://github.com/only-cliches/iron-enum)
[![NPM Version](https://img.shields.io/npm/v/iron-enum)](https://www.npmjs.com/package/iron-enum)
[![JSR Version](https://img.shields.io/jsr/v/%40onlycliches/iron-enum)](https://jsr.io/@onlycliches/iron-enum)
[![npm package minimized gzipped size](https://badgen.net/bundlephobia/minzip/iron-enum)](https://bundlephobia.com/package/iron-enum@latest)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

IronEnum lets you model expressive enums (a.k.a. tagged unions) in plain TypeScript and gives you ergonomic helpers inspired by Rust’s Option, Result, and try patterns.

[▶ Open playground](https://stackblitz.com/edit/iron-enum-sandbox?file=src/main.ts)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Built-in Types](#built-in-types)
  - [Result<T, E>](#resultt-e)
  - [Option<T>](#optiont)
  - [Try and TryInto](#try-and-tryinto)
- [EcoSystem Helpers](#ecosystem-helpers)
  - [Zod](#zod)
  - [Vue](#vue)
- [Advanced Usage](#advanced-usage)
  - [Async Pattern Matching](#async-pattern-matching)
  - [Serialization & Parsing](#serialization--parsing)
  - [Type Guards](#type-guards-and-narrowing)
  - [Performance](#performance-optimization)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Examples](#examples)


## Features

- 🦀 **Rust-inspired** - Familiar `Result`, `Option`, and pattern matching
- 🎯 **Type-safe** - Full TypeScript support with excellent type inference
- 🚀 **Zero dependencies** - Lightweight and fast (~1kb gzipped)
- 🔧 **Ergonomic API** - Intuitive constructors and method chaining
- 🎮 **Pattern matching** - Exhaustive `match` and `matchAsync` methods
- 🛡️ **Error handling** - Built-in `Try` and `TryInto` utilities


## Installation

```bash
npm install iron-enum
# or
yarn add iron-enum
# or
pnpm add iron-enum
```

## Quick Start

```tsx
import { IronEnum } from 'iron-enum';

// Define your enum variants
const Status = IronEnum<{
  Loading: undefined;
  Ready: { finishedAt: Date };
  Error: { message: string; code: number };
}>();

// Create instances
const loading = Status.Loading();
const ready = Status.Ready({ finishedAt: new Date() });
const error = Status.Error({ message: "Network error", code: 500 });

// Pattern match
const message = ready.match({
  Loading: () => "Still working...",
  Ready: ({ finishedAt }) => `Done at ${finishedAt.toLocaleTimeString()}`,
  Error: ({ message }) => `Failed: ${message}`
});

// Use in UI components...
// Works with React and SolidJS out of the box!
const component = (props) => {

    const [value, setValue] = useState(Status.Loading());

    return (
        <div>
            {value.match({
                Loading: () => <div>Loading</div>,
                Ready: ({ finishedAt }) => <div>{`Done at ${finishedAt.toLocaleTimeString()}`}</div>,
                Error: ({ message }) => <div>{`Failed: ${message}`}</div>
            })}
        </div>
    )
}
```


## Core Concepts

### Creating Enums

IronEnum uses TypeScript's type system to create discriminated unions with zero runtime overhead:

```ts
// Simple enum without payloads
const Direction = IronEnum<{
  North: undefined;
  South: undefined;
  East: undefined;
  West: undefined;
}>();

// Enum with different payload types
const UserEvent = IronEnum<{
  Login: { userId: string; timestamp: Date };
  Logout: { userId: string };
  Update: { userId: string; changes: Record<string, any> };
}>();

// Using the enum
const event = UserEvent.Login({ 
  userId: "user123", 
  timestamp: new Date() 
});
```

### Pattern Matching

The `match` method ensures exhaustive handling of all variants:

```ts
const Shape = IronEnum<{
  Circle: { radius: number };
  Rectangle: { width: number; height: number };
  Triangle: { base: number; height: number };
}>();

const shape = Shape.Circle({ radius: 5 });

const area = shape.match({
  Circle: ({ radius }) => Math.PI * radius ** 2,
  Rectangle: ({ width, height }) => width * height,
  Triangle: ({ base, height }) => (base * height) / 2
});

// With fallback using '_'
const description = shape.match({
  Circle: () => "Round shape",
  _: () => "Polygonal shape"  // Catches Rectangle and Triangle
});
```

### Guards and Conditionals

Use `if` and `ifNot` for conditional logic:

```ts
const Auth = IronEnum<{
  Authenticated: { user: { id: string; name: string } };
  Anonymous: undefined;
}>();

const auth = Auth.Authenticated({ user: { id: "123", name: "Alice" } });

// Simple boolean check
if (auth.if("Authenticated")) {
  console.log("User is logged in");
}

// With callbacks
const userName = auth.if(
  "Authenticated",
  ({ user }) => user.name,
  () => "Guest"
);

// Inverse check
auth.ifNot(
  "Anonymous",
  () => console.log("User is authenticated")
);
```


## Built-in Types

### Result\<T, E\>

Rust-style error handling:

```ts
import { Result, Ok, Err } from 'iron-enum';

const DivideResult = Result<number, string>();

// 2. Use the factory's type for the return annotation
function divide(a: number, b: number): typeof DivideResult._.typeOf {
  if (b === 0) {
    return DivideResult.Err("Division by zero");
  }
  return DivideResult.Ok(a / b);
}

const result = divide(10, 2);

// Pattern matching
const message = result.match({
  Ok: (value) => `Result: ${value}`,
  Err: (error) => `Error: ${error}`
});

console.log(message); // "Result: 5"

// Convenience methods
console.log(result.isOk());        // true
console.log(result.unwrap());      // 5
console.log(result.unwrap_or(0));  // 5
```

### Option\<T\>

Nullable value handling:

```ts
import { Option } from 'iron-enum';

// Assumes 'User' type is defined elsewhere

type User = {id: number, name: string};

const optUser = Option<User>();

const userOption = optUser.Some({ id: 123, name: "Alice" }); // Example

// Convert to Result
const userResult = userOption.ok_or("User not found");

// Pattern matching
userOption.match({
  Some: (user) => console.log(`Found: ${user.name}`),
  None: () => console.log("User not found")
});

// Convenience methods
console.log(userOption.isSome());           // boolean
console.log(userOption.unwrap_or(null));    // User | null
```

### Try and TryInto

Automatic exception handling:

```ts
import { Try, TryInto } from 'iron-enum';

// Wrap a potentially throwing function
const result = Try.sync(() => {
  return JSON.parse('{"valid": "json"}');
});

// Async version
const asyncResult = await Try.async(async () => {
  const response = await fetch('/api/data');
  return response.json();
});

// Transform existing functions
const safeParse = TryInto.sync(JSON.parse);
// const safeReadFile = TryInto.async(fs.promises.readFile); // Example for Node.js

// Use the wrapped functions
const parseResult = safeParse('{"key": "value"}');
parseResult.match({
  Ok: (data) => console.log("Parsed:", data),
  Err: (error) => console.log("Parse failed:", error)
});
```


## EcoSystem Helpers

### Zod

For runtime validation (e.g., parsing API responses), you can use the `iron-enum-zod` helper to create an `IronEnum` and a `zod` schema from a single definition.

```bash
npm install iron-enum-zod zod
```

This gives you a single, powerful factory with constructors and parsing methods.

```ts
import { z } from 'zod';
import { createZodEnum } from 'iron-enum-zod';

// 1. Define your payload schemas using Zod
const StatusPayloads = {
  Loading: z.undefined(),
  Ready: z.object({ finishedAt: z.date() }),
  Error: z.object({ message: z.string(), code: z.number() }),
};

// 2. Create the enhanced enum factory
const Status = createZodEnum(StatusPayloads);

// 3. You get all the standard constructors
const ready = Status.self.Ready({ finishedAt: new Date() });

// 4. And you get new, type-safe parsing methods
const apiInput = { tag: "Ready", data: { finishedAt: "2025-10-25T10:00:00.000Z" } };

// .parse() returns an enum that's been recursively parsed by zod then converted into an `IronEnum` type.
const apiParsed = Status.parse(apiInput);
// now use apiPased as a normal enum
apiParsed.match(...)
apiParsed.if(...)

// You can also access the raw schema
const UserSchema = z.object({
  id: z.string(),
  status: Status.schema,
});
```

---

### Vue

`iron-enum-vue` provides a `createEnumMatch` function that generates a component that uses slots for an idiomatic, type-safe matching experience.

```vue
<script setup lang="ts">
import { IronEnum } from "iron-enum";
import { createEnumMatch } from "iron-enum-vue";
import { ref } from "vue";

const Status = IronEnum<{
  Loading: undefined;
  Ready: { finishedAt: Date };
  Error: { message: string; code: number };
}>();

const EnumMatch = createEnumMatch(Status);

const statusValue = ref(Status.Loading());

</script>

<template>
  <EnumMatch :of="statusValue">
    <template #Loading>
      <div>Loading</div>
    </template>

    <template #Ready="{ finishedAt }">
      <div>Done at {{ finishedAt.toLocaleTimeString() }}</div>
    </template>

    <template #Error="{ message, code }">
      <div>Failed: {{ message }} ({{ code }})</div>
    </template>

    <!-- Optional fallback for any unhandled tag -->
    <template #_="{ tag }">
      <div>Unknown: {{ tag }}</div>
    </template>
  </EnumMatch>
</template>

```


## Advanced Usage

### Async Pattern Matching

```ts
const RemoteData = IronEnum<{
  NotAsked: undefined;
  Loading: undefined;
  Success: { data: any };
  Failure: { error: Error };
}>();

const state = RemoteData.Success({ data: { id: 1, name: "Item" } });

const processed = await state.matchAsync({
  NotAsked: async () => null,
  Loading: async () => "Loading...",
  Success: async ({ data }) => {
    // Async processing
    // const enhanced = await enhanceData(data);
    // return enhanced;
    return data; // Example
  },
  Failure: async ({ error }) => {
    // await logError(error);
    return null;
  }
});
```

### Serialization & Parsing

Enums have a built-in `toJSON()` method for easy serialization. Use `_.parse()` for deserialization from plain objects.

```ts
const Status = IronEnum<{
  Active: { since: string };
  Inactive: { reason: string };
}>();

const status = Status.Active({ since: new Date().toISOString() });

// Convert to JSON
const json = status.toJSON(); 
// { tag: "Active", data: { since: "2025-10-24T..." } }

// ... send over network ...

// Parse from JSON
const parsed = Status._.parse(json); 

console.log(parsed.tag); // "Active"
```

### Type Guards and Narrowing

```ts
const Message = IronEnum<{
  Text: { content: string };
  Image: { url: string; alt?: string };
  Video: { url: string; duration: number };
}>();

// Use `typeof Message._.typeOf` for the union type
function processMessage(msg: typeof Message._.typeOf) {
  // The tag property enables type narrowing
  switch (msg.tag) {
    case "Text":
      console.log(msg.data.content); // TypeScript knows this is string
      break;
    case "Image":
      console.log(msg.data.url);     // TypeScript knows this is a string
      break;
    case "Video":
      console.log(msg.data.duration); // TypeScript knows this is number
      break;
  }
}
```

### Performance Optimization

Normally each time you call `IronEnum()` a proxy is created, however this can be bypassed for performance-critical applications by providing the variant keys as parameters.

Passing in keys also adds key validation to the `myEnum._.parse(...)` method.

```ts
// Pre-allocated version (no Proxy)
const Status = IronEnum<{
  Idle: undefined;
  Running: { pid: number };
  Stopped: { exitCode: number };
}>({ 
  keys: ["Idle", "Running", "Stopped"] // <- provide all keys in an array
});

// This avoids the Proxy overhead for better performance
```


## API Reference

### IronEnum Methods

Every enum instance has these methods:

  - **`tag`**: The variant name (discriminant).
  - **`data`**: The variant's associated data.
  - **`toJSON()`**: Convert to plain object.
  - **`is(key)`**: Conditional check for if(..) statements.
  - **`if(key, onMatch?, onMismatch?)`**: Conditional execution.
  - **`ifNot(key, onMismatch?, onMismatch?)`**: Inverse conditional.
  - **`match(handlers)`**: Optional exhaustive pattern matching, fallback allowed
  - **`matchAsync(handlers)`**: Async pattern matching.
  - **`matchExhaustive(handlers)`** Exhaustive pattern matching, no fallback method allowed.

### Result Methods

In addition to enum methods:

  - **`isOk()`**: Check if Result is Ok.
  - **`isErr()`**: Check if Result is Err.
  - **`unwrap()`**: Get value or throw error.
  - **`unwrap_or(default)`**: Get value or return default.
  - **`unwrap_or_else(fn)`**: Get value or compute default.
  - **`ok()`**: Convert to `Option`, discarding error.

### Option Methods

In addition to enum methods:

  - **`isSome()`**: Check if Option has a value.
  - **`isNone()`**: Check if Option is None.
  - **`unwrap()`**: Get value or throw error.
  - **`unwrap_or(default)`**: Get value or return default.
  - **`unwrap_or_else(fn)`**: Get value or compute default.
  - **`ok_or(error)`**: Convert to `Result` with provided error.
  - **`ok_or_else(fn)`**: Convert to `Result` with computed error.


## Best Practices

1.  **Use exhaustive matching** - Always handle all variants or use `_` fallback.
2.  **Leverage type inference** - Let TypeScript infer types from your variants.
3.  **Prefer Option/Result** - Use built-in types for common patterns.
4.  **Keep payloads immutable** - Treat enum data as read-only.
5.  **Use meaningful variant names** - Make your code self-documenting.


## Examples

### State Machine

```ts
const State = IronEnum<{
  Idle: undefined;
  Processing: { taskId: string; startedAt: Date };
  Completed: { taskId: string; result: string };
  Failed: { taskId: string; error: Error };
}>();

class TaskProcessor {
  private state = State.Idle();
  
  start(taskId: string) {
    this.state = State.Processing({ taskId, startedAt: new Date() });
  }
  
  complete(result: string) {
    this.state.if("Processing", ({ taskId }) => {
      this.state = State.Completed({ taskId, result });
    });
  }
  
  getStatus(): string {
    return this.state.match({
      Idle: () => "Ready",
      Processing: ({ taskId }) => `Processing ${taskId}...`,
      Completed: ({ taskId }) => `Task ${taskId} completed`,
      Failed: ({ error }) => `Failed: ${error.message}`
    });
  }
}
```

### Form Validation

```ts
const ValidationResult = IronEnum<{
  Valid: { value: string };
  Invalid: { errors: string[] };
}>();

function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) errors.push("Email is required");
  if (!email.includes("@")) errors.push("Invalid email format");
  if (email.length > 100) errors.push("Email too long");
  
  return errors.length > 0 
    ? ValidationResult.Invalid({ errors })
    : ValidationResult.Valid({ value: email.toLowerCase() });
}

// Usage
const result = validateEmail("user@example.com");
result.match({
  Valid: ({ value }) => console.log("Email accepted:", value),
  Invalid: ({ errors }) => console.error("Validation failed:", errors)
});
```


## License

MIT © 2025 Scott Lott

*Made with ❤️ by a developer who misses Rust's enums in TypeScript*