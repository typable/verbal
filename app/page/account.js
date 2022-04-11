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
            <div class="sticky top-[98px] z-30 -mb-6">
                <div class="bg-gradient-to-b from-black h-2 sm:h-4"></div>
            </div>
        </v-tab>
    `
}
