import { html, dyn, createContext, useEffect } from './deps.ts';
import useFetch, { UseFetch } from "./hooks/fetch.hook.ts";
import useRoute from "./hooks/route.hook.ts";
import HomePage from './pages/home.page.ts';
import ProfilePage from './pages/profile.page.ts';
import SearchPage from './pages/search.page.ts';
import { Account, Config, Endpoint, GlobalContext } from './types.ts';

export const global = createContext({});

export const CONFIG: Config = {
  host: 'http://localhost',
  port: 4202,
}

export const ENDPOINTS: Record<string, Endpoint> = {
  GET_ACCOUNT: { method: 'GET', path: 'account' },
  GET_SEARCH: { method: 'GET', path: 'search' },
}

const ROUTES = {
  '/': () => dyn(HomePage),
  '/search': () => dyn(SearchPage),
  '/profile': () => dyn(ProfilePage),
}

export default function App() {
  const [route, setRoute, doRoute, doBack] = useRoute(ROUTES, '/');
  const account: UseFetch<Account> = useFetch(CONFIG, ENDPOINTS.GET_ACCOUNT);

  useEffect(() => {
    const path = window.location.pathname;
    setRoute(path, true);
    account.doFetch();
  }, []);
  
  const context: GlobalContext = {
    routing: { route, setRoute, doRoute, doBack },
    account
  }
  
  return html`
    ${dyn(global.Provider, { value: context })`
      ${dyn(route)}
    `}
  `;
}
