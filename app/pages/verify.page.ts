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
  const { doBack } = routing;
  const verify: UseFetch<void> = useFetch(ORIGIN, ENDPOINTS.DO_VERIFY);

  useEffect(() => {
    verify.doFetch({ payload: { code: props.code } });
  }, [props.code]);

  useEffect(() => {
    console.log(verify.value);
  }, [verify.value]);

  return html`
    <verify-page class="page">
      <h1>Verify</h1>
      <a @click="${doBack}" href="/">Back</a>
      <p>${verify.pending ? '' : verify.error?.message}</p>
      <p>Verification code: ${props.code}</p>
    </verify-page>
  `;
}
