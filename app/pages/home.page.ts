import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function HomePage() {
  const { routing, account }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  
  return html`
    <home-page>
      <h1>Listen to radio stations from around the globe</h1>
      <p>Name: ${account.pending ? 'Loading...' : account.value?.name ?? 'None'}</p>
      <a @click="${doRoute}" href="/search">Search</a>
      <a @click="${doRoute}" href="/profile">Profile</a>
    </home-page>
  `;
}
