import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm from "../hooks/form.hook.ts";
import { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, RegisterForm } from "../types.ts";

export default function RegisterPage() {
  const { routing, user }: GlobalContext = useContext(global);
  const { setRoute } = routing;
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
        <h1>Create an account</h1>
        <p>The password needs to be at least 8 characters long and must contain uppercase letters, lowercase letters, digits and special characters.</p>
        <p>${register.pending ? '' : register.error?.message}</p>
        <form @submit="${handleSubmit}">
          <p>
            <label for="name">Name<span aria-label="required">*</span></label>
            <input
              ref="${nameRef}"
              @change="${handleChange}"
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
              autocomplete="off"
              required="true"
            >
          </p>
          <p>* required</p>
          <input type="submit" value="Sign up">
        </form>
      </section>
    </register-page>
  `;
}
