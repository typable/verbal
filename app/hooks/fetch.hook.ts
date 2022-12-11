import { useState } from "../deps.ts";
import { Option, Config, Endpoint, SetState, Method } from "../types.ts";

export type UseFetch<T> = Fetch<T>;

export interface Fetch<T> {
  value: Option<T>,
  pending: boolean,
  error: Option<Error>,
  setValue: SetState<T>,
  doFetch: (props?: FetchProps) => Promise<void>,
}

export interface FetchProps {
  query?: string[],
  payload?: Record<string, string>,
}

interface FetchOptions {
  method?: string,
  headers?: Record<string, string>,
  body?: string,
}

interface FetchData<T> {
  ok: boolean,
  data: Option<T>,
  error: Option<{ message: string }>,
}

export default function useFetch<T>(config: Config, endpoint: Endpoint, initial?: T) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(initial);
  const [error, setError] = useState(initial);

  async function doFetch(props?: FetchProps) {
    setPending(true);
    setValue(null);
    setError(null);
    let url = `${config.host}:${config.port}/api${endpoint.path(props?.query ?? [])}`;
    const options: FetchOptions = {
      method: endpoint.method,
      headers: { 'verbal-token': '1382d700-d1f7-4455-abab-b2d831a686b4' },
    };
    if (props?.payload != null) {
      if (endpoint.method === Method.POST || endpoint.method === Method.PUT) {
        options.body = JSON.stringify(props?.payload);
      }
      else {
      url += '?' + new URLSearchParams(props?.payload).toString();
      }
    }
    try {
      const rsp = await fetch(url, options);
      const data: FetchData<T> = await rsp.json();
      if (data.ok) {
        setValue(data.data);
      }
      else {
        setError(data.error);
      }
      setPending(false);
    }
    catch (error) {
      setError(error);
      setPending(false);
    }
  }

  return { value, pending, error, setValue, doFetch };
}
