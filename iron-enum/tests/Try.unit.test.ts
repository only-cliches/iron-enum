import { Try } from "../mod";

describe("Try helper", () => {
  it("sync success returns Ok", () => {
    const res = Try.sync(() => 5 * 2);
    expect(res.isOk()).toBe(true);
    expect(res.unwrap()).toBe(10);
  });

  it("sync failure returns Err", () => {
    const res = Try.sync(() => {
      throw new Error("boom");
    });
    expect(res.isErr()).toBe(true);
    expect(() => res.unwrap()).toThrow(/boom/);
  });

  it("async success returns Promise<Ok>", async () => {
    const res = await Try.async(async () => "yay");
    expect(res.isOk()).toBe(true);
    expect(res.unwrap()).toBe("yay");
  });

  it("async error returns Promise<Err>", async () => {
    const res = await Try.async(async () => {
      throw "nope";
    });
    expect(res.isErr()).toBe(true);
    expect(() => res.unwrap()).toThrow(/nope/);
  });
});
