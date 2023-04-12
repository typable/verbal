import { ROUTES } from "../app.ts";
import { html, global, React } from "../deps.ts";
import { GlobalContext } from "../types.ts";

const { useContext } = React;

export default function NavComponent() {
  const { routing, user, translation }: GlobalContext = useContext(global);
  const { path, setRoute, isActive } = routing;
  const { translate } = translation;
  
  return html`
    <nav-component>
      <ul class="menu-list">
        <li
          on:click=${() => setRoute('/')}
          class="menu ${isActive(path, ROUTES.HOME) ? 'menu--active' : ''}"
        >
          <i class="ti ti-home"></i>
          <p>${translate('nav.menu.home')}</p>
        </li>
        <li
          on:click=${() => setRoute('/search')}
          class="menu ${isActive(path, ROUTES.SEARCH) ? 'menu--active' : ''}"
        >
          <i class="ti ti-search"></i>
          <p>${translate('nav.menu.search')}</p>
        </li>
      </ul>
      ${user.pending ? '' : user.value == null ? html`
        <ul class="account-list">
          <li
            on:click=${() => setRoute('/register')}
            class="account ${isActive(path, ROUTES.REGISTER) ? 'account--active' : ''}"
          >
            <p>${translate('nav.account.register')}</p>
          </li>
          <li
            on:click=${() => setRoute('/login')}
            class="account ${isActive(path, ROUTES.LOGIN) ? 'account--active' : ''}"
          >
            <p>${translate('nav.account.login')}</p>
          </li>
        </ul>
      ` : html`
        <ul class="account-list">
          <li
            on:click=${() => setRoute('/profile')}
            class="account ${isActive(path, ROUTES.PROFILE) ? 'account--active' : ''}"
          >
            <i class="ti ti-user"></i>
            <p>${user.value?.name ?? user.value?.email}</p>
          </li>
        </ul>
      `}
      </div>
    </nav-component>
  `;
}
