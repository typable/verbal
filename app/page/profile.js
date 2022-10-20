import {$lang, $route, http, duration} from '../utils.js';
import VTab from '../component/tab.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';

export default {
    props: ['state'],
    data() {
        return {
            account: null
        };
    },
    components: {
        VTab,
        VButton,
        VIcon
    },
    methods: {
        $lang,
        $route,
        duration,
        async show(id) {
            this.account = await http`get::/api/account/${id}`();
            if(this.account === null) {
                $route('@not-found', { update: false });
                return;
            }
        }
    },
    mounted() {
        const path = window.location.pathname;
        if(/^\/profile$/.test(path)) {
            this.show(this.state.account.id);
            return;
        }
        const match = /^\/profile\/(\d+)$/.exec(path);
        if(match) {
            const id = match[1];
            this.show(id);
        }
    },
    template: `
        <v-tab id="profile" :tab="state.tab">
            <div v-if="account" class="flex flex-col flex-1 gap-[32px] pb-8 sm:pb-[100px] pt-2">
                <p
                    class="text-[24px] md:text-[36px] font-[600] text-gray-100 pb-0 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                    {{account.name}}
                </p>
                <span class="text-md text-gray-400 overflow-hidden flex flex-wrap gap-x-3 gap-y-1 pt-1">
                    <span
                        v-if="account.playtime && duration(account.playtime ?? 0).length > 0"
                        class="text-gray-400 inline-flex items-center gap-[5px]"
                        :title="$lang('detail.playtime')"
                    >
                        <v-icon
                            id="headphones"
                            class="w-[18px] h-[18px] !min-w-[18px] inline-flex text-gray-400"
                            size="100%"
                        ></v-icon>
                        <p>{{duration(account.playtime ?? 0)}}</p>
                    </span>
                </span>
            </div>
        </v-tab>
    `
}
