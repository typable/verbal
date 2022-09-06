import {state, SWIPE_THRESHOLD} from '../main.js';
import {http, $lang, duration} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';
import VImage from '../element/image.js';

export default {
    data() {
        return {
            station: null,
            open: false
        };
    },
    components: {
        VButton,
        VIcon,
        VImage
    },
    methods: {
        $lang,
        duration,
        async load(stationId) {
            this.station = await http`get::/api/station/${stationId}`();
            this.open = true;
        },
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
        onTouchStart(event) {
            this.touch = event.changedTouches[0];
            this.target = event.target;
        },
        onTouchEnd(event) {
            const touch = event.changedTouches[0];
            const diff = {
                x: touch.pageX - this.touch.pageX,
                y: touch.pageY - this.touch.pageY
            };
            const angle = Math.atan(diff.x / diff.y) * (180 / Math.PI);
            const index = state.tabs.indexOf(state.tab);
            if(state.app.$refs.player.open) {
                return;
            }
            if(Math.abs(diff.x) >= SWIPE_THRESHOLD) {
                if(this.open && diff.x > 0 && (angle <= -60 || angle >= 60)) {
                    this.open = false;
                }
            }
        },
        gradient(color) {
            return `linear-gradient(to bottom, ${color ?? 'transparent'}, transparent)`;
        }
    },
    created() {
        document.body.addEventListener('touchstart', this.onTouchStart);
        document.body.addEventListener('touchend', this.onTouchEnd);
    },
    onUnmounted() {
        document.body.removeEventListener('touchstart', this.onTouchStart);
        document.body.removeEventListener('touchend', this.onTouchEnd);
    },
    computed: {
        opacity() {
            return {
                'opacity': `${this.open === true ? 1 : 0}`,
                'pointer-events': `${this.open === true ? 'all' : 'none'}`
            };
        }
    },
    template: `
        <div class="z-40">
            <div
                @click="open = false"
                class="fixed top-0 bottom-0 left-0 right-0 bg-black/60 transition-detail"
                :style="opacity"
            >
            </div>
            <div
                ref="modal"
                class="w-full mx-auto flex flex-col bg-black fixed left-[100vw] top-0 h-[100vh] overflow-y-auto px-4 pb-12 sm:pb-[100px] sm:px-10 transition-detail"
                :class="{ 'detail-active': open }"
            >
                <div class="w-full flex flex-col max-w-[1200px] mx-auto">
                    <div
                        class="w-full absolute top-0 left-0 h-[40vh] z-[-1]"
                        :style="{'background': gradient(station?.color)}"
                    >
                    </div>
                    <div class="w-full h-[98px] py-6 flex gap-4 justify-between sticky top-0">
                        <v-button
                            icon="chevron-left"
                            @click="open = false"
                        ></v-button>
                        <v-button
                            icon="share"
                        ></v-button>
                    </div>
                    <div class="flex flex-col gap-5">
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
                                class="text-[24px] font-[600] text-gray-100 pb-0 overflow-hidden text-ellipsis whitespace-nowrap"
                            >
                                {{station.name}}
                            </p>
                            <span class="text-md text-gray-400 overflow-hidden flex gap-3 pt-1">
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
                                    v-if="station?.playtime && duration(station.playtime ?? 0).length > 0" 
                                    class="text-gray-400 inline-flex items-center gap-[5px]"
                                    :title="$lang('detail.playtime')"
                                >
                                    <v-icon
                                        id="clock"
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
                        <div v-if="station.tags && station.tags.length > 0" class="flex gap-3 flex-wrap">
                            <span v-for="tag in station.tags" class="cursor-pointer text-md text-white/90 font-medium items-center gap-[5px] bg-zinc-900 hover:bg-zinc-800 rounded-[4px] text-[14px] px-[14px] inline-flex h-[34px] leading-[34px]">{{tag}}</span>
                        </div>
                        <div class="flex gap-3">
                            <v-button
                                icon="player-play"
                                @click="() => setStation(station)"
                                class="bg-zinc-900 hover:bg-white"
                            ></v-button>
                            <v-button
                                :icon="[ station.is_favorite ? 'heart-off' : 'heart' ]"
                                :title="[ $lang(station.is_favorite ? 'global.unlike' : 'global.like') ]"
                                @click="() => setLike(!station.is_favorite)"
                                class="bg-zinc-900 hover:bg-white"
                                :text="$lang(station.is_favorite ? 'global.unlike' : 'global.like')"
                            ></v-button>
                        </div>
                        <p v-if="station.description" class="text-md text-gray-400" v-html="station.description"></p>
                        <p v-else class="text-md text-gray-400">{{$lang('detail.no-description')}}</p>
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
                    </div>
                </div>
            </div>
        </div>
    `
}
