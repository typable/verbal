import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export type Props = {
  id: string;
}

export default function StationPage(props: Props) {
  const { routing }: GlobalContext = useContext(global);
  const { doBack } = routing;

  return html`
    <station-page>
      <h1>Station</h1>
      <p>Id: ${props.id}</p>
      <a @click="${doBack}" href="/">Back</a>
    </station-page>
  `;
}
