# http://hqjs.org
Transform name imports for web browser

# Installation
```sh
npm install @hqjs/babel-plugin-transform-name-imports
```

# Usage
```json
{
  "plugins": [[ "@hqjs/babel-plugin-transform-name-imports", {
      "resolve": { "vue": "vue/dist/vue.esm.js" },
      "versions": { "react": "react@16.0.1" },
      "browser": {
        "module-a": "./shims/module-a.js",
        "module-b": false
      },
      "empty": "/hq-empty-module.js"
    }]]
}
```

# Transformation
Plugin will transform all bare imports into absolute imports starting with `/node_modules/`, it will take care of [builtins](https://github.com/webpack/node-libs-browser), substitute resolution configured by `resolved` parameter and pick correct version specified in `version` option. It will respect [package browser field spec](https://github.com/defunctzombie/package-browser-field-spec) for name imports if you pass `browser` parameter and specify `empty` files resolution path.

So script
```js
import React from 'react';
import Vue from 'vue';
import { Component, OnInit } from '@angular/core';

import 'module-a';
import 'module-b';

(async () => {
  const { default: ReactDOM } = await import('react-dom');
})();
```

will turn into

```js
import React from "/node_modules/react";
import Vue from "/node_modules/vue";
import { Component, OnInit } from "/node_modules/@angular/core";

import './shims/module-a.js';
import '/hq-empty-module.js';

(async () => {
  const { default: ReactDOM } = await import("/node_modules/react-dom");
})();
```
