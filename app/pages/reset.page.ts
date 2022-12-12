import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import useForm, { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";
import { GlobalContext, ResetForm } from "../types.ts";

export type Props = {
  code?: string;
}

export default function ResetPage(props: Props) {
  const { routing }: GlobalContext = useContext(global);
  const { doBack } = routing;
  const request: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.GET_RESET);
  const reset: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_RESET);
  const form: UseForm<ResetForm> = useForm({ email: '', password: '' }, doRequestReset);
  const { data, handleChange, handleSubmit } = form;
  const emailRef = useInput(data.email);
  const passwordRef = useInput(data.password);

  function doRequestReset() {
    request.doFetch({ query: [data.email] });
  }

  return html`
    <reset-page class="page">
      <h1>Reset</h1>
      <a @click="${doBack}" href="/">Back</a>
      <p>Reset code: ${props.code}</p>
      <p>${reset.pending ? '' : reset.error?.message}</p>
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
        <button type="submit">Reset</button>
      </form>
    </reset-page>
  `;
}
