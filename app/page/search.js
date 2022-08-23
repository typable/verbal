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
                country: '',
                language: '',
                page: 0
            },
            results: [],
            loading: false,
            searching: false,
            more: true,
            countries: [],
            languages: [],
            recommended: [],
            popular: [
                45761,
                44366,
                37156,
                33977,
                56254,
                30615
            ]
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
            this.searching = true;
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
        },
        async loadRecommended() {
            for(const id of this.popular) {
                this.recommended.push(await http`get::/api/station`({ id }));
            }
        },
        async loadFilters() {
            const countries = await http`get::/api/countries`();
            for(const {country} of countries) {
                this.countries.push(country);
            }
            const languages = await http`get::/api/languages`();
            for(const {language} of languages) {
                this.languages.push(language.toUpperCase());
            }
        },
        reset() {
            this.query = {
                name : '',
                page: 0
            };
            this.searching = false;
            this.results = [];
            this.loadRecommended();
        }
    },
    mounted() {
        this.loadRecommended();
        this.loadFilters();
    },
    template: `
        <v-tab id="search" :tab="state.tab">
            <div class="flex flex-wrap rounded-md overflow-hidden bg-zinc-900">
                <div class="relative before:absolute before:w-full before:bottom-0 before:border-b md:before:border-none before:border-zinc-800 flex-1">
                    <input
                        v-model="query.name"
                        @change="doSearch"
                        type="text"
                        :placeholder="$lang('search.input.placeholder')"
                        class="w-full h-[56px] px-5 text-lg bg-zinc-900 text-white font-medium placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none"
                        spellcheck="false"
                        autocomplete="off"
                    >
                </div>
                <div class="flex w-full md:w-[300px]">
                    <div class="flex relative before:absolute before:h-[36px] before:top-[10px] before:border-l-none md:before:border-l before:border-zinc-800 w-6/12">
                        <v-icon
                            id="map-pin"
                            size="20px"
                            class="text-gray-400 select-none pointer-events-none before:left-[24px] min-w-[0px]"
                        >
                        </v-icon>
                        <select
                            v-model="query.country"
                            @change="doSearch"
                            class="w-full h-[56px] px-5 pl-11 text-lg bg-zinc-900 text-white font-medium placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none cursor-pointer appearance-none"
                        >
                            <option value="" selected>All</option>
                            <option v-for="country in countries" :value="country">{{country}}</option>
                        </select>
                    </div>
                    <div class="flex relative before:absolute before:h-[36px] before:top-[10px] before:border-l before:border-zinc-800 w-6/12">
                        <v-icon
                            id="world"
                            size="20px"
                            class="text-gray-400 select-none pointer-events-none before:left-[24px] min-w-[0px]"
                        >
                        </v-icon>
                        <select
                            v-model="query.language"
                            @change="doSearch"
                            class="w-full h-[56px] px-5 pl-11 text-lg bg-zinc-900 text-white font-medium placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none cursor-pointer appearance-none"
                        >
                            <option value="">All</option>
                            <option v-for="language in languages" :value="language">{{language}}</option>
                        </select>
                    </div>
                </div>
            </div>
            <ul v-if="searching" class="flex flex-col">
                <li
                    :key="station.id"
                    v-for="station in results"
                    class="border-t sm:border-t-2 first:border-none border-zinc-900 py-5 first:pt-0"
                >
                    <v-station :station="station"></v-station>
                </li>
            </ul>
            <div v-else>
                <h3 class="text-white text-[24px] font-bold pb-8 pt-4 sm:pt-0">{{$lang('search.recommended')}}</h3>
                <ul class="flex flex-col">
                    <li
                        :key="station.id"
                        v-for="station in recommended"
                        class="border-t sm:border-t-2 first:border-none border-zinc-900 py-4 first:pt-0"
                    >
                        <v-station :station="station"></v-station>
                    </li>
                </ul>
            </div>
            <div
                v-show="loading"
                class="w-[60px] h-[60px] select-none pointer-events-none mx-auto"
            >
                <v-icon
                    id="loader"
                    class="text-gray-400 animate-spin"
                    style="animation-duration: 2s;"
                    size="44px"
                ></v-icon>
            </div>
            <div
                v-if="searching && !more && results.length > 0"
                class="text-zinc-400 text-md mx-auto pb-6"
            >
                {{$lang('search.list.end')}}
            </div>
            <div
                v-if="searching && !loading && results.length == 0"
                class="text-zinc-400 text-md mx-auto pb-6"
            >
                {{$lang('search.list.empty')}}
            </div>
        </v-tab>
    `
}
