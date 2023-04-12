import { React } from "../deps.ts";
import { Option, Endpoint, SetState, Method } from "../types.ts";

const { useState } = React;

export type UseFetch<T> = Fetch<T>;

export interface Fetch<T> {
  value: Option<T>,
  pending: boolean,
  ok: Option<boolean>,
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

export default function useFetch<T>(address: string, endpoint: Endpoint, initial?: T) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(null);
  const [ok, setOk] = useState(null);
  const [error, setError] = useState(null);

  async function doFetch(props?: FetchProps) {
    setPending(true);
    setValue(null);
    setOk(null);
    setError(null);
    let url = `${address}/api${endpoint.path(props?.query ?? [])}`;
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
      setOk(data.ok);
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

  return { value, pending, ok, error, setValue, doFetch };
}
