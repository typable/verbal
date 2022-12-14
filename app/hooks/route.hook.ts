import { useEffect, useState } from "../deps.ts";
import { UseState, Option } from "../types.ts";

export type UseRoute = Routing;
export type Routes = Record<string, Route>;
export type Route = [path: string, resolver: Resolver];
export type Resolver = (props: string[]) => unknown;

export interface Routing {
  path: Option<string>,
  resolver: Option<Resolver>,
  setRoute: (path: string, options?: RouteOptions) => void,
  doRoute: (event: Event) => void,
  doBack: (event: Event) => void,
  isActive: (path: Option<string>, route: Option<Route>) => boolean,
}

export interface RouteOptions {
  update?: boolean,
  force?: boolean,
}

export default function useRoute(routes: Routes, initial: Route, fallback: Route): Routing {
  const [path, setPath]: UseState<string> = useState(initial[0]);
  const [resolver, setResolver]: UseState<Resolver> = useState(initial[1]);
  
  useEffect(() => {
    addEventListener('popstate', onPopState);
    return () => {
      removeEventListener('popstate', onPopState);
    }
  }, []);

  function onPopState() {
    const path = window.location.pathname;
    setRoute(path, { update: false, force: true });
  }
  
  function setRoute(path: string, options: RouteOptions = { update: true, force: false }) {
    let current: Option<Route> = null;
    for (const [key, resolver] of Object.values(routes)) {
      const match = new RegExp(`^${key}$`).exec(path);
      if (match) {
        const [, ...groups] = match;
        current = [key, () => resolver(groups)];
        break;
      }
    }
    if (!options.force && window.location.pathname === path) {
      return;
    }
    if (current == null) {
      setPath(fallback[0]);
      setResolver(fallback[1]);
    }
    else {
      setPath(current[0]);
      setResolver(current[1]);
    }
    if (options.update) {
      window.history.pushState(null, '', path);
    }
  }
  
  function doRoute(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;
    if (!(element instanceof HTMLAnchorElement)) {
      console.error('doRoute can only be called to an anchor element!');
      return;
    }
    const path = element.pathname;
    if (!path) {
      console.warn('No path was specificed for doRoute call!');
      return;
    }
    setRoute(path);
  }
  
  function doBack(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    window.history.back();
    const path = window.location.pathname;
    setRoute(path, { update: false });
  }

  function isActive(path: Option<string>, route: Option<Route>): boolean {
    return path === route?.[0];
  }

  return { path, resolver, setRoute, doRoute, doBack, isActive };
}
