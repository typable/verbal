import { html, dyn, createContext } from './deps.ts';

export const global = createContext({});

export default function App() {
  return html`
    ${dyn(global.Provider, { value: null })`
      <div></div>
    `}
  `;
}
