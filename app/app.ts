import NavComponent from "./components/nav.component.ts";
import { html, dyn, createContext, useEffect } from './deps.ts';
import useFetch, { UseFetch } from "./hooks/fetch.hook.ts";
import useRoute, { UseRoute } from "./hooks/route.hook.ts";
import useTranslate from "./hooks/translate.hook.ts";
import HomePage from './pages/home.page.ts';
import LoginPage from './pages/login.page.ts';
import ProfilePage from './pages/profile.page.ts';
import RegisterPage from './pages/register.page.ts';
import ResetPage from "./pages/reset.page.ts";
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
  GET_USER_BY_NAME: { method: Method.GET, path: ([name]: string[]) => '/user/' + name },
  GET_SEARCH: { method: Method.GET, path: () => '/search' },
  GET_STATION_BY_ID: { method: Method.GET, path: ([id]: string[]) => '/station/' + id },
  DO_LOGIN: { method: Method.POST, path: () => '/login' },
  DO_REGISTER: { method: Method.POST, path: () => '/register' },
  DO_VERIFY: { method: Method.POST, path: () => '/verify' },
  GET_RESET: { method: Method.GET, path: () => '/reset' },
  DO_RESET: { method: Method.POST, path: () => '/reset' },
}

const ROUTES = {
  '/': () => dyn(HomePage),
  '/search': () => dyn(SearchPage),
  '/profile': () => dyn(ProfilePage),
  '/profile/([\\w\\d-_]+)': ([name]: string[]) => dyn(ProfilePage, { name }),
  '/login': () => dyn(LoginPage),
  '/register': () => dyn(RegisterPage),
  '/verify/([\\w\\d-]+)': ([code]: string[]) => dyn(VerifyPage, { code }),
  '/reset/?([\\w\\d-]+)?': ([code]: string[]) => dyn(ResetPage, { code }),
  '/station/(\\d+)': ([id]: string[]) => dyn(StationPage, { id }),
}

export default function App() {
  const routing: UseRoute = useRoute(ROUTES, '/');
  const user: UseFetch<User> = useFetch(CONFIG, ENDPOINTS.GET_USER);
  const { route, setRoute } = routing;
  const translation = useTranslate();
  const { setLanguage } = translation;

  useEffect(() => {
    const path = window.location.pathname;
    setRoute(path, true, true);
    user.doFetch();
  }, []);

  useEffect(() => {
    if (!user.pending && user.value != null) {
      setLanguage(user.value.language ?? 'en');
    }
  }, [user.pending, user.value]);
  
  const context: GlobalContext = {
    routing,
    user,
    translation,
  }
  
  return html`
    ${dyn(global.Provider, { value: context })`
      ${dyn(NavComponent)}
      <main>
        ${dyn(route)}
      </main>
    `}
  `;
}
