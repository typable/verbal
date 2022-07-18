import {$lang, http} from '../utils.js';
import VIcon from '../element/icon.js';
import VTab from '../component/tab.js';
import VStation from '../component/station.js';

export default {
    props: ['state'],
    data() {
        return {
            query: {
                name: '',
                page: 0
            },
            results: [],
            loading: false,
            more: true
        };
    },
    components: {
        VIcon,
        VTab,
        VStation
    },
    methods: {
        $lang,
        async doSearch() {
            this.results = [];
            this.loading = true;
            this.more = true;
            this.query.page = 0;
            const result = await http`get::/api/search`(this.query);
            this.loading = false;
            this.results = result;
        },
        async doSearchMore() {
            if(this.loading) return;
            if(!this.more) return;
            this.query.page++;
            this.loading = true;
            const result = await http`get::/api/search`(this.query);
            this.loading = false;
            if(result.length == 0) {
                this.more = false;
            }
            this.results.push(...result);
        }
    },
    mounted() {
        this.doSearch();
    },
    template: `
        <v-tab id="search" :tab="state.tab" @show="doSearch">
            <input
                v-model="query.name"
                @keyup.enter="doSearch"
                type="text"
                :placeholder="$lang('search.input.placeholder')"
                class="w-full h-[56px] px-5 text-lg rounded-lg bg-zinc-900 text-white font-medium placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none"
                spellcheck="false"
                autocomplete="off"
            >
            <ul class="flex flex-col">
                <li
                    :key="station.id"
                    v-for="station in results"
                    class="border-t sm:border-t-2 first:border-none border-zinc-900 py-5 first:pt-0"
                >
                    <v-station :station="station"></v-station>
                </li>
            </ul>
            <div
                v-show="loading"
                class="w-[60px] h-[60px] select-none pointer-events-none mx-auto"
            >
                <v-icon
                    id="loader"
                    class="bg-gray-400 animate-spin"
                    style="animation-duration: 2s;"
                    size="80%"
                ></v-icon>
            </div>
            <div
                v-if="!more && results.length > 0"
                class="text-zinc-400 text-md mx-auto pb-6"
            >
                {{$lang('search.list.end')}}
            </div>
            <div
                v-if="results.length == 0"
                class="text-zinc-400 text-md mx-auto pb-6"
            >
                {{$lang('search.list.empty')}}
            </div>
        </v-tab>
    `
}
