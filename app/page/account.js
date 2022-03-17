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
            <div class="sticky top-[98px] z-30 -mb-6">
                <div class="bg-gradient-to-b from-black h-2 sm:h-4"></div>
            </div>

            <!--
            <div v-if="account.settings" class="flex flex-col gap-[60px] sm:gap-[80px] pt-6 sm:pt-12">
                <div>
                    <h1 class="text-white text-[28px] font-semibold pb-6 sm:pb-8">{{$('account.settings')}}</h1>
                    <div class="grid grid-cols-8 gap-8 sm:gap-10 pt-8 sm:pt-12">
                        <div class="flex flex-col col-span-8 sm:col-span-8">
                            <p class="text-gray-300 text-[22px] font-medium pb-2 text-lg">{{$('global.account')}}</p>
                        </div>
                        <div class="flex flex-col col-span-8 sm:col-span-4">
                            <p class="text-white font-medium pb-2 text-lg">{{$('account.username')}}</p>
                            <span class="text-gray-400 pb-4 text-md flex-1">{{$('account.username.info')}}</span>
                            <input v-model="account.settings.username" v-on:change="doAccountSave" type="text" class="w-full h-[54px] px-5 sm:h-[48px] sm:px-4 text-md rounded-lg bg-zinc-900 text-gray-300 disabled:text-gray-600 focus:text-gray-200 outline-none font-normal placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none">
                        </div>
                        <div class="flex flex-col col-span-8 sm:col-span-4">
                            <p class="text-white font-medium pb-2 text-lg">{{$('account.language')}}</p>
                            <span class="text-gray-400 pb-4 text-md flex-1">{{$('account.language.info')}}</span>
                            <div class="flex items-center relative">
                                <select v-model="account.settings.language" v-on:change="doAccountSave" type="text" class="w-full h-[54px] px-5 sm:h-[48px] sm:px-4 appearance-none text-md rounded-lg bg-zinc-900 text-gray-300 disabled:text-gray-600 focus:text-gray-200 outline-none font-normal placeholder:font-normal placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none">
                                    <option value="en">English</option>
                                    <option value="de">Deutsch</option>
                                </select>
                                <div class="absolute right-3 pointer-events-none w-[30px] h-[30px] bg-gray-400 [mask:url(https://cdn.typable.dev/tabler/chevron-down)]" style="-webkit-mask-repeat: no-repeat; -webkit-mask-position: center;"></div>
                            </div>
                        </div>
                        <div class="flex flex-col col-span-8 sm:col-span-8 border-t sm:border-t-2 border-zinc-800"></div>
                        <div class="flex flex-col col-span-8 sm:col-span-8">
                            <p class="text-gray-300 text-[22px] font-medium pb-2 text-lg">{{$('account.player')}}</p>
                        </div>
                        <div class="flex flex-col col-span-8 sm:col-span-4">
                            <p class="text-white font-medium pb-2 text-lg">{{$('account.playback-history')}}</p>
                            <span class="text-gray-400 pb-4 text-md flex-1">{{$('account.playback-history.info')}}</span>
                            <div class="flex h-[54px] sm:h-[48px] items-center">
                                <label for="account-playback-history" class="w-[50px] h-[20px] bg-zinc-900 rounded-full ml-[10px] relative cursor-pointer group">
                                    <input v-model="account.settings.is_playback_history" v-on:change="doAccountSave" type="checkbox" id="account-playback-history" class="peer opacity-0 w-0 h-0 pointer-events-none select-none outline-none">
                                    <div class="before:absolute before:-translate-y-[50%] before:-left-[10px] before:transition-all before:top-[10px] before:content-[''] before:z-10 before:block peer-checked:after:bg-gray-500/70 peer-checked:before:translate-x-[40px] before:w-[32px] before:h-[32px] sm:before:h-[28px] sm:before:w-[28px] before:rounded-full before:bg-zinc-400 after:content-[''] after:absolute after:block after:-left-[10px] after:rounded-full after:transition-colors after:left-0 after:top-0 after:w-full after:h-[20px] group-hover:before:bg-zinc-300 outline-none"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h1 class="text-white text-[28px] font-semibold pb-6 sm:pb-8">{{$('account.devices')}}</h1>
                    <div class="grid grid-cols-8 gap-8 sm:gap-10">
                        <div class="flex flex-col gap-8 col-span-8 pt-8 sm:pt-12">
                            <ul class="flex flex-col">
                                <li v-for="device in account.settings.devices" class="flex gap-4 px-3 py-2 items-center hover:bg-zinc-800 rounded-md group transition-colors">
                                    <div v-bind:title="device" class="flex flex-1 min-w-0"> 
                                        <span class="text-gray-400 group-hover:text-gray-200 transition-colors overflow-hidden text-ellipsis whitespace-nowrap">{{device}}</span>
                                    </div>
                                </li>
                            </ul>
                            <input v-model="account.foreign_code" type="text" maxlength="6" placeholder="------" class="w-[200px] text-center tracking-[8px] h-[56px] px-5 text-lg uppercase rounded-lg bg-zinc-900 text-white outline-none font-medium placeholder:tracking-[12px] placeholder:font-bold placeholder:normal-case placeholder:text-gray-500 focus:placeholder:text-gray-600 outline-none">
                            <div class="flex gap-8 flex-col sm:flex-row w-full">
                                <button v-on:click="doSync" class="flex-1 bg-zinc-900 hover:bg-zinc-100 rounded-lg px-4 h-[48px] min-h-[48px] transition-colors text-gray-200 hover:text-gray-800 text-md">Connect</button>
                                <button v-on:click="doGenerate" class="flex-1 bg-zinc-900 hover:bg-zinc-100 rounded-lg px-4 h-[48px] min-h-[48px] transition-colors text-gray-200 hover:text-gray-800 text-md">Link device</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="grid grid-cols-8 gap-8 sm:gap-10 pb-8">
                        <div class="flex flex-col gap-1 col-span-8 pt-8 sm:pt-12">
                            <p class="text-zinc-400 text-md mx-auto">Verbal</p>
                            <p class="text-zinc-400 text-md mx-auto">Version: {{version}}</p>
                        </div>
                    </div>
                </div>
            </div>
            -->

        </v-tab>
    `
}
