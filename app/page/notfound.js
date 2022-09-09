import {state} from '../main.js';
import {$lang, $route} from '../utils.js';
import VButton from '../element/button.js';
import VTab from '../component/tab.js';
import VIcon from '../element/icon.js';

export default {
    props: ['state'],
    components: {
        VTab,
        VButton,
        VIcon,
    },
    methods: {
        $lang,
        $route,
    },
    template: `
        <v-tab id="not-found" :tab="state.tab">
            <div class="z-40">
                <div
                    ref="modal"
                    class="w-full mx-auto flex flex-col bg-black fixed left-[100vw] top-0 h-[100vh] overflow-y-auto px-4 pb-12 sm:pb-[100px] sm:px-10 transition-detail detail-active"
                >
                    <div class="w-full flex flex-col px-4 sm:px-10 max-w-[1200px] mx-auto">
                        <div class="w-full h-[98px] py-6 flex gap-4 justify-between">
                            <v-button
                                icon="chevron-left"
                                @click="$route('/')"
                            ></v-button>
                            <v-button
                                icon="message-report"
                            ></v-button>
                        </div>
                        <div class="flex flex-col gap-5 md:mt-16">
                            <div class="flex flex-col flex-1 min-w-0 text-center">
                                <p class="text-[24px] md:text-[36px] font-[600] text-gray-100 pb-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {{$lang('global.not-found')}}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </v-tab>
    `
}
