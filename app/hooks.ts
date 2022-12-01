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
  const [, setHistory, historyRef]: UseStateRef<string[]> = useStateRef([]);
  
  useEffect(() => {
      const history = [...historyRef.current];
      history.push(path);
      setHistory(history);
  }, []);
  
  function setRoute(path: string, preventUpdate?: boolean) {
    const route = routes[path];
    if (route === undefined) {
      console.warn('No route for given path found!');
      return;
    }
    setValue(route);
    if (preventUpdate !== true) {
      const history = [...historyRef.current];
      history.push(path);
      setHistory(history);
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
    const history = historyRef.current;
    history.pop();
    const route = history.at(-1);
    if (route !== undefined) {
      setHistory(history);
      setRoute(route, false);
    }
  }
  
  return [value, setRoute, doRoute, doBack];
}
