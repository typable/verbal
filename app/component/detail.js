import {state} from '../main.js';
import {http, $lang, $route, duration} from '../utils.js';
import VButton from '../element/button.js';
import VTab from '../component/tab.js';
import VIcon from '../element/icon.js';
import VImage from '../element/image.js';
import VPlayButton from '../element/play-button.js';
import VStation from '../component/station.js';

export default {
    data() {
        return {
            station: null,
            group: null,
            open: true,
            state
        };
    },
    components: {
        VTab,
        VButton,
        VIcon,
        VImage,
        VStation,
        VPlayButton
    },
    methods: {
        $lang,
        $route,
        duration,
        async show(station) {
            this.station = await http`get::/api/station/${station.id}`();
            if(this.station === null) {
                $route('@not-found', { update: false });
                return;
            }
            this.group = null;
            if(this.station.group_id) {
                this.group = await http`get::/api/group/${this.station.group_id}`();
            }
            this.open = true;
        },
        async setLike(is_favorite) {
            try {
                await http`${is_favorite ? 'post' : 'delete'}::/api/favorite`(this.station.id);
                this.station.is_favorite = is_favorite;
                this.station.likes += is_favorite ? 1 : -1;
                state.app.$refs.favorites.doFetch();
            }
            catch(error) {
                console.log(error);
            }
        },
        gradient(color) {
            return `linear-gradient(to bottom, ${color ?? 'transparent'}, transparent)`;
        },
        hasGroup() {
            if(this.group === null) {
                return false;
            }
            return this.group.stations.filter((station) => this.station.id !== station.id).length > 0;
        },
        getDescription() {
            return this.station.description ?? this.group?.group.description;
        },
        share() {
            if('share' in navigator) {
                navigator.share({
                    url: window.location.href,
                    title: this.station.name
                });
            }
        }
    },
    mounted() {
        const path = window.location.pathname;
        const match = /^\/station\/(\d+)$/.exec(path);
        if(match) {
            const id = match[1];
            this.show({ id });
        }
    },
    template: `
        <v-tab id="detail" :tab="state.tab">
            <div class="z-40">
                <div
                    ref="modal"
                    class="w-full mx-auto flex flex-col bg-black fixed left-[100vw] top-0 h-[100vh] overflow-y-auto pb-12 sm:pb-[100px] transition-detail"
                    :class="{ 'detail-active': open }"
                >
                    <div class="w-full flex flex-col px-4 sm:px-10 max-w-[1200px] mx-auto">
                        <div
                            class="w-full absolute top-0 left-0 h-[40vh] z-[-1]"
                            :style="{'background': gradient(station?.color)}"
                        >
                        </div>
                        <div class="w-full h-[98px] py-6 flex gap-4 justify-between">
                            <v-button
                                icon="chevron-left"
                                @click="$route('/')"
                            ></v-button>
                            <v-button
                                icon="share"
                                @click="share()"
                            ></v-button>
                        </div>
                        <div class="flex flex-col gap-5 md:mt-8">
                            <v-image
                                v-if="station"
                                :station="station"
                                class="w-[96px] h-[96px] min-w-[96px]"
                            ></v-image>
                            <div
                                v-if="station"
                                class="flex flex-col flex-1 min-w-0"
                            >
                                <p
                                    :title="station.name"
                                    class="text-[24px] md:text-[36px] font-[600] text-gray-100 pb-0 overflow-hidden text-ellipsis whitespace-nowrap"
                                >
                                    {{station.name}}
                                </p>
                                <span class="text-md text-gray-400 overflow-hidden flex flex-wrap gap-x-3 gap-y-1 pt-1">
                                    <span
                                        v-if="group?.group"
                                        class="text-gray-400 inline-flex items-center gap-[5px] w-full sm:w-auto"
                                    >
                                        <p>{{$lang('detail.hosted-by')}} {{group.group.name}}</p>
                                    </span>
                                    <span
                                        v-if="station.country"
                                        class="text-gray-400 inline-flex items-center gap-[5px]"
                                    >
                                        <v-icon
                                            id="map-pin"
                                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                                            size="100%"
                                        ></v-icon>
                                        <p>{{station.city ? station.city + ', ' : ''}}{{station.state ? station.state + ', ' : ''}}{{station.country}}</p>
                                    </span>
                                    <span
                                        v-if="station.utc"
                                        class="text-gray-400 inline-flex items-center gap-[5px] w-full sm:w-auto"
                                    >
                                        <v-icon
                                            id="clock"
                                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                                            size="100%"
                                        ></v-icon>
                                        <p>UTC{{station.utc}}</p>
                                    </span>
                                    <span
                                        v-if="state.authenticated && station?.playtime && duration(station.playtime ?? 0).length > 0"
                                        class="text-gray-400 inline-flex items-center gap-[5px]"
                                    >
                                        <v-icon
                                            id="headphones"
                                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                                            size="100%"
                                        ></v-icon>
                                        <p>{{duration(station.playtime ?? 0)}}</p>
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="station"
                            class="flex flex-col gap-6 mt-8"
                        >
                            <div class="flex gap-3">
                                <v-play-button :station="station"></v-play-button>
                                <v-button
                                    :icon="station.is_favorite ? 'bookmark-off' : 'bookmark'"
                                    :title="$lang(state.authenticated ? (station.is_favorite ? 'global.unlike' : 'global.like') : 'global.requires-auth')"
                                    @click="() => setLike(!station.is_favorite)"
                                    class="bg-zinc-900 hover:bg-white px-1"
                                    :class="{ '!bg-zinc-900': !state.authenticated }"
                                    :text="station.likes.toString()"
                                    :disabled="!state.authenticated"
                                ></v-button>
                            </div>
                            <p v-if="getDescription()" class="text-md text-gray-400 mt-2" v-html="getDescription()"></p>
                            <p v-else class="text-md text-gray-400">{{$lang('detail.no-description')}}</p>
                            <div v-if="station.tags && station.tags.length > 0" class="flex gap-3 flex-wrap">
                                <span v-for="tag in station.tags" class="cursor-pointer text-md text-white/90 font-medium items-center gap-[5px] bg-zinc-900 hover:bg-zinc-800 rounded-[4px] text-[14px] px-[14px] inline-flex h-[34px] leading-[34px]">{{tag}}</span>
                            </div>
                            <div v-if="station.is_restricted || station.is_broken || station.is_no_track_info" class="flex gap-2 flex-wrap">
                                <span
                                    v-if="station.is_restricted"
                                    class="text-white/90 items-center gap-[5px] bg-blue-600/70 rounded-[4px] text-[14px] px-[7px] inline-flex h-[24px] leading-[24px]"
                                >
                                    <p class="-mt-[1px]">Restricted</p>
                                </span>
                                <span
                                    v-if="station.is_broken"
                                    class="text-white/90 items-center gap-[5px] bg-red-600/70 rounded-[4px] text-[14px] px-[7px] inline-flex h-[24px] leading-[24px]"
                                >
                                    <p class="-mt-[1px]">Broken</p>
                                </span>
                                <span
                                    v-if="station.is_no_track_info"
                                    class="text-white/90 items-center gap-[5px] bg-green-600/70 rounded-[4px] text-[14px] px-[7px] inline-flex h-[24px] leading-[24px]"
                                >
                                    <p class="-mt-[1px]">No track info</p>
                                </span>
                            </div>
                            <div v-if="hasGroup()" class="mt-[32px]">
                                <h3 class="text-white text-[24px] font-bold pb-6 sm:pt-0">{{$lang('detail.related')}}</h3>
                                <ul class="flex flex-col">
                                    <li
                                        :key="station.id"
                                        v-for="group_station in group.stations"
                                        v-if="station.id !== group_station.id"
                                        class="border-t sm:border-t-2 first:border-none border-zinc-900 py-4 first:pt-0"
                                    >
                                        <v-station :station="group_station"></v-station>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </v-tab>
    `
}
