import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm from "../hooks/form.hook.ts";
import { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, LoginForm } from "../types.ts";

export default function LoginPage() {
  const { routing, user, translation }: GlobalContext = useContext(global);
  const { doRoute, setRoute } = routing;
  const { translate } = translation;
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
        <form @submit="${handleSubmit}">
          ${!auth.pending && auth.error ? html`
            <p class="message">${translate('form.' + auth.error?.message)}</p>
          ` : ''}
          <h1 class="title">Log in</h1>
          <p>
            <label for="email">Email address<span aria-label="required">*</span></label>
            <input
              ref="${emailRef}"
              @change="${handleChange}"
              id="email"
              name="email"
              type="email"
              value="${data.email}"
              spellcheck="false"
              required="true"
            >
          </p>
          <p>
            <label for="password">Password<span aria-label="required">*</span></label>
            <input
              ref="${passwordRef}"
              @change="${handleChange}"
              id="password"
              name="password"
              type="password"
              value="${data.password}"
              spellcheck="false"
              required="true"
            >
          </p>
          <p>* required</p>
          <input type="submit" value="Log in">
          <p>Forgot your password? <a @click="${doRoute}" href="/reset">Reset password</a></p>
          <p>Don't have an account? <a @click="${doRoute}" href="/register">Create an account</a></p>
        </form>
      </section>
    </login-page>
  `;
}
