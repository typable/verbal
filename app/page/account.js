import {$lang} from '../utils.js';
import VTab from '../component/tab.js';

export default {
    props: ['state'],
    components: {
        VTab
    },
    methods: {
        $lang
    },
    template: `
        <v-tab id="account" :tab="state.tab">
            <div class="pb-8 sm:pb-[100px] pt-2">
                <p class="text-md text-gray-400 text-center">Verbal</p>
                <p class="text-md text-gray-400 text-center">{{state.version}}</p>
                <p class="text-md text-gray-400 text-center pt-2">
                    Created by
                    <a class="text-gray-200 hover:underline font-bold" href="https://github.com/typable" target="_blank">@typable</a>
                </p>
            </div>
        </v-tab>
    `
}
