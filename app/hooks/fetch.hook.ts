import { useState } from "../deps.ts";
import { Option, Config, Endpoint, SetState } from "../types.ts";

export type UseFetch<T> = Fetch<T>;

export interface Fetch<T> {
  value: Option<T>,
  pending: boolean,
  error: Option<Error>,
  setValue: SetState<T>,
  doFetch: (payload?: Record<string, string>) => Promise<void>,
}

export interface FetchOptions {
  method?: string,
  headers?: Record<string, string>,
  body?: string,
}

export default function useFetch<T>(config: Config, endpoint: Endpoint, initial?: T) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(initial);
  const [error, setError] = useState(initial);

  async function doFetch(payload?: Record<string, string>) {
    setPending(true);
    let url = `${config.host}:${config.port}/api/${endpoint.path}`;
    const options: FetchOptions = {
      method: endpoint.method,
      headers: { 'verbal-token': '1382d700-d1f7-4455-abab-b2d831a686b4' },
    };
    if (payload != null) {
      if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
        options.body = JSON.stringify(payload);
      }
      else {
      url += '?' + new URLSearchParams(payload).toString();
      }
    }
    try {
      const rsp = await fetch(url, options);
      const data = await rsp.json();
      setValue(data.data);
      setPending(false);
    }
    catch (error) {
      setError(error);
      setPending(false);
    }
  }

  return { value, pending, error, setValue, doFetch };
}
