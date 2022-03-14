import {$lang} from '../utils.js';
import VPlayer from '../component/player.js';
import VTab from '../component/tab.js';

export default {
    props: ['state'],
    components: {
        VTab,
        VPlayer
    },
    methods: {
        $lang
    },
    template: `
        <v-tab id="favorites" :tab="state.tab">
            <v-player :station="state.station"></v-player>
            <!--
            <ul v-if="account.info" class="flex flex-col">
                <li v-bind:key="station.id" v-for="station in account.favorites" class="w-full py-5 gap-4 group flex items-center border-t sm:border-t-2 first:border-none border-zinc-900">
                    <div class="w-[54px] h-[54px] min-w-[54px] bg-zinc-900 rounded-lg overflow-hidden">
                        <img v-if="station.favicon" v-bind:src="station.favicon" v-on:error="doHideFavicon(station)" class="w-full h-full object-contain">
                        <div v-else class="w-full h-full bg-gray-400 [mask:url('https://cdn.typable.dev/tabler/access-point')]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: 65%;"></div>
                    </div>
                    <div class="flex flex-col flex-1 min-w-0">
                        <p class="text-lg font-medium text-gray-100 pb-0 overflow-hidden text-ellipsis whitespace-nowrap">{{station.name}}</p>
                        <span class="text-md text-gray-400 overflow-hidden flex gap-2 sm:gap-3">
                            <span v-if="station.country" class="text-gray-400 inline-flex items-center gap-[5px]" v-bind:title="$('global.country')">
                                <div class="w-[18px] h-[18px] min-w-[18px] inline-flex bg-gray-400 [mask:url(https://cdn.typable.dev/tabler/world)]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: 100%;"></div>
                                <p>{{station.country}}</p>
                            </span>
                            <span v-if="station.votes" class="text-gray-400 inline-flex items-center gap-[5px]" v-bind:title="$('global.votes')">
                                <div class="w-[18px] h-[18px] inline-flex bg-gray-400 [mask:url(https://cdn.typable.dev/tabler/thumb-up)]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: 100%;"></div>
                                <p>{{station.votes}}</p>
                            </span>
                            <span v-if="station.click_trend" class="text-gray-400 hidden sm:inline-flex items-center gap-[5px]" v-bind:title="$('global.trend')">
                                <div class="w-[16px] h-[16px] inline-flex bg-gray-400" v-bind:class="[ station.click_trend >= 0 ? '[mask:url(https://cdn.typable.dev/tabler/arrow-up-right)]' : '[mask:url(https://cdn.typable.dev/tabler/arrow-down-right)]' ]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center;"></div>
                                <p>{{Math.abs(station.click_trend) ?? 'None'}}</p>
                            </span>
                        </span>
                    </div>
                    <div class="inline-flex gap-4">
                        <button v-on:click="doToggleFavorite(station, !station.is_favorite)" v-bind:title="[ station.is_favorite ? $('global.unlike') : $('global.like') ]" class="w-[46px] h-[46px] bg-zinc-900 hover:bg-white rounded-full inline-flex justify-center items-center cursor-pointer transition-colors">
                            <div class="w-full h-full bg-gray-400 hover:bg-red-600 transition-colors" v-bind:class="[ station.is_favorite ? '[mask:url(https://cdn.typable.dev/tabler/heart-solid)]' : '[mask:url(https://cdn.typable.dev/tabler/heart)]' ]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center;"></div>
                        </button>
                        <button v-on:click="doPlay(station)" v-bind:title="$('global.play')" class="w-[46px] h-[46px] bg-zinc-900 hover:bg-white rounded-full inline-flex justify-center items-center cursor-pointer transition-colors">
                            <div class="w-full h-full bg-gray-400 hover:bg-gray-700 transition-colors [mask:url('https://cdn.typable.dev/tabler/player-play')]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center;"></div>
                        </button>
                    </div>
                </li>
            </ul>
            -->
        </v-tab>
    `
}
