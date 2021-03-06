// NOTE: complete mapping https://github.com/webpack/node-libs-browser
// TODO: some names remain the same, but require library to be installed e.g. assert, buffer, events
// TODO: serve this modules from hq instead of project root
const BUILT_IN = {
  console: 'console-browserify',
  constants: 'constants-browserify',
  crypto: 'crypto-browserify',
  domain: 'domain-browser',
  http: 'stream-http',
  https: 'https-browserify',
  os: 'os-browserify',
  path: 'path-browserify',
  querystring: 'querystring-es3',
  stream: 'stream-browserify',
  sys: 'util',
  timers: 'timers-browserify',
  tty: 'tty-browserify',
  vm: 'vm-browserify',
  zlib: 'browserify-zlib',
};

const NAME_PATTERN_MODULE = /((@[\w-.]+\/)?[\w-.]+)(.*)/;

const resolveModulePath = (resolve, versions, browser, empty, value) => {
  const [, module, , rest] = NAME_PATTERN_MODULE.exec(value);
  if (typeof browser[value] === 'string') {
    return browser[value];
  } else if (browser[value] === false) {
    return empty;
  } else if (typeof browser[module] === 'string') {
    return browser[module];
  } else if (browser[module] === false) {
    return empty;
  }
  const name = rest === '' ?
    resolve[module] || versions[module] || BUILT_IN[module] || module :
    // version is present
    rest.startsWith('@') ?
      BUILT_IN[module] || module :
      versions[module] || BUILT_IN[module] || module;
  return `/node_modules/${name}${rest}`;
};

const notNameImport = modName => (/^\.{0,2}\//).test(modName) ||
  (/^https?:\/\//).test(modName) ||
  (/^@\//).test(modName);

const notRequire = (t, nodePath) => {
  const [requireArg, ...rest] = nodePath.node.arguments;
  return nodePath.node.callee.name !== 'require' ||
    rest.length !== 0 ||
    !t.isStringLiteral(requireArg) ||
    nodePath.scope.hasBinding('require');
};

const notImport = (t, nodePath) => {
  const [requireArg, ...rest] = nodePath.node.arguments;
  return nodePath.node.callee.type !== 'Import' ||
    rest.length !== 0 ||
    !t.isStringLiteral(requireArg) ||
    nodePath.scope.hasBinding('import');
};

module.exports = function ({ types: t }) {
  return {
    visitor: {
      CallExpression(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const versions = (state.opts && state.opts.versions) || {};
        const browser = (state.opts && state.opts.browser) || {};
        const empty = (state.opts && state.opts.empty) || '/hq-empty-module.js';
        const { node } = nodePath;
        if (notRequire(t, nodePath) && notImport(t, nodePath)) return;
        const [requireArg] = node.arguments;
        const { value: modName } = requireArg;
        if (notNameImport(modName)) return;
        requireArg.value = resolveModulePath(resolve, versions, browser, empty, modName);
      },
      ExportNamedDeclaration(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const versions = (state.opts && state.opts.versions) || {};
        const browser = (state.opts && state.opts.browser) || {};
        const empty = (state.opts && state.opts.empty) || '/hq-empty-module.js';
        const { source } = nodePath.node;
        if (source === null) return;
        const { value: modName } = source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(resolve, versions, browser, empty, modName);
      },
      ExportAllDeclaration(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const versions = (state.opts && state.opts.versions) || {};
        const browser = (state.opts && state.opts.browser) || {};
        const empty = (state.opts && state.opts.empty) || '/hq-empty-module.js';
        const { source } = nodePath.node;
        if (source === null) return;
        const { value: modName } = source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(resolve, versions, browser, empty, modName);
      },
      ImportDeclaration(nodePath, state) {
        const resolve = (state.opts && state.opts.resolve) || {};
        const versions = (state.opts && state.opts.versions) || {};
        const browser = (state.opts && state.opts.browser) || {};
        const empty = (state.opts && state.opts.empty) || '/hq-empty-module.js';
        const { value: modName } = nodePath.node.source;
        if (notNameImport(modName)) return;
        nodePath.node.source.value = resolveModulePath(resolve, versions, browser, empty, modName);
      },
    },
  };
};
