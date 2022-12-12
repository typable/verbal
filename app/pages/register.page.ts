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
  const form: UseForm<RegisterForm> = useForm({ email: '', password: '' }, doRegister);
  const { data, handleChange, handleSubmit } = form;
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
      <h1>Register</h1>
      <p>${register.pending ? '' : register.error?.message}</p>
      <form @submit="${handleSubmit}">
        <input
          ref="${emailRef}"
          @change="${handleChange}"
          name="email"
          type="email"
          value="${data.email}"
          spellcheck="false"
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
        <button type="submit">Create an account</button>
      </form>
    </register-page>
  `;
}
