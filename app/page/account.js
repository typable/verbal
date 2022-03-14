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
        </v-tab>
    `
}
