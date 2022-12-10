import { useEffect, useRef, useState } from "./deps.ts";
import { Option, Route, UseRoute, UseState, UseStateRef } from "./types.ts";

export function useStateRef<T>(initial: Option<unknown>): UseStateRef<T> {
  const [value, setValue]: UseState<T> = useState(initial);
  const ref = useRef(value);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return [value, setValue, ref];
}

export function useRoute(routes: Record<string, Route>, path: string): UseRoute {
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
