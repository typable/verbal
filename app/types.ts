import { Fetch } from './hooks/fetch.hook.ts';
import { Route } from './hooks/route.hook.ts';

export type UseState<T> = [T, SetState<T>];
export type UseStateRef<T> = [T, SetState<T>, Ref<T>];
export type SetState<T> = (t: Option<T>) => void;
export type Option<T> = T | null | undefined;
export type Callback<T> = (t: T) => void;
export type ChangeEvent<T extends HTMLElement> = Event & {
  target: T,
}

export type Endpoint = { method: string, path: string };

export interface Ref<T> {
  current: T,
}

export interface Config {
  host: string,
  port: number,
}

export interface GlobalContext {
  routing: Routing,
  account: Fetch<Account>,
}

export interface Routing {
  route: Route,
  setRoute: (p: string) => void,
  doRoute: (e: Event) => void,
  doBack: (e: Event) => void,
}

export interface Account {
  id: number,
  name: string,
  language: string,
  playtime: number,
}

export interface Station {
  id: number,
  uid: string,
  name: string,
  url: string,
  icon?: string,
  city?: string,
  state?: string,
  country?: string,
  is_favorite: boolean,
  is_icon?: boolean,
}

export type SearchQuery = {
  name: string;
}
