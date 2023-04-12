import React from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import figure from 'https://typable.dev/cdn/figure-next/lib.js';

import NavComponent from './components/nav.component.ts';

const { dict, dyn } = figure(React.createElement);

const global = React.createContext({});

const html = dict({
  ctx: {
    global: global.Provider,
  },
  app: {
    nav: NavComponent,
  },
});

export { html, dyn, global, React, ReactDOM };
