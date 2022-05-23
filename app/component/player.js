import {state} from '../main.js';
import {http, $lang} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';

export default {
    props: ['station'],
    data() {
        return {
            playing: false,
            loading: false,
            title: '- No song title available -',
            locale: 'en'
        };
    },
    components: {
        VButton,
        VIcon
    },
    methods: {
        $lang,
        async setLike(is_favorite) {
            try {
                await http`${is_favorite ? 'post' : 'delete'}::/api/like`(this.station.uuid);
                this.station.is_favorite = is_favorite;
                state.app.$refs.favorites.doFetch();
            }
            catch(error) {
                console.log(error);
            }
        },
    },
    template: `
        <div class="sticky top-[98px] z-30">
            <div
                v-if="station"
                class="flex flex-col bg-black pb-6"
            >
                <audio controls autoplay :src="station.stream_url" class="select-none pointer-events-none w-0 h-0 opacity-0"></audio>
                <div class="p-5 bg-zinc-800 rounded-xl flex gap-5 items-center relative overflow-hidden shadow-2xl z-30">
                    <img
                        v-if="station.favicon"
                        :src="station.favicon"
                        :alt="station.name"
                        :class="{ 'animate-pulse': playing }"
                        class="w-full h-full object-cover absolute top-0 left-0 right-0 bottom-0 blur-2xl opacity-30 z-0 pointer-events-none select-none"
                    >
                    <div class="w-[64px] h-[64px] min-w-[64px] bg-zinc-900 rounded-lg overflow-hidden z-10">
                        <img
                            v-if="station.favicon"
                            :src="station.favicon"
                            :alt="station.name"
                            class="w-full h-full object-contain select-none"
                        >
                        <v-icon
                            v-else
                            id="access-point"
                            size="65%"
                            class="bg-gray-400"
                        ></v-icon>
                    </div>
                    <div
                        class="flex flex-col flex-1 z-10 min-w-0 cursor-pointer"
                    >
                        <p class="text-xl font-semibold text-white pb-1 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none">
                            {{station.name}}
                        </p>
                        <p class="text-md text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none">
                            {{title ?? $lang('player.loading')}}
                        </p>
                    </div>
                    <div class="inline-flex gap-4 z-10 pr-2">
                        <v-button
                            :icon="[ station.is_favorite ? 'heart-solid' : 'heart' ]"
                            :title="$lang('global.favorites')"
                            :active="station.is_favorite"
                            class="bg-zinc-900 hover:bg-white focus:ring-[6px] ring-white/10"
                            @click="setLike(!station.is_favorite)"
                        ></v-button>
                        <v-button
                            :icon="[ loading ? 'rotate-clockwise' : (playing ? 'player-pause' : 'player-play') ]"
                            :title="[ playing ? $lang('global.pause') : $lang('global.play') ]"
                            :animation="[ loading ? 'animate-spin' : '' ]"
                            class="bg-zinc-900 hover:bg-white focus:ring-[6px] ring-white/10"
                            @click="setPlaying(!playing)"
                        ></v-button>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-b from-black h-2 sm:h-4"></div>
        </div>
    `
}
