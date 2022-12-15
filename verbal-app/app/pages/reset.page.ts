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
  const { translation }: GlobalContext = useContext(global);
  const { translate } = translation;
  const request: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.GET_RESET);
  const reset: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_RESET);
  const form: UseForm<ResetForm> = useForm({ password: '', confirmPassword: '' }, doReset);
  const { data, handleChange, handleSubmit } = form;
  const passwordRef = useInput(data.password);
  const confirmPasswordRef = useInput(data.confirmPassword);

  function doReset() {
    const payload: ResetForm = { code: props.code, ...data };
    request.doFetch({ payload });
  }

  return html`
    <reset-page class="page">
      <section class="container slim-width">
        <form @submit="${handleSubmit}">
          ${!reset.pending && reset.error ? html`
            <p class="message">${translate('form.' + reset.error?.message)}</p>
          ` : ''}
          <h1 class="title">Reset password</h1>
          <p class="description">The password needs to be at least 8 characters long and must contain uppercase letters, lowercase letters, digits and special characters.</p>
          <p>
            <label for="password">Password<span aria-label="required">*</span></label>
            <input
              ref="${passwordRef}"
              @change="${handleChange}"
              id="password"
              name="password"
              type="password"
              value="${data.password}"
              minlength="8"
              maxlength="100"
              spellcheck="false"
              autocomplete="off"
              required="true"
            >
          </p>
          <p>
            <label for="confirmPassword">Confirm password<span aria-label="required">*</span></label>
            <input
              ref="${confirmPasswordRef}"
              @change="${handleChange}"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value="${data.confirmPassword}"
              minlength="8"
              maxlength="100"
              spellcheck="false"
              autocomplete="off"
              required="true"
            >
          </p>
          <p>* required</p>
          <input type="submit" value="Update password">
        </form>
      </section>
    </reset-page>
  `;
}
