import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function HomePage() {
  const { routing, user }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  
  return html`
    <home-page>
      <h1>Verbal</h1>
      <p>Email: ${user.pending ? 'Loading...' : user.value?.email ?? 'None'}</p>
      <a @click="${doRoute}" href="/search">Search</a>
      <a @click="${doRoute}" href="/profile">Profile</a>
      <a @click="${doRoute}" href="/login">Log in</a>
      <a @click="${doRoute}" href="/register">Register</a>
    </home-page>
  `;
}
