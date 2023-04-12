import { ENDPOINTS, ORIGIN } from "../app.ts";
import { html, global, React } from "../deps.ts";
import useFetch, { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext } from "../types.ts";

const { useContext, useEffect } = React;

export default function LogoutPage() {
  const { routing, user }: GlobalContext = useContext(global);
  const { doRoute, setRoute } = routing;
  const logout: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_LOGOUT);

  useEffect(() => {
    if (!user.pending) {
      if (user.value != null) {
        logout.doFetch();
      }
      else if (user.value == null && logout.ok == null) {
        setRoute('/login', { update: false });
      }
    }
  }, [user.pending]);

  useEffect(() => {
    if (logout.ok) {
      user.doFetch();
    }
  }, [logout.pending]);
  
  return html`
    <logout-page class="page">
      <section class="container slim-width">
        <h1>Log out</h1>
        <p>${logout.pending ? '' : logout.ok ? 'You\'ve been logged out.' : logout.error?.message}</p>
        <p><a on:click=${doRoute} href="/">Back to home</a></p>
      </section>
    </logout-page>
  `;
}
