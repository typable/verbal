import {$lang} from '../utils.js';
import VIcon from '../element/icon.js';
import VPlayer from '../component/player.js';
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
            more: false
        };
    },
    components: {
        VIcon,
        VTab,
        VPlayer,
        VStation
    },
    methods: {
        $lang
    },
    template: `
        <v-tab id="search" :tab="state.tab">
            <v-player :station="state.station"></v-player>
            <input
                v-model="query.name"
                @keyup.enter="doSearch"
                type="text"
                :placeholder="$lang('search.input.placeholder')"
                class="w-full h-[56px] px-5 text-lg rounded-lg bg-zinc-900 text-white font-medium placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none"
            >
            <ul class="flex flex-col">
                <li
                    :key="station.id"
                    v-for="station in results"
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
                {{$('search.list.end')}}
            </div>
        </v-tab>
    `
}
