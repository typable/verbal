import Vue, {reactive} from '/asset/lib/vue.min.js';
import {http, $lang, $route} from './utils.js';
import VMenu from './component/menu.js';
import VPlayer from './component/player.js';
import VPopup from './component/popup.js';
import VSearch from './page/search.js';
import VFavorites from './page/favorites.js';
import VAccount from './page/account.js';
import VNotfound from './page/notfound.js';
import VAuth from './page/auth.js';
import VProfile from './page/profile.js';
import VDetail from './component/detail.js';

export const VERSION = '{{version}}';
export const SWIPE_THRESHOLD = 70;
export const TOKEN_NAME = 'verbal-token';

export const ROUTES = {
    '^\/$': 'search',
    '^\/search$': 'search',
    '^\/favorites$': 'favorites',
    '^\/account$': 'account',
    '^\/station\/(\\d+)$': 'detail',
    '^@not-found$': 'not-found',
    '^\/auth$': 'auth',
    '^\/profile$': 'profile',
    '^\/profile/(\\d+)$': 'profile'
};

export const state = reactive({
    app: null,
    tab: 'search',
    tabs: ['search', 'favorites', 'account'],
    account: null,
    devices: null,
    token: null,
    station: null,
    authenticated: null,
    version: VERSION
});

(async () => {
    state.locale = await http`get::/asset/json/locale.json`();
    new Vue({
        el: '#app',
        data: {
            state,
            touch: null,
            target: null
        },
        components: {
            VMenu,
            VSearch,
            VFavorites,
            VAccount,
            VNotfound,
            VAuth,
            VPlayer,
            VPopup,
            VDetail,
            VProfile
        },
        mounted() {
            document.body.style.display = '';
            state.app = this;
            this.init();
            window.addEventListener('popstate', this.onPopState);
        },
        methods: {
            async init() {
                try {
                    state.account = await http`get::/api/account`();
                    state.devices = await http`get::/api/devices`();
                    state.token = localStorage.getItem(TOKEN_NAME);
                }
                catch(err) {
                    state.account = null;
                    state.devices = null;
                    state.token = null;
                }
                state.tab = 'search';
                state.station = null;
                if(state.account === null) {
                    localStorage.setItem(TOKEN_NAME, 'guest-token');
                    state.account = await http`get::/api/account`();
                    state.devices = await http`get::/api/devices`();
                    state.token = localStorage.getItem(TOKEN_NAME);
                }
                state.authenticated = state.token !== 'guest-token';
                if(!state.authenticated) {
                    const navigatorLanguage = navigator?.language;
                    let language = 'en';
                    if(/^de-?/.test(navigatorLanguage)) {
                        language = 'de';
                    }
                    state.account.language = language;
                }
                document.addEventListener('scroll', this.onScroll);
                document.addEventListener('wheel', this.onScroll);
                document.addEventListener('touchmove', this.onScroll);
                if('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/worker.js');
                    navigator.serviceWorker.addEventListener('controllerchange', this.updated);
                }
                $route(window.location.pathname, { update: false });
            },
            showError(error) {
                this.$refs.popup.open({
                    title: $lang('global.error'),
                    description: $lang('global.error.message', error),
                    actions: [
                        {
                            title: $lang('global.report'),
                            icon: 'message-report',
                            handle: () => window.open('https://github.com/typable/verbal/issues')
                        },
                        {
                            title: $lang('global.continue'),
                            icon: 'arrow-right',
                            handle: () => this.$refs.popup.close()
                        }
                    ]
                });
            },
            updated() {
                this.$refs.popup.open({
                    title: $lang('global.update'),
                    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
                    actions: [
                        {
                            title: $lang('global.continue'),
                            icon: 'check',
                            handle: () => window.location.reload()
                        }
                    ]
                });
            },
            onPopState() {
                $route(window.location.pathname, { update: false });
            },
            onScroll() {
                if(state.tab === 'search') {
                    if(window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 200) {
                        if(this.$refs.search.searching) {
                            this.$refs.search.doSearchMore();
                        }
                    }
                }
            }
        },
        template: `
            <div
                v-if="state.authenticated !== null"
                class="px-4 sm:px-10 max-w-[1200px] mx-auto flex flex-col min-h-[100vh]"
            >
                <v-menu :state="state"></v-menu>
                <v-auth :state="state"></v-auth>
                <div>
                    <v-search ref="search" :state="state"></v-search>
                    <v-favorites ref="favorites" :state="state"></v-favorites>
                    <v-account :state="state"></v-account>
                    <v-profile ref="profile" :state="state"></v-profile>
                </div>
                <v-player ref="player" :station="state.station"></v-player>
                <v-detail ref="detail"></v-detail>
                <v-notfound :state="state"></v-notfound>
                <v-popup ref="popup"></v-popup>
            </div>
        `
    });
})();
