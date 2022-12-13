import { global, ROUTES } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function NavComponent() {
  const { routing, user, translation }: GlobalContext = useContext(global);
  const { current, setRoute, isActive } = routing;
  const { translate } = translation;
  
  return html`
    <nav-component>
      <ul class="menu-list">
        <li
          @click="${() => setRoute('/')}"
          class="menu ${isActive(current, ROUTES.HOME) ? 'menu--active' : ''}"
        >
          <i class="ti ti-home"></i>
          <p>${translate('nav.menu.home')}</p>
        </li>
        <li
          @click="${() => setRoute('/search')}"
          class="menu ${isActive(current, ROUTES.SEARCH) ? 'menu--active' : ''}"
        >
          <i class="ti ti-search"></i>
          <p>${translate('nav.menu.search')}</p>
        </li>
      </ul>
      ${user.pending ? '' : user.value == null ? html`
        <ul class="account-list">
          <li
            @click="${() => setRoute('/register')}"
            class="account ${isActive(current, ROUTES.REGISTER) ? 'account--active' : ''}"
          >
            <p>${translate('nav.account.register')}</p>
          </li>
          <li
            @click="${() => setRoute('/login')}"
            class="account ${isActive(current, ROUTES.LOGIN) ? 'account--active' : ''}"
          >
            <p>${translate('nav.account.login')}</p>
          </li>
        </ul>
      ` : html`
        <ul class="account-list">
          <li
            @click="${() => setRoute('/profile')}"
            class="account ${isActive(current, ROUTES.PROFILE) ? 'account--active' : ''}"
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
