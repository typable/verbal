import Vue from '/asset/lib/vue.min.js';
import {http, $lang} from './utils.js';
import VMenu from './component/menu.js';
import VPlayer from './component/player.js';
import VPopup from './component/popup.js';
import VSearch from './page/search.js';
import VFavorites from './page/favorites.js';
import VAccount from './page/account.js';

const VERSION = '{{version}}';
const SWIPE_THRESHOLD = 70;

export const state = {
    app: null,
    tab: 'search',
    tabs: ['search', 'favorites', 'account'],
    account: null,
    station: null,
    authenticated: false,
    open: false,
    version: VERSION
};

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
            VPlayer,
            VPopup
        },
        mounted() {
            document.body.style.display = '';
            state.app = this;
            this.init();
        },
        methods: {
            async init() {
                try {
                    state.account = await http`get::/api/account`();
                }
                catch(error) {
                    // ignore
                }
                if(state.account === null) {
                    this.$refs.popup.open({
                        title: $lang('global.welcome'),
                        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
                        actions: [
                            {
                                icon: 'check',
                                title: $lang('global.continue'),
                                handle: () => {
                                    localStorage.setItem('verbal-token', 'test-token');
                                    window.location.reload();
                                }
                            }
                        ]
                    });
                    return;
                }
                state.authenticated = true;
                document.addEventListener('scroll', this.onScroll);
                document.addEventListener('wheel', this.onScroll);
                if('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/worker.js');
                    navigator.serviceWorker.addEventListener('controllerchange', this.updated);
                }
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
            onScroll() {
                if(state.tab === 'search') {
                    if(window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 200) {
                        if(this.$refs.search.searching) {
                            this.$refs.search.doSearchMore();
                        }
                    }
                }
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
                if(state.open) {
                    if(Math.abs(diff.y) >= SWIPE_THRESHOLD) {
                        if(diff.y > 0 && angle >= -30 && angle <= 30) {
                            state.open = false;
                        }
                    }
                    return;
                }
                if(Math.abs(diff.x) >= SWIPE_THRESHOLD) {
                    if(diff.x > 0 && index > 0 && (angle <= -60 || angle >= 60)) {
                        state.tab = state.tabs[index - 1];
                    }
                    if(diff.x < 0 && index < state.tabs.length - 1 && (angle <= -60 || angle >= 60)) {
                        state.tab = state.tabs[index + 1];
                    }
                }
                if(Math.abs(diff.y) >= SWIPE_THRESHOLD) {
                    if(Math.abs(diff.y) >= SWIPE_THRESHOLD) {
                        if(!state.open && this.target === this.$refs.player.$refs.button) {
                            if(diff.y < 0 && angle >= -30 && angle <= 30) {
                                state.open = true;
                            }
                        }
                    }
                }
            }
        },
        computed: {
            styles() {
                const index = state.tabs.indexOf(state.tab);
                const offset = window.innerWidth < 1200
                    ? `${index * -100}vw`
                    : `${index * -1200}px`;
                return {
                    'transform': `translate(${offset}, 0)`
                };
            }
        },
        template: `
            <div
                @touchstart="onTouchStart"
                @touchend="onTouchEnd"
                class="px-4 sm:px-10 max-w-[1200px] mx-auto flex flex-col min-h-[100vh] max-h-[100vh] overflow-hidden"
            >
                <v-menu :state="state"></v-menu>
                <div class="flex flex-1 gap-[32px] sm:gap-[5rem] overflow-y-clip transition-transform md:transition-none" :style="styles">
                    <v-search v-if="state.authenticated" ref="search" :state="state"></v-search>
                    <v-favorites v-if="state.authenticated" ref="favorites" :state="state"></v-favorites>
                    <v-account v-if="state.authenticated" :state="state"></v-account>
                </div>
                <v-player ref="player" v-if="state.authenticated" :station="state.station"></v-player>
                <v-popup ref="popup"></v-popup>
            </div>
        `
    });
})();
