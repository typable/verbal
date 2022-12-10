export type UseState<T> = [T, SetState<T>];
export type UseStateRef<T> = [T, SetState<T>, Ref<T>];
export type SetState<T> = (t: Option<T>) => void;
export type Option<T> = T | null | undefined;

export interface Ref<T> {
  current: T,
}

export interface GlobalContext {
  routing: Routing,
}

export interface Routing {
  route: Route,
  setRoute: (p: string) => void,
  doRoute: (e: Event) => void,
  doBack: (e: Event) => void,
}

export type UseRoute = [Route, (p: string) => void, (e: Event) => void, (e: Event) => void];
export type Route = unknown;
