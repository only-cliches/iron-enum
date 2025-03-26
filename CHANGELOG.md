# Change Log

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