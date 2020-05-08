# http://hqjs.org
Transform name imports for web browser

# Installation
```sh
npm install hqjs@babel-plugin-transform-name-imports
```

# Usage
```json
{
  "plugins": [[ "hqjs@babel-plugin-transform-name-imports", {
      "resolve": { "vue": "vue/dist/vue.esm.js" },
      "versions": { "react": "react@16.0.1" },
    }]]
}
```

# Transformation
Plugin will transform all bare imports into absolute imports starting with `/node_modules/`, it will take care of [builtins](https://github.com/webpack/node-libs-browser), substitute resolution configured by `resolved` parameter and pick correct version specified in `version` option.

So script
```js
import React from 'react';
import Vue from 'vue';
import { Component, OnInit } from '@angular/core';

(async () => {
  const { default: ReactDOM } = await import('react-dom');
})();
```

will turn into

```js
import React from "/node_modules/react";
import Vue from "/node_modules/vue";
import { Component, OnInit } from "/node_modules/@angular/core";

(async () => {
  const { default: ReactDOM } = await import("/node_modules/react-dom");
})();
```
