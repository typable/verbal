import {state} from '../main.js';
import {$lang, http} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';

export default {
    props: ['station'],
    components: {
        VButton,
        VIcon
    },
    methods: {
        $lang,
        async setLike(is_favorite) {
            try {
                await http`${is_favorite ? 'post' : 'delete'}::/api/favorite`(this.station.id);
                this.station.is_favorite = is_favorite;
                state.app.$refs.favorites.doFetch();
            }
            catch(error) {
                console.log(error);
            }
        },
        setStation(station) {
            state.station = station;
        }
    },
    template: `
        <div class="w-full gap-4 group flex items-center">
            <div
                class="w-[54px] h-[54px] min-w-[54px] bg-zinc-900 rounded-md overflow-hidden cursor-pointer"
                @click="() => setStation(station)"
            >
                <img
                    v-if="station.icon"
                    :alt="station.name"
                    :src="station.icon"
                    @error="() => station.icon = null"
                    class="w-full h-full object-contain"
                >
                <v-icon
                    v-else
                    id="access-point"
                    size="32px"
                    class="text-gray-400"
                ></v-icon>
            </div>
            <div class="flex flex-col flex-1 min-w-0 cursor-pointer">
                <p
                    :title="station.name"
                    class="text-lg font-medium text-gray-100 pb-0 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                    {{station.name}}
                </p>
                <span class="text-md text-gray-400 overflow-hidden flex gap-2 sm:gap-3">
                    <span
                        v-if="station.country" 
                        class="text-gray-400 inline-flex items-center gap-[5px]"
                        :title="$lang('global.country')"
                    >
                        <v-icon
                            id="map-pin"
                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                            size="100%"
                        ></v-icon>
                        <p>{{station.state ? station.state + ', ' : ''}}{{station.country}}</p>
                    </span>
                    <span
                        v-if="station.votes"
                        class="text-gray-400 inline-flex items-center gap-[5px]"
                        :title="$lang('global.votes')"
                    >
                        <v-icon
                            id="thumb-up"
                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                            size="100%"
                        ></v-icon>
                        <p>{{station.votes}}</p>
                    </span>
                    <span
                        v-if="station.click_trend"
                        class="text-gray-400 hidden sm:inline-flex items-center gap-[5px]"
                        :title="$lang('global.trend')"
                    >
                        <v-icon
                            :id="[ station.click_trend >= 0 ? 'arrow-up-right' : 'arrow-down-right' ]"
                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                        ></v-icon>
                        <p>{{Math.abs(station.click_trend) ?? 'None'}}</p>
                    </span>
                </span>
            </div>
            <div class="inline-flex gap-3 sm:gap-4">
                <v-button
                    :icon="[ station.is_favorite ? 'bookmark-off' : 'bookmark' ]"
                    :title="[ $lang(station.is_favorite ? 'global.unlike' : 'global.like') ]"
                    :active="station.is_favorite"
                    @click="() => setLike(!station.is_favorite)"
                    class="bg-zinc-900 hover:bg-white"
                ></v-button>
            </div>
        </div>
    `
}
