# Iron Enum

Finally Rust like enums in Typescript!

- Ergonomic AF!
- Fully type safe!
- Only 400 bytes gzipped!
- Includes `Option` and `Result` types!

| [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |

Typescript enums only provide simple variants:
```ts
enum Shape {
    Square,
    Circle
}
```

But what if you wanted to provide data for each variant that is context specific?  Well now you can!

## Code Example
```ts
import { IronEnum } from "iron-enum";

const ShapeEnum = IronEnum<{
    Empty: {},
    Square: { width: number, height: number },
    Circle: { radius: number }
}>();

const exampleShape = ShapeEnum.Square({width: 22, height: 50});

// Supports matching, similar to switch case statements
exampleShape.match({
    // case Empty:
    Empty: () => {
        // runs if the shape is empty
    },
    // case Square: 
    Square: ({width, height}) => {
        // runs if the shape is square
    },
    // case Circle:
    Circle: ({radius}) => {
        // runs if the shape is circle
    }
});

// supports fallback cases
exampleShape.match({
    Square: ({width, height}) => {
        // runs if the shape is square
    },
    _: () => {
        // runs if it's anything but a square
    }
});


// Supports returns through match
const result = exampleShape.match({
    Empty: () => return 0;
    Square: ({width, height}) => width,
    _: () => false
});
// result type is inherited from match arm return types.
// typeof result == number | boolean

if (exampleShape.if.Square()) {
    // runs if the shape is a square
}

if (exampleShape.ifNot.Square()) {
    // runs if the shape is NOT a square
}

console.log(exampleShape.unwrap())
// output: ["Square", { width: 22, height: 50 }]

// this method will only allow ShapeEnum variants as an argument
const someFn = (onlyShapeEnum: typeof ShapeEnum._self.prototype) => {

}
```

Just like in Rust, the `.match(...)` keys *must* contain a callback for each variant OR provide a fallback method with a `_` property.  Failing this constraint leads to a type error.

## Option & Result Examples
```ts
import { Option, Result } from "iron-enum";

const NumOption = Option<number>();

const myNum = NumOption.Some(22);

myNum.match({
    Some: (num) => {
        // only runs if myNum is "Some" variant
    },
    None: () => {
        // only runs if myNum is "None" variant
    }
})

const NumResult = Result<number, Error>();

const myNum2 = NumResult.Ok(22);

myNum2.match({
    Ok: (num) => {
        // only runs if myNum2 is "Ok" variant
    },
    Err: () => {
        // only runs if myNum2 is "Err" variant
    }
})

if (myNum2.if.Ok()) {
    // only runs if myNum2 is "Ok" variant
}
```