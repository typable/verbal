import { html, dyn, createContext } from './deps.ts';
import { useRoute } from "./hooks.ts";
import HomePage from './pages/home.page.ts';
import ProfilePage from './pages/profile.page.ts';
import SearchPage from './pages/search.page.ts';
import { GlobalContext } from './types.ts';

export const global = createContext({});

const ROUTES = {
  '/': () => dyn(HomePage),
  '/search': () => dyn(SearchPage),
  '/profile': () => dyn(ProfilePage),
}

export default function App() {
  const [route, setRoute, doRoute, doBack] = useRoute(ROUTES, '/');
  
  const context: GlobalContext = {
    routing: { route, setRoute, doRoute, doBack }
  }
  
  return html`
    ${dyn(global.Provider, { value: context })`
      ${dyn(route)}
    `}
  `;
}
