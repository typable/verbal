import {$lang, http} from '../utils.js';
import VTab from '../component/tab.js';
import VSelect from '../component/select.js';
import VButton from '../element/button.js';

export default {
    props: ['state'],
    data() {
        return {
            name: '',
            language: 'en',
            token: '',
            method: null
        };
    },
    components: {
        VTab,
        VSelect,
        VButton
    },
    methods: {
        $lang,
        async register() {
            try {
                localStorage.removeItem('verbal-token');
                const device = await http`post::/api/account`({
                    name: this.name,
                    language: this.language
                });
                localStorage.setItem('verbal-token', device.uid);
                this.state.app.init();
            }
            catch(err) {
                console.error(err);
            }
        },
        async login() {
            try {
                localStorage.setItem('verbal-token', this.token);
                await http`get::/api/account`();
                this.state.app.init();
            }
            catch(err) {
                localStorage.removeItem('verbal-token');
                console.error(err);
            }
        }
    },
    template: `
        <v-tab id="account" :tab="state.tab">
            <div class="flex flex-col items-center justify-center h-screen min-h-screen">
                <div v-if="method === null">
                    <h3 class="text-white text-[34px] font-bold pb-4 -mt-14 text-center">{{$lang('global.brand')}}</h3>
                    <p class="text-md text-gray-400 text-center pb-12 px-4">{{$lang('global.slogan')}}</p>
                    <div class="flex flex-col gap-5 w-full px-4">
                        <button
                            class="w-full h-[52px] px-4 text-md bg-zinc-100 hover:bg-zinc-300 text-zinc-900 rounded-md outline-none"
                            @click="method = 'register'"
                        >
                            Create an account
                        </button>
                        <button
                            class="w-full h-[52px] px-4 text-md bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md outline-none"
                            @click="method = 'login'"
                        >
                            Log In
                        </button>
                    </div>
                </div>
                <div v-if="method === 'register'" class="w-full flex flex-col gap-5 -mt-12">
                    <v-button
                        icon="arrow-left"
                        title="Back"
                        @click="method = null"
                        class="self-start"
                    >
                    </v-button>
                    <h3 class="text-white text-[24px] font-bold pb-4 px-4 sm:pt-0">Create an account</h3>
                    <div class="flex flex-col gap-1 w-full px-4">
                        <label for="username" class="text-white text-lg">Choose your username</label>
                        <input
                            v-model="name"
                            id="username"
                            type="text"
                            maxlength="20"
                            spellcheck="false"
                            autocomplete="off"
                            class="rounded-md w-full h-[52px] px-4 mt-2 text-md bg-zinc-900 text-white placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none"
                        >
                    </div>
                    <div class="flex flex-col gap-1 w-full px-4">
                        <label for="language" class="text-white text-lg">Select language</label>
                        <v-select
                            id="language"
                            v-model="language"
                            class="mt-2"
                        >
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                        </v-select>
                    </div>
                    <button
                        class="h-[52px] px-4 mx-4 text-md bg-zinc-100 hover:bg-zinc-300 text-zinc-900 rounded-md outline-none mt-8"
                        @click="register"
                    >
                        Sign up now
                    </button>
                </div>
                <div v-if="method === 'login'" class="w-full flex flex-col gap-5 -mt-12">
                    <v-button
                        icon="arrow-left"
                        title="Back"
                        @click="method = null"
                        class="self-start"
                    >
                    </v-button>
                    <h3 class="text-white text-[24px] font-bold pb-4 px-4 sm:pt-0">Log In</h3>
                    <div class="flex flex-col gap-1 w-full px-4">
                        <label for="token" class="text-white text-lg">Insert account token</label>
                        <input
                            v-model="token"
                            id="token"
                            type="text"
                            spellcheck="false"
                            autocomplete="off"
                            class="rounded-md w-full h-[52px] px-4 mt-2 text-md bg-zinc-900 text-white placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none"
                        >
                    </div>
                    <button
                        class="h-[52px] px-4 mx-4 text-md bg-zinc-100 hover:bg-zinc-300 text-zinc-900 rounded-md outline-none mt-8"
                        @click="login"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </v-tab>
    `
}
