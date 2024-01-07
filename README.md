# @douglowder/metro-resolver-platform-variants

_Experimental_ custom resolver to resolve source files with variants specific to a platform variant. Using this resolver instead of simply customizing the `sourceExts` in the Metro config allows different platform variants (e.g. tvOS, ipadOS, visionOS) to select which variants will be resolved.

For example, if the resolver is passed `platformVariant=tv` as an option, source files will be resolved in the following priority order:

```
file.ios.tv.tsx
file.tv.tsx
file.ios.tsx
file.tsx
```

(and similarly for android)

If no `platformVariant` option is passed in, resolution passes to the default resolver.

The resolver is designed to pass to the default resolver quickly if no "variant" files are found, so if there are only a few variant specific files in the source tree, bundling performance is not significantly impacted.

## Usage

```js
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  platformVariantResolver,
} = require('@react-native-tvos/metro-resolver-platform-variants');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    resolveRequest: platformVariantResolver,
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

```sh
# Metro build example command line
npx metro build -p ios -g -c metro.config.js --resolver-option platformVariant=tv --out test.bundle.js --reset-cache index.js
```

This resolver is not yet enabled by default in React Native TV, so to try out the resolver, you would need to have the above `metro.config.js`, and make the following patch to tvOS source code:

```diff
diff --git a/node_modules/react-native/React/Base/RCTBundleURLProvider.mm b/node_modules/react-native/React/Base/RCTBundleURLProvider.mm
index aa8753376e1..4cb66e99de0 100644
--- a/node_modules/react-native/React/Base/RCTBundleURLProvider.mm
+++ b/node_modules/react-native/React/Base/RCTBundleURLProvider.mm
@@ -314,6 +314,9 @@ static NSURL *serverRootWithHostPort(NSString *hostPort, NSString *scheme)
     [[NSURLQueryItem alloc] initWithName:@"inlineSourceMap" value:inlineSourceMap ? @"true" : @"false"],
     [[NSURLQueryItem alloc] initWithName:@"modulesOnly" value:modulesOnly ? @"true" : @"false"],
     [[NSURLQueryItem alloc] initWithName:@"runModule" value:runModule ? @"true" : @"false"],
+#if TARGET_OS_TV
+    [[NSURLQueryItem alloc] initWithName:@"resolver.platformExtension" value:@"tv"],
+#endif
   ];

   NSString *bundleID = [[NSBundle mainBundle] objectForInfoDictionaryKey:(NSString *)kCFBundleIdentifierKey];
```
