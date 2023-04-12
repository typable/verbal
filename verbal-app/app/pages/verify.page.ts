import { ORIGIN, ENDPOINTS } from "../app.ts";
import { html, global, React } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext } from "../types.ts";

const { useContext, useEffect } = React;

export type Props = {
  code: string;
}

export default function VerifyPage(props: Props) {
  const { routing }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  const verify: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_VERIFY);

  useEffect(() => {
    verify.doFetch({ payload: { code: props.code } });
  }, [props.code]);

  return html`
    <verify-page class="page">
      <section class="container slim-width">
        <h1>Verify</h1>
        <p>${verify.pending ? '' : verify.error?.message}</p>
        ${verify.pending ? '' : verify.ok ? html`
          <div>
            <p>Your account has been verified.</p>
            <a on:click=${doRoute} href="/login">Log in now</a>
          </div>
        ` : ''}
      </section>
    </verify-page>
  `;
}
