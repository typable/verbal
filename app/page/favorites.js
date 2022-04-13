import {$lang, http} from '../utils.js';
import VIcon from '../element/icon.js';
import VPlayer from '../component/player.js';
import VTab from '../component/tab.js';
import VStation from '../component/station.js';

export default {
    props: ['state'],
    data() {
        return {
            results: [],
            loading: false
        };
    },
    components: {
        VIcon,
        VTab,
        VPlayer,
        VStation
    },
    methods: {
        $lang,
        async doFetch() {
            this.results = [];
            this.loading = true;
            const result = await http`get::/api/like`();
            this.loading = false;
            this.results = result;
        }
    },
    mounted() {
        this.doFetch();
    },
    template: `
        <v-tab id="favorites" :tab="state.tab">
            <v-player :station="state.station"></v-player>
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
        </v-tab>
    `
}
