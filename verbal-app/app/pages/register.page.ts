import { ORIGIN, ENDPOINTS } from "../app.ts";
import { html, global, React } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm from "../hooks/form.hook.ts";
import { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, RegisterForm } from "../types.ts";

const { useContext, useEffect } = React;

export default function RegisterPage() {
  const { routing, user, translation }: GlobalContext = useContext(global);
  const { setRoute } = routing;
  const { translate } = translation;
  const register: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_REGISTER);
  const form: UseForm<RegisterForm> = useForm({ name: '', email: '', password: '' }, doRegister);
  const { data, handleChange, handleSubmit } = form;
  const nameRef = useInput(data.name);
  const emailRef = useInput(data.email);
  const passwordRef = useInput(data.password);

  useEffect(() => {
    if (user.value != null) {
      setRoute('/');
    }
  }, [user.value]);

  function doRegister() {
    register.doFetch({ payload: data });
  }

  return html`
    <register-page class="page">
      <section class="container slim-width">
        <form on:submit=${handleSubmit} class="${register.pending ? 'form--pending' : ''}">
          ${!register.pending && register.error ? html`
            <p class="message">
              <i class="ti ti-exclamation-circle"></i>
              ${translate('form.register.' + register.error?.message)}
            </p>
          ` : ''}
          ${!register.pending && register.ok ? html`
            <p class="message">
              <i class="ti ti-circle-check"></i>
              ${translate('form.register.success')}
            </p>
          ` : ''}
          <h1 class="title">Create an account</h1>
          <p class="description">The password needs to be at least 8 characters long and must contain uppercase letters, lowercase letters, digits and special characters.</p>
          <div class="controls">
            <div class="form-spinner">
              <i class="ti ti-loader"></i>
            </div>
            <p>
              <label for="name">Name<span aria-label="required">*</span></label>
              <input
                ref="${nameRef}"
                on:change=${handleChange}
                id="name"
                name="name"
                type="text"
                value="${data.name}"
                spellcheck="false"
                autocomplete="off"
                required="true"
              >
            </p>
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
                autocomplete="off"
                required="true"
              >
            </p>
            <p>* required</p>
            <input type="submit" value="Sign up">
          </div>
        </form>
      </section>
    </register-page>
  `;
}
