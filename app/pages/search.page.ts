import { CONFIG, ENDPOINTS, global } from "../app.ts";
import { html, useContext } from "../deps.ts";
import useFetch, { UseFetch } from "../hooks/fetch.hook.ts";
import { GlobalContext, SearchQuery, Station } from "../types.ts";
import useForm, { UseForm } from "../hooks/form.hook.ts";
import useInput from "../hooks/input.hook.ts";

export default function SearchPage() {
  const { routing }: GlobalContext = useContext(global);
  const { doRoute } = routing;
  const search: UseFetch<Station[]> = useFetch(CONFIG, ENDPOINTS.GET_SEARCH);
  const form: UseForm<SearchQuery> = useForm({ name: '' }, doSearch, () => search.setValue(null));
  const { data, isModified, handleChange, handleSubmit, doReset } = form;
  const nameRef = useInput(data.name);

  function doSearch() {
    if (isModified || search.value == null) {
      search.doFetch({ payload: data });
    }
  }

  return html`
    <search-page class="page">
      <h1>Search</h1>
      <form @submit="${handleSubmit}">
        <input
          ref="${nameRef}"
          @change="${handleChange}"
          name="name"
          type="text"
          value="${data.name}"
          spellcheck="false"
          autocomplete="off"
        >
        <button type="submit">Search</button>
        <button type="button" @click="${() => doReset()}">Reset</button>
      </form>
      <ul>
        ${search.pending ? 'Loading...' : search.value?.map((station) => html`
          <li>
            <p>${station.name}</p>
            <a @click="${doRoute}" href="/station/${station.id}">View</a>
          </li>
        `)}
      </ul>
    </search-page>
  `;
}
