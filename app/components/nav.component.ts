import { global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import { GlobalContext } from "../types.ts";

export default function NavComponent() {
  const { routing, user, translation }: GlobalContext = useContext(global);
  const { setRoute } = routing;
  const { translate } = translation;
  
  return html`
    <nav-component>
      <ul class="menu-list">
        <li @click="${() => setRoute('/')}" class="menu">
          <i class="ti ti-home"></i>
          <p>${translate('nav.menu.home')}</p>
        </li>
        <li @click="${() => setRoute('/search')}" class="menu">
          <i class="ti ti-search"></i>
          <p>${translate('nav.menu.search')}</p>
        </li>
      </ul>
      ${user.pending ? '' : user.value == null ? html`
        <div @click="${() => setRoute('/login')}" class="account">
          <p>${translate('nav.account.login')}</p>
        </div>
      ` : html`
        <div @click="${() => setRoute('/profile')}" class="account">
          <i class="ti ti-user"></i>
          <p>${user.value?.email}</p>
        </div>
      `}
      </div>
    </nav-component>
  `;
}
