import {http} from './utils.js';
import VMenu from './component/menu.js';
import VSearch from './page/search.js';
import VFavorites from './page/favorites.js';
import VAccount from './page/account.js';

export const state = {
    app: null,
    tab: 'search',
    account: {
        username: '',
        language: 'en'
    },
    station: null
};

(async () => {
    state.locale = await http`get::/asset/json/locale.json`();

    new Vue({
        el: '#app',
        data: {
            state
        },
        components: {
            VMenu,
            VSearch,
            VFavorites,
            VAccount
        },
        mounted() {
            document.body.style.display = '';
            state.app = this;
            this.init();
        },
        methods: {
            async init() {
                state.account = await http`get::/api/account`();
            }
        },
        template: `
            <div class="px-4 sm:px-10 pb-8 sm:pb-[100px] max-w-[800px] mx-auto flex flex-col">
                <v-menu :state="state"></v-menu>
                <v-search :state="state"></v-search>
                <v-favorites ref="favorites" :state="state"></v-favorites>
                <v-account :state="state"></v-account>
            </div>
        `
    });
})();
