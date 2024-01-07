const glob = require('glob');

const sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];

const basePathFromDefaultResolver = (filePath, platform) => {
  let basePath = filePath;
  let foundExt;
  for (const ext of sourceExts) {
    const extPos = basePath.length - ext.length - 1;
    if (basePath.indexOf(`.${ext}`) === extPos) {
      basePath = basePath.substring(0, extPos);
      foundExt = ext;
      break;
    }
  }
  const platformPos = basePath.length - platform.length - 1;
  if (basePath.indexOf(`.${platform}`) === platformPos) {
    basePath = basePath.substring(0, platformPos);
  }
  return {
    basePath,
    ext: foundExt,
  };
};

const platformVariantResolver = (context, moduleName, platform) => {
  const platformVariant = context.customResolverOptions?.platformVariant || '';
  let result;
  if (platformVariant !== '') {
    // Try default resolver first, and check for alternative paths
    // This will perform better as files with custom extensions are rare
    try {
      result = context.resolveRequest(context, moduleName, platform);
      if (result && result.type === 'sourceFile') {
        const {basePath, ext} = basePathFromDefaultResolver(
          result.filePath,
          platform,
        );
        const possiblePaths = glob.sync(`${basePath}.*.${ext}`);
        if (
          possiblePaths.length === 1 &&
          possiblePaths[0] === result.filePath
        ) {
          // there is only one file and we already found it, so return the result
          return result;
        }
        const possiblePathSet = new Set(possiblePaths);
        // name.ios.tv.js
        const platformPlusVariantPath = `${basePath}.${platform}.${platformVariant}.${ext}`;
        if (possiblePathSet.has(platformPlusVariantPath)) {
          console.log(
            `Platform variant resolver first pass found ${platformPlusVariantPath}`,
          );
          return {
            ...result,
            filePath: platformPlusVariantPath,
          };
        }
        // name.tv.js
        const variantPath = `${basePath}.${platformVariant}.${ext}`;
        if (possiblePathSet.has(variantPath)) {
          console.log(
            `Platform variant resolver first pass found ${variantPath}`,
          );
          return {
            ...result,
            filePath: variantPath,
          };
        }
      }
      return result;
    } catch (_e) {}
    // If we get here, the default resolver failed, so see if our custom extensions are there
    try {
      // name.ios.tv.js
      const resultWithPlatformPlusVariant = context.resolveRequest(
        context,
        moduleName,
        `${platform}.${platformVariant}`,
      );
      if (
        resultWithPlatformPlusVariant.filePath.indexOf(
          `.${platformVariant}.`,
        ) !== -1
      ) {
        console.log(
          `Platform variant resolver second pass found ${resultWithPlatformPlusVariant.filePath}`,
        );
        return resultWithPlatformPlusVariant;
      }
    } catch (_e) {}
    try {
      // name.tv.js
      const resultWithVariant = context.resolveRequest(
        context,
        moduleName,
        platformVariant,
      );
      if (resultWithVariant.filePath.indexOf(`.${platformVariant}.`) !== -1) {
        console.log(
          `Platform variant resolver second pass found ${resultWithVariant.filePath}`,
        );
        return resultWithVariant;
      }
    } catch (_e) {}
  }
  // If no matches above, return the normal Metro resolver result
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = {
  platformVariantResolver,
};
