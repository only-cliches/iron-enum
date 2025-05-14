import {
  IronEnum,
  EnumFactoryUnion
} from "../mod"; 


// recursive type definition
type ColTypes = {
  Int:    undefined;
  Text:   undefined;
  List:   { of: EnumFactoryUnion<ColTypes> };
  Object: { props: Record<string, EnumFactoryUnion<ColTypes>> };
}

const Col = IronEnum<ColTypes>();

type PrimitiveMap = {
  Int:  number;
  Text: string;
};

type ColumnPrimitive<T> =
  /* List ----------------------------------------------------------- */
  T extends { tag: "List"; payload: infer P }
    ? P extends { of: infer Inner }
        ? ColumnPrimitive<Inner>[]
        : never
  /* Object --------------------------------------------------------- */
  : T extends { tag: "Object"; payload: infer P }
    ? P extends { props: infer Props }
        ? { [K in keyof Props]: ColumnPrimitive<Props[K]> }
        : never
  /* Leaves --------------------------------------------------------- */
  : T extends { tag: infer Tag }
      ? Tag extends keyof PrimitiveMap
          ? PrimitiveMap[Tag]
          : never
  : never;

type SchemaPrimitives<S> =
  S extends Record<string, EnumFactoryUnion<ColTypes>>
    ? { [K in keyof S]: ColumnPrimitive<S[K]> }
    : never;


const ProductTable = {
  columns: {
    id:    Col.Int(),
    name:  Col.Text(),
    tags:  Col.List({ of: Col.Text() }),
    info:  Col.Object({
      props: {
        dimensions: Col.Object({
          props: {
            width:  Col.Int(),
            height: Col.Int(),
            depth:  Col.Int()
          }
        }),
        gallery: Col.List({ of: Col.Text() })
      }
    })
  }
} as const;


type ProductRow = SchemaPrimitives<(typeof ProductTable)["columns"]>;
/*
      ^?
ProductRow = {
  id:   number;
  name: string;
  tags: string[];
  info: {
    dimensions: {
      width:  number;
      height: number;
      depth:  number;
    };
    gallery: string[];
  };
}
*/

const demo: ProductRow = {
  id:   1,
  name: "Totoro Plush",
  tags: ["cute", "collectible"],
  info: {
    dimensions: { width: 10, height: 15, depth: 8 },
    gallery:    ["/img/01.jpg", "/img/02.jpg"]
  }
};

console.log(demo);
