# Iron Enum

Super‑lightweight **Rust‑style tagged unions for TypeScript** — fully type‑safe, zero‑dependency, < 1 kB min+gz.

[![GitHub Repo stars](https://img.shields.io/github/stars/only-cliches/iron-enum)](https://github.com/only-cliches/iron-enum)
[![NPM Version](https://img.shields.io/npm/v/iron-enum)](https://www.npmjs.com/package/iron-enum)
[![JSR Version](https://img.shields.io/jsr/v/%40onlycliches/iron-enum)](https://jsr.io/@onlycliches/iron-enum)
[![npm package minimized gzipped size](https://badgen.net/bundlephobia/minzip/iron-enum)](https://bundlephobia.com/package/iron-enum@latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

IronEnum lets you model expressive enums (a.k.a. tagged unions) in plain TypeScript and gives you ergonomic helpers inspired by Rust’s Option, Result, and try patterns.

[▶ Open playground](https://stackblitz.com/edit/iron-enum-sandbox?file=src/main.ts)

---

## ✨ Highlights

* **Zero‑dependency** – only types and \~1 kB of runtime helpers.
* **Type‑safe constructors** – payload shape enforced by the compiler.
* **Pattern matching** – `match` / `matchAsync` with exhaustiveness checking.
* **Fluent guards** – `if` / `ifNot` for concise branching.
* **Value wrappers** – drop‑in `Option` & `Result` types.
* **Error handling helpers** – `Try` & `TryInto` replace scattered `try / catch` blocks.

---

## 📦 Installation

```bash
npm i iron-enum   # or pnpm add / yarn add
```

---

## 🚀 Quick Start

```ts
import { IronEnum } from "iron-enum";

// 1) Declare variants
const Status = IronEnum<{ 
  Loading: undefined; 
  Ready: { finishedAt: Date } 
}>();

// 2) Construct values
const a = Status.Loading();
const b = Status.Ready({ finishedAt: new Date() });

// 3) Pattern‑match
const msg = a.match({
  Loading: () => "still working…",
  Ready:   ({ finishedAt }) => `done at ${finishedAt.toISOString()}`,
});
```

---

## 🧩 Working with `Option`

```ts
import { Option } from "iron-enum";

const maybeNum = Option<number>();

const some = maybeNum.Some(42);
const none = maybeNum.None();

some.unwrap();          // 42
none.unwrap_or(0);      // 0

// Transform into a Result
some.ok_or("no value"); // Result.Ok(42)
none.ok_or("no value"); // Result.Err("no value")
```

---

## 🛡️ Robust functions with `Result`

```ts
import { Result } from "iron-enum";

const ParseInt = Result<number, string>();

function safeParse(str: string) {
  const n = parseInt(str, 10);
  return isNaN(n) ? ParseInt.Err("NaN") : ParseInt.Ok(n);
}

const out = safeParse("123");
if (out.isOk()) console.log(out.unwrap());
```

---

## ⚡ One‑liners: `Try` & `TryInto`

### `Try`

```ts
import { Try } from "iron-enum";

const res = Try.sync(() => JSON.parse("{ bad json"));
res.match({
  Ok: (obj) => console.log(obj),
  Err: (e)  => console.error("Parse failed", e),
});
```

### `TryInto`

```ts
import { TryInto } from "iron-enum";

const parseJSON = TryInto.sync(JSON.parse);

const val = parseJSON("42");           // Result.Ok(42)
const bad = parseJSON("{ bad json");    // Result.Err(SyntaxError)
```

---

## 📑 API Cheatsheet

| Helper          | What it does                              |
| --------------- | ----------------------------------------- |
| `IronEnum`      | Build custom tagged unions                |
| `Option<T>`     | Maybe‑value wrapper (`Some`, `None`)      |
| `Result<T,E>`   | Success/error wrapper (`Ok`, `Err`)       |
| `Try.sync`      | Wrap sync fn → `Result`                   |
| `Try.async`     | Wrap async fn → `Promise<Result>`         |
| `TryInto.sync`  | Lift sync fn to return `Result`           |
| `TryInto.async` | Lift async fn to return `Promise<Result>` |


IronEnum works on TypeScript 4.5 + and every JS runtime (Node, Bun, browsers).

---


## Contributing

PRs and issues are welcome!

---

## License

MIT © 2025 Scott Lott

## Keywords
typescript, enum, tagged union, tagged unions, discriminated union, algebraic data type, adt, sum type, union types, rust enums, rust, pattern matching, option type, result type, functional programming