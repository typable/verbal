import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm from "../hooks/form.hook.ts";
import { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, LoginForm } from "../types.ts";

export default function LoginPage() {
  const { routing, user }: GlobalContext = useContext(global);
  const { doRoute, setRoute } = routing;
  const auth: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_LOGIN);
  const form: UseForm<LoginForm> = useForm({ email: '', password: '' }, doAuth);
  const { data, handleChange, handleSubmit } = form;
  const emailRef = useInput(data.email);
  const passwordRef = useInput(data.password);

  useEffect(() => {
    if (user.value != null) {
      setRoute('/');
    }
  }, [user.value]);

  useEffect(() => {
    if (!auth.pending && auth.ok) {
      user.doFetch();
      setRoute('/');
    }
  }, [auth.pending]);

  function doAuth() {
    auth.doFetch({ payload: data });
  }

  return html`
    <login-page class="page">
      <section class="container slim-width">
        <h1>Login</h1>
        <p>${auth.pending ? '' : auth.error?.message}</p>
        <form @submit="${handleSubmit}">
          <input
            ref="${emailRef}"
            @change="${handleChange}"
            name="email"
            type="email"
            value="${data.email}"
            spellcheck="false"
            required="true"
          >
          <input
            ref="${passwordRef}"
            @change="${handleChange}"
            name="password"
            type="password"
            value="${data.password}"
            spellcheck="false"
            required="true"
          >
          <button type="submit">Log in</button>
          <p>Forgot your password? <a @click="${doRoute}" href="/reset">Reset password</a></p>
          <p>Don't have an account? <a @click="${doRoute}" href="/register">Create an account</a></p>
        </form>
      </section>
    </login-page>
  `;
}
