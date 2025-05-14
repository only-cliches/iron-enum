import { IronEnum, Option, Result, Try, TryInto } from '../mod';

/**
 * Iron Enum Playground
 * --------------------
 */


/** ------------------------------------------------------------------
 * 1. Basic Enum Declaration & Exhaustive Pattern Matching
 * -----------------------------------------------------------------*/

const Status = IronEnum<{
  Idle: undefined;
  Loading: undefined;
  Done: { items: number };
}>();

const status = Status.Done({ items: 3 });

// Exhaustive match (uncommenting a variant breaks compilation!)
status.match({
  Idle: () => console.log('Nothing to do.'),
  Loading: () => console.log('Working…'),
  Done: ({ items }) => console.log(`Finished with ${items} items.`),
});

/** ------------------------------------------------------------------
 * 2. Fluent Guard Helpers (`if.*`, `ifNot.*`)
 * -----------------------------------------------------------------*/

if (status.if.Done()) {
  console.log('✔ It is definitely Done');
}

status.ifNot.Idle(() => {
  console.log('❌ It is NOT idle');
});

/** ------------------------------------------------------------------
 * 3. Async Variant Handling (`matchAsync`)
 * -----------------------------------------------------------------*/

await status.matchAsync({
  Idle: async () => console.log('Async idle branch'),
  Loading: async () =>
    new Promise((r) => setTimeout(() => r(console.log('Still loading…')), 500)),
  Done: async ({ items }) => console.log(`Async result: ${items * 2}`),
});

/** ------------------------------------------------------------------
 * 4. Option<T> — nullable‑free optional values
 * -----------------------------------------------------------------*/

const MaybeNum = Option<number>();
const some = MaybeNum.Some(42);
const none = MaybeNum.None();

console.log('Some.unwrap() →', some.unwrap());
console.log('None.unwrap_or(0) →', none.unwrap_or(0));

/** ------------------------------------------------------------------
 * 5. Result<T, E> — ergonomic error handling
 * -----------------------------------------------------------------*/

const NumOrErr = Result<number, Error>();
const ok = NumOrErr.Ok(7);
const err = NumOrErr.Err(new Error('Kaboom'));

ok.match({
  Ok: (v) => console.log('Result Ok →', v),
  Err: console.error,
});

err.if.Err((e) => console.warn('Caught error:', e.message));

/** ------------------------------------------------------------------
 * 6. Try / TryInto — wrap unsafe code safely
 * -----------------------------------------------------------------*/

const parsed = Try.sync(() => JSON.parse('{ "valid": true }'));
parsed.match({
  Ok: (v) => console.log('Parsed JSON:', v),
  Err: console.error,
});

const toInt = TryInto.sync((s: string) => {
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) throw new Error('NaN!');
  return n;
});

console.log('Safe int:', toInt('123').unwrap_or(-1));
console.log('Safe int (bad):', toInt('abc').unwrap_or(-1));

/** ------------------------------------------------------------------
 * 7. Nested & Recursive Enums
 * -----------------------------------------------------------------*/

const Page = IronEnum<{
  Home: undefined;
  Details: { id: number };
  Error: { reason: string };
}>();

const AppState = IronEnum<{
  Loading: undefined;
  Ready: { page: typeof Page._.typeOf };
}>();

const app = AppState.Ready({ page: Page.Details({ id: 5 }) });

app.match({
  Loading: () => console.log('App loading…'),
  Ready: ({ page }) =>
    page.match({
      Home: () => console.log('Home page'),
      Details: ({ id }) => console.log('Details of', id),
      Error: ({ reason }) => console.error('Page error', reason),
    }),
});

/** ------------------------------------------------------------------
 * 8. Serialization & Parsing
 * -----------------------------------------------------------------*/

const json = app.toJSON();
console.log('Serialized:', JSON.stringify(json));

const parsedApp = AppState._.parse(json);
console.log(
  'Parsed equals original →',
  JSON.stringify(parsedApp) === JSON.stringify(app)
);

/** ------------------------------------------------------------------
 * 9. Type Extraction Utilities
 * -----------------------------------------------------------------*/

type StatusType = typeof Status._.typeOf; // Idle | Loading | Done
const assertType: StatusType = Status.Idle();
console.log('StatusType inferred OK');

/** ------------------------------------------------------------------
 * 10. Optional‑Object Payloads (constructor arg becomes optional)
 * -----------------------------------------------------------------*/

const Query = IronEnum<{
  All: {};
  ById: { id: string };
}>();

console.log('Query.All() works without arg:', Query.All());

/** ------------------------------------------------------------------
 * End of playground — have fun hacking! 🎉
 * -----------------------------------------------------------------*/
