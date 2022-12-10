import { useEffect, useState } from "../deps.ts";
import { UseState } from "../types.ts";

export type UseRoute = [Route, (p: string, u?: boolean) => void, (e: Event) => void, (e: Event) => void];
export type Route = unknown;

export default function useRoute(routes: Record<string, Route>, path: string): UseRoute {
  const [value, setValue]: UseState<Route> = useState(routes[path]);
  
  useEffect(() => {
    addEventListener('popstate', onPopState);
    return () => {
      removeEventListener('popstate', onPopState);
    }
  }, []);

  function onPopState(_event: PopStateEvent) {
    const path = window.location.pathname;
    setRoute(path, true);
  }
  
  function setRoute(path: string, preventUpdate?: boolean) {
    const route = routes[path];
    if (route == null) {
      console.warn('No route for given path found!');
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
  
  return [value, setRoute, doRoute, doBack];
}
