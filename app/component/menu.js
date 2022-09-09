import {$lang, $route} from '../utils.js';
import VButton from '../element/button.js';

export default {
    props: ['state'],
    components: {
        VButton
    },
    methods: {
        $lang,
        $route
    },
    template: `
        <div class="sticky top-0 z-30 -mb-2">
            <div class="flex bg-black py-6 gap-4">
                <div class="flex flex-1 gap-4">
                    <v-button
                        icon="search"
                        :title="$lang('global.search')"
                        :active="state.tab === 'search'"
                        @click="$route('/search')"
                    ></v-button>
                    <v-button
                        icon="bookmarks"
                        :title="$lang('global.favorites')"
                        :active="state.tab === 'favorites'"
                        @click="$route('/favorites')"
                    ></v-button>
                </div>
                <v-button
                    :text="state.account?.name"
                    icon="user"
                    :title="$lang('global.account')"
                    :active="state.tab === 'account'"
                    @click="$route('/account')"
                ></v-button>
            </div>
            <div class="w-full h-2 bg-gradient-to-b from-black to-transparent"></div>
        </div>
    `
}
