import { Result, Ok, Err } from "../mod";

describe("Result helper", () => {
  const R = Result<number, string>();

  it("Ok unwraps; flags work", () => {
    const ok = R.Ok(7);
    expect(ok.isOk()).toBe(true);
    expect(ok.isErr()).toBe(false);
    expect(ok.unwrap()).toBe(7);
    expect(ok.ok().isSome()).toBe(true);
  });

  it("Err unwrap throws; unwrap_or works", () => {
    const err = R.Err("nope");
    expect(err.isOk()).toBe(false);
    expect(err.isErr()).toBe(true);
    expect(() => err.unwrap()).toThrow(/nope/);
    expect(err.unwrap_or(0)).toBe(0);
    expect(err.ok().isNone()).toBe(true);
  });

  it("top-level Ok/Err helpers", () => {
    expect(Ok(123).unwrap()).toBe(123);
    expect(() => Err("bad").unwrap()).toThrow();
  });
});
