import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch, { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext, StationDetail } from "../types.ts";

export type Props = {
  id: string;
}

export default function StationPage(props: Props) {
  const { routing, setStation }: GlobalContext = useContext(global);
  const { doBack } = routing;
  const station: UseFetch<StationDetail> = useFetch(ORIGIN, ENDPOINTS.GET_STATION_BY_ID);

  useEffect(() => {
    station.doFetch({ query: [props.id] });
  }, [props.id]);

  return html`
    <station-page>
      <section class="container full-width">
        <a @click="${doBack}" href="/">Back</a>
        <h1>${station.value?.name}</h1>
        <p>${station.value?.description}</p>
        <button @click="${() => setStation(station.value)}">Play</button>
      </section>
    </station-page>
  `;
}
