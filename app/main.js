import {http} from './utils.js';
import VMenu from './component/menu.js';
import VPlayer from './component/player.js';
import VSearch from './page/search.js';
import VFavorites from './page/favorites.js';
import VAccount from './page/account.js';

export const state = {
    app: null,
    tab: 'favorites',
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
            VAccount,
            VPlayer
        },
        mounted() {
            document.body.style.display = '';
            state.app = this;
            this.init();
        },
        methods: {
            async init() {
                window.app = this;
                state.account = await http`get::/api/account`();
                document.addEventListener('scroll', this.onScroll);
                document.addEventListener('wheel', this.onScroll);
            },
            onScroll() {
                if(state.tab === 'search') {
                    if(window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 200) {
                        this.$refs.search.doSearchMore();
                    }
                }
            }
        },
        template: `
            <div class="px-4 sm:px-10 pb-8 sm:pb-[100px] max-w-[800px] mx-auto flex flex-col">
                <v-menu :state="state"></v-menu>
                <v-player :station="state.station"></v-player>
                <v-search ref="search" :state="state"></v-search>
                <v-favorites ref="favorites" :state="state"></v-favorites>
                <v-account :state="state"></v-account>
            </div>
        `
    });
})();

