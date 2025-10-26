import {
  IronEnum,
  Option,
  Result,
  Try,
  Some,
  None,
  Ok,
  Err,
} from "../mod";

describe("Integration: cross-type flows", () => {
  it("Option → Result flow", () => {
    const maybe = Some(1);
    const res1 = maybe.ok_or("bad");
    expect(res1.isOk()).toBe(true);

    const res2 = None().ok_or("bad");
    expect(res2.isErr()).toBe(true);
  });

  it("Result.ok() ↔ Option", () => {
    const r = Ok("hi");
    const o = r.ok();
    expect(o.unwrap()).toBe("hi");

    const o2 = Err("err").ok();
    expect(o2.isNone()).toBe(true);
  });

  it("matchAsync interplay", async () => {
    const Fetch = IronEnum<{ Pending: undefined; Done: string; Error: Error }>();

    const pending = Fetch.Pending();

    const res = await pending.matchAsync({
      Pending: async () => 1,
      Done: async () => 2,
      Error: async () => 3,
    });

    expect(res).toBe(1);
  });

  it("Try.sync + Option + Result chain", () => {
    const res = Try.sync(() => JSON.parse("{ bad json"));
    // Turn Result into Option
    const opt = res.ok();
    expect(opt.isNone()).toBe(true);

    // Recover
    const recovered = opt.ok_or("default");
    expect(recovered.unwrap_or("still default")).toBe("still default");
  });
});
