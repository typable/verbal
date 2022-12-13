import { ORIGIN, ENDPOINTS, global } from "../app.ts";
import { html, useContext, useEffect } from "../deps.ts";
import useFetch from "../hooks/fetch.hook.ts";
import { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext } from "../types.ts";

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
      <h1>Verify</h1>
      <p>${verify.pending ? '' : verify.error?.message}</p>
      ${verify.pending ? '' : verify.ok ? html`
        <div>
          <p>Your account has been verified.</p>
          <a @click="${doRoute}" href="/login">Log in now</a>
        </div>
      ` : ''}
    </verify-page>
  `;
}
