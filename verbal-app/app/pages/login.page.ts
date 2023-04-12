import { ORIGIN, ENDPOINTS } from "../app.ts";
import { html, global, React } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm from "../hooks/form.hook.ts";
import { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, LoginForm } from "../types.ts";

const { useContext, useEffect } = React;

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
        <form on:submit=${handleSubmit} class="${auth.pending ? 'form--pending' : ''}">
          ${!auth.pending && auth.error ? html`
            <p class="message">
              <i class="ti ti-exclamation-circle"></i>
              ${translate('form.login.' + auth.error?.message)}
            </p>
          ` : ''}
          <h1 class="title">Log in</h1>
          <div class="controls">
            <div class="form-spinner">
              <i class="ti ti-loader"></i>
            </div>
            <p>
              <label for="email">Email address<span aria-label="required">*</span></label>
              <input
                ref="${emailRef}"
                on:change=${handleChange}
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
                on:change=${handleChange}
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
          </div>
          <p>Forgot your password? <a on:click=${doRoute} href="/reset">Reset password</a></p>
          <p>Don't have an account? <a on:click=${doRoute} href="/register">Create an account</a></p>
        </form>
      </section>
    </login-page>
  `;
}
