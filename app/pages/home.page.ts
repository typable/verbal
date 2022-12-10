import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function HomePage() {
  const { routing }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  
  return html`
    <home-page>
      <h1>Homepage</h1>
      <a @click="${doRoute}" href="/search">Search</a>
      <a @click="${doRoute}" href="/profile">Profile</a>
    </home-page>
  `;
}
