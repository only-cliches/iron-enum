import { IronEnum } from "../mod";

describe("IronEnum builder & instance basics", () => {
  const Status = IronEnum<{
    Loading: undefined;
    Ready: { finishedAt: Date };
  }>({keys: ["Loading", "Ready"]});

  it("constructs a no-payload variant", () => {
    const val = Status.Loading();
    expect(val.tag).toBe("Loading");
    expect(val.data).toEqual(undefined);
    expect(val.toJSON()).toEqual({tag: "Loading", data: undefined});
  });

  it("constructs a payload variant", () => {
    const at = new Date();
    const val = Status.Ready({ finishedAt: at });
    expect(val.data.finishedAt).toBe(at);
    expect(val.toJSON()).toEqual({tag: "Ready", data: { finishedAt: at }});
  });

  it("supports match() with exhaustive handlers", () => {
    const msg = Status.Loading().match({
      Loading: () => "still working…",
      Ready: () => "done!",
    });
    expect(msg).toBe("still working…");
  });

  it("supports match() with fallback _", () => {
    const msg = Status.Ready({ finishedAt: new Date() }).match({
      _: () => "whatever",
    });
    expect(msg).toBe("whatever");
  });

  it("throws when match() has no handler and no _", () => {
    expect(() =>
      Status.Loading().match({
        Ready: () => "impossible",
      } as any)
    ).toThrow(/No handler/);
  });

  it("if / ifNot helpers behave correctly", () => {
    const val = Status.Loading();

    expect(val.if("Loading")).toBe(true);
    expect((val.if as any).NotExisting).toBeUndefined(); // proxy only exposes variant keys

    // ifNot
    expect(val.ifNot("Ready")).toBe(true);
    expect(val.ifNot("Loading")).toBe(false);
  });

  it("parse() reconstructs a variant object", () => {
    const obj = {tag: "Ready" as const, data: { finishedAt: new Date(0) } };
    const val = Status._.parse(obj);
    expect(val.tag).toBe("Ready");
    expect(val.data).toEqual(obj.data);
  });
});
