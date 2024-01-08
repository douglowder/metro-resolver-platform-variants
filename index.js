const { name, version } = require('./package.json');

const platformVariantResolver = (context, moduleName, platform) => {
  const platformVariant = context.customResolverOptions?.platformVariant || '';
  if (platformVariant === '') {
    return context.resolveRequest(context, moduleName, platform);
  }
  const customSourceExts = [
    ...context.sourceExts.map((ext) => `${platformVariant}.${ext}`),
    ...context.sourceExts,
  ];
  const customContext = {
    ...context,
    sourceExts: customSourceExts,
  };
  const result = context.resolveRequest(customContext, moduleName, platform);
  if (
    result?.filePath &&
    result?.filePath?.indexOf(`.${platformVariant}.`) !== -1
  ) {
    console.log(`${name}@${version}: resolved ${result.filePath}`);
  }
  return result;
};

module.exports = {
  platformVariantResolver,
};
