# Iron Enum

Super‑lightweight **Rust‑style tagged unions for TypeScript** — fully type‑safe, zero‑dependency, < 1 kB min+gz.

[![GitHub Repo stars](https://img.shields.io/github/stars/only-cliches/iron-enum)](https://github.com/only-cliches/iron-enum)
[![NPM Version](https://img.shields.io/npm/v/iron-enum)](https://www.npmjs.com/package/iron-enum)
[![JSR Version](https://img.shields.io/jsr/v/%40onlycliches/iron-enum)](https://jsr.io/@onlycliches/iron-enum)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm package minimized gzipped size](https://badgen.net/bundlephobia/minzip/iron-enum)](https://bundlephobia.com/package/iron-enum@latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **TL;DR**   Stop writing brittle `switch` statements or sprawling `if / else` chains.  Model your program’s states with expressive, type‑sound enums that compile down to **plain JavaScript objects with helper methods — no classes, no runtime bloat**.

[▶ Open playground](https://stackblitz.com/edit/iron-enum-sandbox?file=src/main.ts)

---

## Table of Contents

- [Iron Enum](#iron-enum)
  - [Table of Contents](#tableofcontents)
  - [Why Iron Enum?](#whyironenum)
  - [Installation](#installation)
  - [Quick Start](#quickstart)
  - [Pattern Matching \& Guards](#patternmatching-guards)
    - [Exhaustive `match`](#exhaustive-match)
    - [Fluent `if.*` / `ifNot.*`](#fluent-if--ifnot)
  - [Async Workflows](#asyncworkflows)
  - [Option \& Result Helpers](#optionresult-helpers)
  - [Try / TryInto Utilities](#try--tryinto-utilities)
  - [Advanced Recipes](#advancedrecipes)
  - [FAQ \& Trade‑offs](#faq-tradeoffs)
  - [Contributing](#contributing)
  - [License](#license)
  - [Keywords](#keywords)

---

## Why Iron Enum?

* **Clarity** — Express all possible states in one place; TypeScript warns you when you forget a branch.
* **Maintainability** — Adding a new variant *instantly* surfaces every site that needs to handle it.
* **Functional Flair** — Great for FP‑oriented codebases or anywhere you want to banish `null` & friends.
* **Safe Data Transport** — `toJSON()` / `_.parse()` make it effortless to serialize across the wire.

> **Native discriminated unions are great,** but they leave you to hand‑roll guards and pattern matching every time.  Iron Enum wraps the same type‑level guarantees in an ergonomic, reusable runtime API.

---

## Installation

```bash
npm i iron-enum
# or
pnpm add iron-enum
# or
yarn add iron-enum
```

---

## Quick Start

```ts
import { IronEnum } from "iron-enum";

// 1. Declare your variants
const Status = IronEnum<{
  Idle:     undefined;
  Loading:  undefined;
  Done:     { items: number };
}>();

// 2. Produce values
const state = Status.Done({ items: 3 });

// 3. Handle them exhaustively
state.match({
  Idle:    ()            => console.log("No work yet."),
  Loading: ()            => console.log("Crunching…"),
  Done:    ({ items })   => console.log(`Completed with ${items} items.`),
});

// 4. Handle as args
const handleLoadingState = (stateInstance: typeof Status._.typeOf) => { /* .. */ }
handleLoadingState(state);
```

---

## Pattern Matching & Guards

### Exhaustive `match`

```ts
// branching
value.match({
  Foo:  (x) => doSomething(x),
  Bar:  (s) => console.log(s),
  _:    ()  => fallback(), // optional catch‑all
});

// return with type inference
const returnValue = value.match({
  Foo:  (x) => x,
  Bar:  (s) => s,
  _:    ()  => null
});
// typeof returnValue == x | s | null
```

### Fluent `if.*` / `ifNot.*`

```ts
// branching
value.if.Foo(
  ({ count }) => console.log(`It *is* Foo with ${count}`),
  ()          => console.log("It is NOT Foo"),
);

// return through callbacks with type inference
const isNumber = value.if.Foo( 
  // if true
  ({ count }) => count,
  // if false
  ()          => 0,
);

// in statement, callbacks optional
if (value.if.Foo()) {
  // value is Foo!
} else {
  // value is NOT Foo!
}
```

Both helpers return the callback’s result *or* a boolean when you omit callbacks, so they slot neatly into expressions.

---

## Async Workflows

Need to await network calls inside branches?  Use `matchAsync`:

```ts
await status.matchAsync({
  Idle:    async () => cache.get(),
  Loading: async () => await poll(),
  Done:    async ({ items }) => items,
});
```

---

## Option & Result Helpers

```ts
import { Option, Result } from "iron-enum";

// Option<T>
const MaybeNum = Option<number>();
const some = MaybeNum.Some(42);
const none = MaybeNum.None();

console.log(some.unwrap());        // 42
console.log(none.unwrap_or(0));    // 0

// Result<T, E>
const NumOrErr = Result<number, Error>();
const ok  = NumOrErr.Ok(123);
const err = NumOrErr.Err(new Error("Boom"));

ok.match({ Ok: (v) => v, Err: console.error });
```

The helper instances expose Rust‑style sugar (`isOk()`, `isErr()`, `ok()`, etc.) while still being regular Iron Enum variants under the hood.

---

## Try / TryInto Utilities

Run any operation that may throw and return it as a `Result` type:

```ts
import { Try } from "iron-enum";

const result = Try.sync(() => {
  // risk stuffy that might throw new Error()
});

if (result.if.Ok()) { /* … */ }
```

Or create a new function that may throw that always returns a `Result`.

```ts
import { TryInto } from "iron-enum";

const safeParseInt = TryInto.sync((s: string) => {
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) throw new Error("NaN");
  return n;
});

const result = safeParseInt("55");
result.if.Ok((value) => {
  console.log(value) // 55;
})
```

`Try` and `TryInto` also have async variants that work with `Promises` and `async/await`.

---

## Advanced Recipes

* **Nested Enums** — compose enums inside payloads for complex state machines.
* **Optional‑object payloads** — if *all* payload keys are optional, the constructor arg becomes optional: `E.Query()` == `E.Query({})`.
* **Serialization** — `enum.toJSON()` ➜ `{ Variant: payload }`, and `Enum._.parse(obj)` brings it back.
* **Type Extraction** — `typeof MyEnum._.typeOf` gives you the union type of all variants.

---

## FAQ & Trade‑offs

<details>
<summary>Does Iron Enum add runtime overhead?</summary>

No. Each constructed value is a plain object `{ tag, data, …helpers }`. The helper methods are closures created once per value; for most apps this is negligible compared with the clarity you gain.

</details>

<details>
<summary>Why not stick with vanilla TypeScript unions?</summary>

Vanilla unions keep *types* safe but leave *guards* up to you.  Iron Enum bakes common guard logic into reusable helpers and ensures your match statements stay exhaustive.

</details>

<details>
<summary>Can I tree‑shake out helpers I don’t use?</summary>

Yes. Because everything is property‑based access on the enum instance, dead‑code elimination removes unused helpers in modern bundlers.

</details>

---

## Contributing

PRs and issues are welcome!

---

## License

MIT © Scott Lott

## Keywords
typescript, enum, tagged union, tagged unions, discriminated union, algebraic data type, adt, sum type, union types, rust enums, rust, pattern matching, option type, result type, functional programming