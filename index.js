// TODO: complete mapping https://github.com/webpack/node-libs-browser
// TODO: some names remain the same, but require library to be installed e.g. assert, buffer, events
const BUILT_IN = {
  http: 'stream-http',
  https: 'https-browserify',
  zlib: 'browserify-zlib',
};

const NAME_PATTERN_MODULE = /((@[\w-.]+\/)?[\w-.]+)(.*)/;

const resolveModulePath = (resolve, value) => {
  const [ , module, , rest ] = NAME_PATTERN_MODULE.exec(value);
  const name = rest === '' ?
    resolve[module] || BUILT_IN[module] || module :
    BUILT_IN[module] || module;
  return `/node_modules/${name}${rest}`;
};

const notNameImport = modName => (/^\.{0,2}\//).test(modName) || (/^https?:\/\//).test(modName);

// TODO handle dynamic require
const notRequire = (t, nodePath) => {
  const [ requireArg, ...rest ] = nodePath.node.arguments;
  return nodePath.node.callee.name !== 'require' ||
    rest.length !== 0 ||
    !t.isStringLiteral(requireArg) ||
    nodePath.scope.hasBinding('require');
};

module.exports = function({ types: t }) {
  return {
    visitor: {
      CallExpression(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const { node } = nodePath;
        if (notRequire(t, nodePath)) return;
        const [ requireArg ] = node.arguments;
        const { value: modName } = requireArg;
        if (notNameImport(modName)) return;
        requireArg.value = resolveModulePath(resolve, modName);
      },
      ExportNamedDeclaration(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const { source } = nodePath.node;
        if (source === null) return;
        const { value: modName } = source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(resolve, modName);
      },
      ImportDeclaration(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const { value: modName } = nodePath.node.source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(resolve, modName);
      },
    },
  };
};
