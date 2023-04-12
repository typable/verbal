import { html, global, React } from "../deps.ts";
import { GlobalContext } from "../types.ts";

const { useContext } = React;

export default function ErrorPage() {
  const { routing }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  
  return html`
    <error-page class="page">
      <section class="container slim-width">
        <h1>Not found</h1>
        <p><a on:click=${doRoute} href="/">Back to home</a></p>
      </section>
    </error-page>
  `;
}
