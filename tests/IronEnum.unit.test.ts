import { IronEnum } from "../mod";

describe("IronEnum builder & instance basics", () => {
  const Status = IronEnum<{
    Loading: undefined;
    Ready: { finishedAt: Date };
  }>({keys: ["Loading", "Ready"]});

  it("constructs a no-payload variant", () => {
    const val = Status.Loading();
    expect(val.tag).toBe("Loading");
    expect(val.payload).toEqual(undefined);
    expect(val.key()).toBe("Loading");
    expect(val.toJSON()).toEqual({ Loading: undefined });
  });

  it("constructs a payload variant", () => {
    const at = new Date();
    const val = Status.Ready({ finishedAt: at });
    expect(val.payload.finishedAt).toBe(at);
    expect(val.toJSON()).toEqual({ Ready: { finishedAt: at } });
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
    const obj = { Ready: { finishedAt: new Date(0) } };
    const val = Status._.parse(obj);
    expect(val.tag).toBe("Ready");
    expect(val.payload).toEqual(obj.Ready);
  });

  it("parse() rejects objects with 0 or >1 keys", () => {
    expect(() => Status._.parse({} as any)).toThrow(/Expected exactly 1/);
    expect(() =>
      Status._.parse({ Loading: undefined, Ready: {} as any })
    ).toThrow(/Expected exactly 1/);
  });
});
