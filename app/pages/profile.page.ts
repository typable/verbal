import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch, { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext, User } from "../types.ts";

export type Props = {
  name?: string;
}

export default function ProfilePage(props: Props) {
  const { routing, user }: GlobalContext = useContext(global);
  const { doRoute, setRoute } = routing;
  const profile: UseFetch<User> = useFetch(ORIGIN, ENDPOINTS.GET_USER_BY_NAME);

  useEffect(() => {
    if (props.name) {
      profile.doFetch({ query: [props.name] });
    }
  }, [props.name]);

  useEffect(() => {
    if (props.name == null) {
      if (!user.pending && user.value == null) {
        setRoute('/login', true);
      }
    }
  }, [props.name, user.pending, user.value]);
  
  return html`
    <profile-page class="page">
      <section class="container full-width">
        <h1>Profile</h1>
        ${props.name == null ? html`
          ${user.pending ? '' : user.value != null ? html`
            <div>
              <p>Name: ${user.value?.name ?? 'None'}</p>
              <p>Email: ${user.value?.email}</p>
              <p>Language: ${user.value?.language ?? 'None'}</p>
              <p><a @click="${doRoute}" href="/reset">Update password</a></p>
              <p><a @click="${doRoute}" href="/logout">Log out</a></p>
            </div>
          ` : ''}
        ` : html`
          <div>
            ${!profile.pending && profile.error ? html`
              <p>${profile.error.message}</p>
            ` : ''}
            ${profile.pending ? '' : profile.value != null ? html`
              <div>
                <p>Name: ${profile.value?.name ?? 'None'}</p>
                <p>Email: ${profile.value?.email}</p>
                <p>Language: ${profile.value?.language ?? 'None'}</p>
              </div>
            ` : ''}
          </div>
        `}
      </section>
    </profile-page>
  `;
}
