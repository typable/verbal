import { html, dyn, createContext, useEffect, useState } from './deps.ts';
import { User, Endpoint, GlobalContext, Method, UseState, StationDetail } from './types.ts';
import useFetch, { UseFetch } from "./hooks/fetch.hook.ts";
import useRoute, { Routes, UseRoute } from "./hooks/route.hook.ts";
import useTranslate from "./hooks/translate.hook.ts";
import HomePage from './pages/home.page.ts';
import LoginPage from './pages/login.page.ts';
import ProfilePage from './pages/profile.page.ts';
import RegisterPage from './pages/register.page.ts';
import ResetPage from "./pages/reset.page.ts";
import SearchPage from './pages/search.page.ts';
import StationPage from "./pages/station.page.ts";
import VerifyPage from "./pages/verify.page.ts";
import NavComponent from "./components/nav.component.ts";
import ErrorPage from "./pages/error.page.ts";
import LogoutPage from "./pages/logout.page.ts";

export const global = createContext({});

export const ORIGIN = window.location.origin;

export const ENDPOINTS: Record<string, Endpoint> = {
  GET_USER: { method: Method.GET, path: () => '/user' },
  GET_USER_BY_NAME: { method: Method.GET, path: ([name]: string[]) => '/user/' + name },
  GET_SEARCH: { method: Method.GET, path: () => '/search' },
  GET_STATION_BY_ID: { method: Method.GET, path: ([id]: string[]) => '/station/' + id },
  DO_LOGIN: { method: Method.POST, path: () => '/login' },
  DO_LOGOUT: { method: Method.POST, path: () => '/logout' },
  DO_REGISTER: { method: Method.POST, path: () => '/register' },
  DO_VERIFY: { method: Method.POST, path: () => '/verify' },
  GET_RESET: { method: Method.GET, path: () => '/reset' },
  DO_RESET: { method: Method.POST, path: () => '/reset' },
}

export const ROUTES: Routes = {
  HOME: ['/', () => dyn(HomePage)],
  SEARCH: ['/search', () => dyn(SearchPage)],
  PROFILE: ['/profile', () => dyn(ProfilePage)],
  PROFILE_BY_NAME: ['/profile/([\\w\\d\\-\\._]+)', ([name]) => dyn(ProfilePage, { name })],
  LOGIN: ['/login', () => dyn(LoginPage)],
  REGISTER: ['/register', () => dyn(RegisterPage)],
  LOGOUT: ['/logout', () => dyn(LogoutPage)],
  VERIFY: ['/verify/([\\w\\d-]+)', ([code]) => dyn(VerifyPage, { code })],
  RESTE: ['/reset/?([\\w\\d-]+)?', ([code]) => dyn(ResetPage, { code })],
  STATION_BY_ID: ['/station/(\\d+)', ([id]) => dyn(StationPage, { id })],
  NOT_FOUND: ['/not-found', () => dyn(ErrorPage)],
}

export default function App() {
  const routing: UseRoute = useRoute(ROUTES, ROUTES.HOME, ROUTES.NOT_FOUND);
  const user: UseFetch<User> = useFetch(ORIGIN, ENDPOINTS.GET_USER);
  const [station, setStation]: UseState<StationDetail> = useState(null);
  const { resolver, setRoute } = routing;
  const translation = useTranslate();
  const { setLanguage } = translation;

  useEffect(() => {
    const path = window.location.pathname;
    setRoute(path, { update: false, force: true });
    user.doFetch();
    if('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/worker.js');
    }
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
    station,
    setStation,
  }
  
  return html`
    ${dyn(global.Provider, { value: context })`
      <section class="nav-container container full-width">
        ${dyn(NavComponent)}
      </section>
      <main>
        ${dyn(resolver)}
      </main>
      <div class="player ${station != null ? 'player--active' : ''}">
        ${station != null ? html`
          <audio controls="true" autoplay="true" src="${station?.url}">
            <source src="${station?.url}" type="audio/mpeg">
            <source src="${station?.url}" type="audio/ogg">
            <source src="${station?.url}" type="audio/aac">
          </audio>
        ` : ''}
      </div>
    `}
  `;
}
