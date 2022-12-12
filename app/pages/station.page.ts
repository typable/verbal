import { CONFIG, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch, { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext, StationDetail } from "../types.ts";

export type Props = {
  id: string;
}

export default function StationPage(props: Props) {
  const { routing }: GlobalContext = useContext(global);
  const { doBack } = routing;
  const station: UseFetch<StationDetail> = useFetch(CONFIG, ENDPOINTS.GET_STATION_BY_ID);

  useEffect(() => {
    station.doFetch({ query: [props.id] });
  }, [props.id]);

  return html`
    <station-page>
      <h1>${station.value?.name}</h1>
      <p>Id: ${station.value?.id}</p>
      <p>Description: ${station.value?.description}</p>
      <a @click="${doBack}" href="/">Back</a>
    </station-page>
  `;
}
