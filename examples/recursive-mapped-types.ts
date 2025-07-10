import {
	IronEnum,
	EnumFactoryUnion
} from "../mod";


// recursive Enum type definition
type ColTypes = {
	Int: { default?: number };
	Text: { default?: string };
	List: {
		of: EnumFactoryUnion<ColTypes> // inner reference
	};
	Object: {
		props: Record<string, EnumFactoryUnion<ColTypes>> // inner reference
	};
}

// Map Enum variants to primitves
type PrimitiveMap = {
	Int: number;
	Text: string;
};

type ColumnToType<T> =
	/* List ----------------------------------------------------------- */
	T extends { tag: "List"; payload: infer P }
		? P extends { of: infer Inner }
		? ColumnToType<Inner>[]
		: never
	/* Object --------------------------------------------------------- */
	: T extends { tag: "Object"; payload: infer P }
		? P extends { props: infer Props }
		? { [K in keyof Props]: ColumnToType<Props[K]> }
		: never
	/* Leaves --------------------------------------------------------- */
	: T extends { tag: infer Tag }
		? Tag extends keyof PrimitiveMap
		? PrimitiveMap[Tag]
		: never
		: never;

type SchemaPrimitives<S> =
	S extends Record<string, EnumFactoryUnion<ColTypes>>
	? { [K in keyof S]: ColumnToType<S[K]> }
	: never;


// Initilize our fancy type
const Col = IronEnum<ColTypes>();

// example usage
const ProductTable = {
	id: Col.Int(),
	name: Col.Text(),
	tags: Col.List({ of: Col.Text() }),
	info: Col.Object({
		props: {
			dimensions: Col.Object({
				props: {
					width: Col.Int(),
					height: Col.Int(),
					depth: Col.Int()
				}
			}),
			gallery: Col.List({ of: Col.Text() })
		}
	})
}


type ProductRow = SchemaPrimitives<typeof ProductTable>;
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
	id: 1,
	name: "Totoro Plush",
	tags: ["cute", "collectible"],
	info: {
		dimensions: { 
			width: 10, 
			height: 15, 
			depth: 8 
		},
		gallery: ["/img/01.jpg", "/img/02.jpg"]
	}
};

console.log(demo);
