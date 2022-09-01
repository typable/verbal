import {$lang, http} from '../utils.js';
import VTab from '../component/tab.js';

export default {
    props: ['state'],
    data() {
        const {name, language} = this.state.account;
        return {
            name,
            language
        };
    },
    components: {
        VTab
    },
    methods: {
        $lang,
        isCurrentDevice(device) {
            return device.uid === this.state.token;
        },
        async updateAccount(type, value) {
            const account = {...this.state.account};
            account[type] = value;
            try {
                this.state.account = await http`put::/api/account`(account);
            }
            catch(err) {
                this.state.app.showError(err);
                this.reset();
            }
        },
        reset() {
            const {name, language} = this.state.account;
            this.name = name;
            this.language = language;
        }
    },
    template: `
        <v-tab id="account" :tab="state.tab">
            <div class="flex flex-col flex-1 gap-[32px] pb-8 sm:pb-[100px] pt-2">
                <div>
                    <h3 class="text-white text-[24px] font-bold pb-6 pt-4 sm:pt-0">{{$lang('account.settings')}}</h3>
                    <div class="flex flex-col gap-8">
                        <div class="flex flex-col gap-2">
                            <label for="username" class="text-white text-md">{{$lang('account.username')}}</label>
                            <span class="text-gray-400 text-sm">{{$lang('account.username.info')}}</span>
                            <input
                                v-model="name"
                                id="username"
                                type="text"
                                maxlength="20"
                                spellcheck="false"
                                autocomplete="off"
                                @change="updateAccount('name', name)"
                                class="rounded-md w-full h-[52px] px-4 mt-2 text-md bg-zinc-900 text-white placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none"
                            >
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="language" class="text-white text-md">{{$lang('account.language')}}</label>
                            <span class="text-gray-400 text-sm">{{$lang('account.language.info')}}</span>
                            <select
                                v-model="language"
                                id="language"
                                autocomplete="off"
                                @change="updateAccount('language', language)"
                                class="rounded-md w-full h-[52px] px-4 mt-2 text-md bg-zinc-900 text-white placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none appearance-none"
                            >
                                <option value="en">English</option>
                                <option value="de">Deutsch</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div v-if="state.devices">
                    <h3 class="text-white text-[24px] font-bold pb-6 pt-4 sm:pt-0">{{$lang('account.devices')}}</h3>
                    <ul class="flex flex-col gap-4">
                        <li v-for="device in state.devices" class="w-full rounded-md bg-zinc-900 p-5 flex flex-col gap-1">
                            <p class="text-md text-white flex justify-between items-center">
                                {{device.name ?? $lang('account.devices.unknown')}}
                                <span
                                    v-if="isCurrentDevice(device)"
                                    class="text-sm text-white px-[7px] bg-blue-600/70 rounded-[4px] h-[24px] leading-[24px]"
                                >
                                    {{$lang('account.devices.current')}}
                                </span>
                            </p>
                            <p class="text-sm text-gray-500">{{device.uid}}</p>
                        </li>
                    </ul>
                </div>
                <div>
                    <p class="text-md text-gray-400 text-center">Verbal</p>
                    <p class="text-md text-gray-400 text-center">{{state.version}}</p>
                    <p class="text-md text-gray-400 text-center pt-2">
                        Created by
                        <a class="text-gray-200" href="https://github.com/typable" target="_blank">@typable</a>
                    </p>
                </div>
            </div>
        </v-tab>
    `
}
