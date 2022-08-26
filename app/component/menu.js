import {$lang} from '../utils.js';
import VButton from '../element/button.js';

export default {
    props: ['state'],
    components: {
        VButton
    },
    methods: {
        $lang
    },
    template: `
        <div class="sticky top-0 z-30">
            <div class="flex bg-black py-6 gap-4">
                <div class="flex flex-1 gap-4">
                    <v-button
                        icon="search"
                        :title="$lang('global.search')"
                        :active="state.tab === 'search'"
                        @click="() => state.tab = 'search'"
                    ></v-button>
                    <v-button
                        icon="bookmarks"
                        :title="$lang('global.favorites')"
                        :active="state.tab === 'favorites'"
                        @click="() => state.tab = 'favorites'"
                    ></v-button>
                </div>
                <v-button
                    :text="state.account?.name"
                    icon="user"
                    :title="$lang('global.account')"
                    :active="state.tab === 'account'"
                    @click="() => state.tab = 'account'"
                ></v-button>
            </div>
        </div>
    `
}
