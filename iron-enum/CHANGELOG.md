# Change Log

## 1.7.2 Oct 28, 2025
- Added better type checking for the `_.parse` and `.toJSON` methods.
- README updates.

## 1.7.1 Oct 28, 2025
- README updates.

## 1.7.0 Oct 28, 2025
- Minor bugfixes.
- README improvements.
- Added VueJS and Zod helpers.
- BREAKING: Wire format updated from `{[tag]: data}` to `{"tag": tag, "data": data}`.  `toJSON` and `_.parse` updated accordingly.
- BREAKING: Removed duplicate `key()` and `property` properties.  The use case of these is already available via `tag` and `data` properties.
- BREAKING: Some internal types have been renamed.

## 1.6.3 July 11, 2025
- README and code documentation improvements.

## 1.6.2 July 10, 2025
- Added `factory` property to expose constructor.
- Updated examples.
- Added helper function to generate new enums from inside existing enums.
- More better tests.
- Cleaned up code comments.
- Keys can now be passed to the enum constructor to remove the need for a proxy.
- **BREAKING CHANGE** `if` and `ifNot` have been changed from `someEnum.if.variant(...callbacks)` to `someEnum.if("variant", ...callbacks)`.  This removes the proxies from the enum implmentation to improve performance.

## 1.6.1 May 13, 2025
- Fixed Readme duplicate for license tag.
- Added examples in Github

## 1.6.0 May 7, 2025
- Cleaned up doc examples.
- Added `isOk`, `isErr` to `Result` type.
- Added `isSome`, `isNone` to `Option` type.
- Shiny new README and playground

## 1.5.2 May 7, 2025
- Shortened error language to save space.
- Exported type `EnumFactoryUnion`.
- Added `Try.async` and `Try.sync` methods inspired by `https://www.npmjs.com/package/@asleepace/try`.


## 1.5.1 April 6, 2025
- Added `Ok`, `Err`, `Some` and `None` convinience functions.
- Better code comments
- `Result.unwrap` now calls the inner error, if it's an error type.

## 1.5.0 Mar 27, 2025
- Renamed the `unwrap` method to `toJSON`.
- Added Rust like helper methods to `Option` and `Result`.

## 1.4.3 Mar 25, 2025
- Updated README.

## 1.4.2 Mar 25, 2025
- Renamed `EnumBuilder` to `IronEnumInstance`.
- Updated return type for `Option` and `Result`.
- Updated README.

## 1.4.1 Mar 24, 2025
- Cleaned up README.

## 1.4.0 Mar 24, 2025
- Complete rewrite to improve type inference.
- You can no longer pass a `_` variant key to the constructor.
- Moved 'parse" and other enum properties to `_` key.

## 1.3.2 Mar 16, 2025
- Added new exported type `EnumFactory`.
- Fixed typing errors on `if` and `ifNot` callbacks.
- Added serialization and seserialization to readme.

## 1.3.1 Mar 6, 2025
- Removed `ExtractVariants` type and added `typeVariants` property to the `IronEnum` constructor function.
- Added `typeKeys` property.

## 1.3.0 Mar 1, 2025
- Updated internal handling of values, including return type of `unwrap`.
- Renamed `fromJSON` to `parse`.
- Removed `toJSON` method as it's no identical to `unwrap` method.

## 1.2.1 Feb 27, 2025
- Optional keys in the variant type are now supported.
- Added type to extract variants from IronEnum object.

## 1.2.0 Feb 16, 2025
- Fixed type flow throug `match` and `matchAsync` methods.
- added `toJSON` and `fromJSON` methods for handling standard JSON objects.
- Added `if else` callbacks to conditional functions.
- Improved error handling.

## 1.1.2 - Dec 14, 2024
- Minor rewrite, public API did not change.
- Improved code comments and clarity.
- Added error handling where it makes sense.
- Significantly improved README
- Added tests

## 1.0.4 - Oct 11, 2024
- Cleaned up documentation and readme.
  
## 1.0.3 - Oct 10, 2024
- Added missing info to mod.ts

## 1.0.2 - Oct 10, 2024
- Fixed readme typo.
- Added `Option` and `Result` types.

# 1.0.1 - Oct 9, 2024
- Initial release.