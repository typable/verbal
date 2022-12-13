import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function ErrorPage() {
  const { routing }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  
  return html`
    <error-page class="page">
      <h1>Not found</h1>
      <p><a @click="${doRoute}" href="/">Back to home</a></p>
    </error-page>
  `;
}
