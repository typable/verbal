import { useEffect, useState } from "../deps.ts";
import { UseState, Option } from "../types.ts";

export type UseRoute = Routing;
export type Route = (props: string[]) => unknown;

export interface Routing {
  route: Route,
  setRoute: (p: string, u?: boolean, f?: boolean) => void,
  doRoute: (e: Event) => void,
  doBack: (e: Event) => void,
}

export default function useRoute(routes: Record<string, Route>, path: string): Routing {
  const [value, setValue]: UseState<Route> = useState(routes[path]);
  
  useEffect(() => {
    addEventListener('popstate', onPopState);
    return () => {
      removeEventListener('popstate', onPopState);
    }
  }, []);

  function onPopState() {
    const path = window.location.pathname;
    setRoute(path, true, true);
  }
  
  function setRoute(path: string, preventUpdate?: boolean, force?: boolean) {
    let route: Option<Route> = null;
    for (const [key, value] of Object.entries(routes)) {
      const exp = new RegExp(`^${key}$`);
      const match = exp.exec(path);
      if (match) {
        const [, ...groups] = match;
        route = () => value(groups);
        break;
      }
    }
    if (route == null) {
      console.warn('No route for given path found!');
      return;
    }
    if (force !== true && window.location.pathname === path) {
      return;
    }
    setValue(route);
    if (preventUpdate !== true) {
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
    setRoute(path, true);
  }
  
  return { route: value, setRoute, doRoute, doBack };
}
