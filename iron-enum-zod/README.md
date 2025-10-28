# 🦾 Iron Enum Zod

A lightweight helper library to create [`iron-enum`](https://www.npmjs.com/package/iron-enum) factories and `zod` schemas from a single definition.

`iron-enum-zod` provides a `createZodEnum` function that acts as a single source of truth, generating both your type-safe `IronEnum` and a `zod` schema for runtime validation.

## The Problem
`iron-enum` is type-safe, but its types are erased at compile-time. `zod` provides runtime validation, but you have to define your schemas separately, leading to duplicated logic.

```ts
// Before: Duplicated Definitions

import { z } from 'zod';
import { IronEnum } from 'iron-enum';

// 1. Zod definition for runtime
const StatusSchema = z.union([
  z.object({ Loading: z.undefined() }),
  z.object({ Ready: z.object({ finishedAt: z.date() }) }),
]);

// 2. IronEnum definition for compile-time
const Status = IronEnum<{
  Loading: undefined;
  Ready: { finishedAt: Date };
}>();
```

This is hard to maintain.

## The Solution
`iron-enum-zod` lets you define your payloads once with Zod and get everything you need.

```ts
// After: Single Source of Truth
import { z } from 'zod';
import { createZodEnum } from 'iron-enum-zod';

// 1. Define payloads ONCE
const StatusPayloads = {
  Loading: z.undefined(),
  Ready: z.object({ finishedAt: z.coerce.date() }),
  Error: z.object({ message: z.string() }),
};

// 2. Create the enum and schema
const Status = createZodEnum(StatusPayloads);

// 3. You get a fully-featured IronEnum factory...
const loading = Status.self.Loading();

// 4. ...AND a powerful parser.
const result = Status.parse({ tag: "Ready", data: { finishedAt: "2025-10-25" } });

// you can also directly access the zod schema
const zodSchema = Status.schema;
```

## Installation
You need iron-enum, zod, and iron-enum-zod.

```sh
npm install iron-enum zod iron-enum-zod
# or
yarn add iron-enum zod iron-enum-zod
# or
pnpm add iron-enum zod iron-enum-zod
```

## Quick Start
```ts
import { z } from 'zod';
import { createZodEnum } from 'iron-enum-zod';

// 1. Define your payload schemas
const StatusPayloads = {
  Loading: z.undefined(),
  Ready: z.object({ finishedAt: z.coerce.date() }),
  Error: z.object({ message: z.string(), code: z.number().optional() }),
};

// 2. Create your ZodEnum factory
const Status = createZodEnum(StatusPayloads);

// --- Using the Enum ---

// You can create instances just like a normal IronEnum
// using the `.self` property.
const ready = Status.self.Ready({ finishedAt: new Date() });

const message = ready.match({
  Loading: () => "Still loading...",
  Ready: ({ payload }) => `Done at ${payload.finishedAt.toISOString()}`,
  Error: ({ payload }) => `Failed: ${payload.message}`,
  _: (self) => `Unknown state: ${self.key()}`,
});

// --- Using the Parsers ---

// An example API response
const apiInput = { tag: "Error", data: { message: "Network failed", code: 222 } };

// Use .safeParse() to get a Result<Status, ZodError>
const result = Status.safeParse(apiInput);

result.match({
  Ok: (statusInstance) => {
    // statusInstance is a valid IronEnum: { tag: "Error", ... }
    console.log(`Parsed status: ${statusInstance.key()}`);
  },
  Err: (zodError) => {
    // zodError is a ZodError instance
    console.error("Validation failed:", zodError.issues);
  }
});

// Or use .parse() which throws on failure
try {
  const status = Status.parse({ Loading: undefined });
  console.log("Parsed!", status.tag); // Parsed! Loading
} catch (e) {
  console.error("Failed to parse", e);
}
```

## API Reference
The `createZodEnum(payloads)` function returns an object with the following properties:

### self
The core IronEnumInstance factory. You use this to create new enum variants.
```ts
const loading = Status.self.Loading();
const error = Status.self.Error({ message: "..." });
```

### schema
The raw `z.ZodType` schema. This is useful for embedding your enum schema inside other Zod schemas.

It validates the `toJSON()`/`_.parse()` format (e.g., `{ tag: ..., data: ... }`).
```ts
const UserSchema = z.object({
  id: z.string(),
  status: Status.schema, // Embed the enum schema
});

const user = UserSchema.parse({
  id: "user-123",
  status: { tag: "Ready", data: { finishedAt: new Date() } }
});
```

### parse(input, params?)
Parses and validates an unknown `input`. If validation succeeds, it returns a fully-formed `IronEnum` instance. If validation fails, it throws a `ZodError`.
```ts
// This works
const status = Status.parse({ tag: "Ready", data: { finishedAt: new Date() } });

// This throws
const status = Status.parse({ tag: "Ready", data: { finishedAt: "Not a date" } });
```

### safeParse(input, params?)
Parses and validates an unknown `input`. It does not throw. Instead, it returns an `IronEnum` `Result`:

- `Ok(IronEnum)` on success.
- `Err(ZodError)` on failure.

This is the recommended way to handle untrusted data.
```ts
const result = Status.safeParse({ tag: "Error", data: { message: 123 } }); // 'message' is wrong type

if (result.isErr()) {
  console.error(result.data.issues); // Safely access the ZodError
}

```

MIT © 2025 Scott Lott

*Made with ❤️ by a developer who misses Rust's enums in TypeScript*