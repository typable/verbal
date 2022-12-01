import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function SearchPage() {
  const context: GlobalContext = useContext(global);
  const { doBack } = context;

  return html`
    <search-page>
      <h1>Search</h1>
      <a @click="${doBack}" href="/">Back</a>
    </search-page>
  `;
}
