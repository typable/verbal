import { CONFIG, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm from "../hooks/form.hook.ts";
import { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, LoginForm, Session } from "../types.ts";

export default function LoginPage() {
  const { routing, user }: GlobalContext = useContext(global);
  const { doBack, setRoute } = routing;
  const auth: UseFetch<Session> = useFetch(CONFIG, ENDPOINTS.DO_LOGIN);
  const form: UseForm<LoginForm> = useForm({ email: '', password: '' }, doAuth);
  const { data, handleChange, handleSubmit } = form;
  const emailRef = useInput(data.email);
  const passwordRef = useInput(data.password);

  useEffect(() => {
    if (auth.value != null) {
      document.cookie = `token=${auth.value.token}; SameSite=None; Secure`;
      user.doFetch();
      setRoute('/');
    }
  }, [auth.value]);

  function doAuth() {
    auth.doFetch({ payload: data });
  }

  return html`
    <login-page>
      <h1>Login</h1>
      <a @click="${doBack}" href="/">Back</a>
      <p>${auth.pending ? '' : auth.error?.message}</p>
      <form @submit="${handleSubmit}">
        <input
          ref="${emailRef}"
          @change="${handleChange}"
          name="email"
          type="email"
          value="${data.email}"
          spellcheck="false"
          autocomplete="off"
        >
        <input
          ref="${passwordRef}"
          @change="${handleChange}"
          name="password"
          type="password"
          value="${data.password}"
          spellcheck="false"
          autocomplete="off"
        >
        <button type="submit">Log in</button>
      </form>
    </login-page>
  `;
}
