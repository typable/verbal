import { html, dyn, createContext, useEffect } from './deps.ts';
import useFetch, { UseFetch } from "./hooks/fetch.hook.ts";
import useRoute from "./hooks/route.hook.ts";
import HomePage from './pages/home.page.ts';
import LoginPage from './pages/login.page.ts';
import ProfilePage from './pages/profile.page.ts';
import RegisterPage from './pages/register.page.ts';
import SearchPage from './pages/search.page.ts';
import StationPage from "./pages/station.page.ts";
import VerifyPage from "./pages/verify.page.ts";
import { User, Config, Endpoint, GlobalContext, Method } from './types.ts';

export const global = createContext({});

export const CONFIG: Config = {
  host: 'http://localhost',
  port: 4202,
}

export const ENDPOINTS: Record<string, Endpoint> = {
  GET_USER: { method: Method.GET, path: () => '/user' },
  GET_SEARCH: { method: Method.GET, path: () => '/search' },
  GET_STATION: { method: Method.GET, path: ([id]: string[]) => '/station/' + id },
  DO_LOGIN: { method: Method.POST, path: () => '/login' },
  DO_REGISTER: { method: Method.POST, path: () => '/register' },
  DO_VERIFY: { method: Method.POST, path: () => '/verify' },
}

const ROUTES = {
  '/': () => dyn(HomePage),
  '/search': () => dyn(SearchPage),
  '/profile': () => dyn(ProfilePage),
  '/login': () => dyn(LoginPage),
  '/register': () => dyn(RegisterPage),
  '/verify/([\\w\\d-]+)': ([code]: string[]) => dyn(VerifyPage, { code }),
  '/station/(\\d+)': ([id]: string[]) => dyn(StationPage, { id }),
}

export default function App() {
  const [route, setRoute, doRoute, doBack] = useRoute(ROUTES, '/');
  const user: UseFetch<User> = useFetch(CONFIG, ENDPOINTS.GET_USER);

  useEffect(() => {
    const path = window.location.pathname;
    setRoute(path, true);
    user.doFetch();
  }, []);
  
  const context: GlobalContext = {
    routing: { route, setRoute, doRoute, doBack },
    user
  }
  
  return html`
    ${dyn(global.Provider, { value: context })`
      ${dyn(route)}
    `}
  `;
}
