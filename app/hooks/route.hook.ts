import { useEffect, useState } from "../deps.ts";
import { UseState, Option } from "../types.ts";

export type UseRoute = Routing;
export type Routes = Record<string, [string, Route]>;
export type Route = (props: string[]) => unknown;

export interface Routing {
  route: Option<Route>,
  current: Option<[string, Route]>,
  setRoute: (path: string, preventUpdate?: boolean, force?: boolean) => void,
  doRoute: (event: Event) => void,
  doBack: (event: Event) => void,
  isActive: (a: Option<[string, Route]>, b: Option<[string, Route]>) => boolean,
}

export default function useRoute(routes: Routes, initial: [string, Route], fallback: [string, Route]): Routing {
  const [current, setCurrent]: UseState<[string, Route]> = useState(initial);
  const [value, setValue]: UseState<Route> = useState(initial[1]);
  
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
    let current: Option<[string, Route]> = null;
    let route: Option<Route> = null;
    for (const [key, value] of Object.values(routes)) {
      const exp = new RegExp(`^${key}$`);
      const match = exp.exec(path);
      if (match) {
        const [, ...groups] = match;
        current = [key, value];
        route = groups.length > 0 ? () => value(groups) : value;
        break;
      }
    }
    if (force !== true && window.location.pathname === path) {
      return;
    }
    if (route == null) {
      setCurrent(fallback);
      setValue(fallback[1]);
    }
    else {
      setCurrent(current);
      setValue(route);
    }
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

  function isActive(a: Option<[string, Route]>, b: Option<[string, Route]>): boolean {
    return a?.[0] === b?.[0];
  }

  return { route: value, current, setRoute, doRoute, doBack, isActive };
}
