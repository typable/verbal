import {$lang} from '../utils.js';
import VButton from '../element/button.js';

export default {
    props: ['title', 'description', 'actions'],
    data() {
        return {
            show: false
        };
    },
    components: {
        VButton
    },
    methods: {
        $lang,
        open(info) {
            const {title, description, actions} = info;
            this.title = title;
            this.description = description;
            this.actions = actions;
            this.show = true;
        },
        close() {
            this.show = false;
        }
    },
    computed: {
        opacity() {
            return {
                'opacity': `${this.show ? 1 : 0}`,
                'pointer-events': `${this.show ? 'all' : 'none'}`
            };
        },
        transform() {
            return {
                'opacity': `${this.show ? 1 : 0}`,
                'pointer-events': `${this.show ? 'all' : 'none'}`,
                'transform': `translate(-50%, calc(-50% + ${this.show ? '0' : '30'}px))`
            };
        }
    },
    template: `
        <div class="z-40">
            <div
                class="fixed top-0 bottom-0 left-0 right-0 bg-black/60 transition-opacity duration-300 ease-in-out"
                :style="opacity"
            >
            </div>
            <div
                class="z-50 flex flex-col fixed left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%] rounded-lg sm:rounded-md bg-zinc-900 w-[500px] max-w-[85vw] p-6 sm:p-8 pt-10 sm:pt-8 transition-all duration-300 ease-in-out"
                :style="transform"
            >
                <h3 class="text-white text-[24px] font-bold pb-4 text-center sm:text-left">{{title}}</h3>
                <p class="text-md text-gray-400 text-center sm:text-left mb-7" v-html="description"></p>
                <div class="flex gap-2 w-full justify-end -mt-5">
                    <v-button
                        v-for="action in actions"
                        :icon="action.icon"
                        :title="action.title"
                        @click="action.handle"
                    ></v-button>
                </div>
            </div>
        </div>
    `
}
