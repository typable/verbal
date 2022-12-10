import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function ProfilePage() {
  const { routing }: GlobalContext = useContext(global);
  const { doBack } = routing;

  return html`
    <profile-page>
      <h1>Profile</h1>
      <a @click="${doBack}" href="/">Back</a>
    </profile-page>
  `;
}
