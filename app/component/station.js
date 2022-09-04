import {state} from '../main.js';
import {$lang, http} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';
import VImage from '../element/image.js';

export default {
    props: ['station'],
    components: {
        VButton,
        VIcon,
        VImage
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
            state.app.$refs.player.open = true;
        },
        openDetail(station) {
            state.app.$refs.detail.station = station;
            state.app.$refs.detail.open = true;
        }
    },
    template: `
        <div class="w-full gap-4 group flex items-center">
            <v-image
                :station="station"
                @click="() => setStation(station)"
                class="w-[54px] h-[54px] min-w-[54px] cursor-pointer"
            ></v-image>
            <div
                class="flex flex-col flex-1 min-w-0 cursor-pointer"
                @click="() => openDetail(station)"
            >
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
                        v-if="station.is_restricted"
                        class="text-white/90 items-center gap-[5px] bg-blue-600/70 rounded-[4px] text-[14px] px-[7px] hidden sm:inline-flex leading-[24px]"
                    >
                        <p class="-mt-[1px]">Restricted</p>
                    </span>
                    <span
                        v-if="station.is_broken"
                        class="text-white/90 items-center gap-[5px] bg-red-600/70 rounded-[4px] text-[14px] px-[7px] hidden sm:inline-flex leading-[24px]"
                    >
                        <p class="-mt-[1px]">Broken</p>
                    </span>
                    <span
                        v-if="station.is_no_track_info"
                        class="text-white/90 items-center gap-[5px] bg-green-600/70 rounded-[4px] text-[14px] px-[7px] hidden sm:inline-flex leading-[24px]"
                    >
                        <p class="-mt-[1px]">No track info</p>
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
