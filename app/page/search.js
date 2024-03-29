import {$lang, http} from '../utils.js';
import VIcon from '../element/icon.js';
import VTab from '../component/tab.js';
import VStation from '../component/station.js';
import VCarousel from '../component/carousel.js';

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
            playtime: null,
            latest: null,
            favorites: null
        };
    },
    components: {
        VIcon,
        VTab,
        VStation,
        VCarousel
    },
    methods: {
        $lang,
        async doSearch() {
            this.results = [];
            if(this.isQueryEmpty()) {
                this.reset();
                return;
            }
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
        async loadCategories() {
            this.playtime = await http`get::/api/category/playtime`();
            this.latest = await http`get::/api/category/latest`();
            let favorites = await http`get::/api/favorite`();
            favorites = favorites.sort(() => Math.random() - 0.5);
            favorites.length = 10;
            this.favorites = favorites;
        },
        async loadFilters() {
            this.countries = await http`get::/api/countries`();
            const languages = await http`get::/api/languages`();
            this.languages = languages.map(language => language.toUpperCase());
        },
        isQueryEmpty() {
            return this.query.name === '' && this.query.country === '' && this.query.language === '';
        },
        reset() {
            this.query = {
                name : '',
                country: '',
                language: '',
                page: 0
            };
            this.searching = false;
            this.results = [];
            this.loadCategories();
        }
    },
    mounted() {
        this.loadCategories();
        this.loadFilters();
    },
    template: `
        <v-tab id="search" :tab="state.tab">
            <div class="flex flex-col flex-1 gap-4 md:gap-14 pb-8 sm:pb-[100px] pt-2">
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
                                <option value="">{{$lang('search.input.all')}}</option>
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
                                <option value="">{{$lang('search.input.all')}}</option>
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
                <div v-else class="flex flex-col gap-3 md:gap-10">
                    <v-carousel v-if="state.authenticated" :title="$lang('search.latest')" :items="latest"></v-carousel>
                    <v-carousel v-if="state.authenticated" :title="$lang('search.playtime')" :items="playtime"></v-carousel>
                    <v-carousel v-if="state.authenticated" :title="$lang('search.favorites')" :items="favorites"></v-carousel>
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
            </div>
        </v-tab>
    `
}
