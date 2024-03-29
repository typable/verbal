import {state} from '../main.js';
import {$lang, $route} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';
import VImage from '../element/image.js';

export default {
    props: ['station', 'type'],
    data() {
        return { state };
    },
    components: {
        VButton,
        VIcon,
        VImage
    },
    methods: {
        $lang,
        $route
    },
    template: `
        <div>
            <div v-if="type === undefined || type === 'list'" class="w-full gap-4 group flex items-center">
                <v-image
                    :station="station"
                    @click="() => state.app.$refs.player.play(station)"
                    class="w-[54px] h-[54px] min-w-[54px] cursor-pointer"
                ></v-image>
                <div
                    class="flex flex-col flex-1 min-w-0 cursor-pointer"
                    @click="$route('/station/' + station.id)"
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
                            <p>{{station.city ? station.city + ', ' : ''}}{{station.state ? station.state + ', ' : ''}}{{station.country}}</p>
                        </span>
                    </span>
                </div>
            </div>
            <div v-if="type === 'grid'" class="flex flex-col gap-3 group w-full min-w-full">
                <v-image
                    :station="station"
                    @click="$route('/station/' + station.id)"
                    class="w-full aspect-square min-w-full cursor-pointer"
                ></v-image>
                <p
                    :title="station.name"
                    class="text-md font-medium text-gray-100 pb-0 w-full"
                >
                    {{station.name}}
                </p>
            </div>
        </div>
    `
}
