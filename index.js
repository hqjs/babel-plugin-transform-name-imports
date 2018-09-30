// TODO: complete mapping https://github.com/webpack/node-libs-browser
// TODO: some names remain the same, but require library to be installed e.g. assert, buffer, events
const BUILT_IN = {
  http: 'stream-http',
  https: 'https-browserify',
  zlib: 'browserify-zlib',
};

const NAME_PATTERN_MODULE = /((@[\w-.]+\/)?[\w-.]+)(.*)/;

const resolveModulePath = value => {
  const [ , module, , rest ] = NAME_PATTERN_MODULE.exec(value);
  const name = BUILT_IN[module] || module;
  return `/node_modules/${name}${rest}`;
};

const notNameImport = modName => (/^\.{0,2}\//).test(modName) || (/^https?:\/\//).test(modName);

module.exports = function({ types: t }) {
  return {
    visitor: {
      CallExpression(nodePath) {
        const { node } = nodePath;
        if (node.callee.name !== 'require') return;
        const [ requireArg, ...rest ] = node.arguments;
        if (rest.length !== 0 || !t.isStringLiteral(requireArg) || nodePath.scope.hasBinding('require')) return;
        const { value: modName } = requireArg;
        if (notNameImport(modName)) return;
        requireArg.value = resolveModulePath(modName);
      },
      ExportNamedDeclaration(nodePath) {
        const { source } = nodePath.node;
        if (source === null) return;
        const { value: modName } = source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(modName);
      },
      ImportDeclaration(nodePath) {
        const { value: modName } = nodePath.node.source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(modName);
      },
    },
  };
};
