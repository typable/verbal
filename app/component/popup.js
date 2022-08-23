import {$lang} from '../utils.js';
import VButton from '../element/button.js';

export default {
    props: ['title', 'description', 'actions'],
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
            this.$refs.dialog.show();
        },
        close() {
            this.title = null;
            this.description = null;
            this.actions = null;
            this.$refs.dialog.close();
        }
    },
    mounted() {
        this.close();
    },
    template: `
        <dialog ref="dialog" class="z-40 fixed w-full h-full bg-black/80">
            <div class="flex flex-col fixed left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%] rounded-md bg-zinc-900 w-[500px] p-8">
                <h3 class="text-white text-[24px] font-bold pb-4">{{title}}</h3>
                <p class="text-md text-gray-400">{{description}}</p>
                <v-button
                    v-for="action in actions"
                    :icon="action.icon"
                    :title="action.title"
                    class="self-end"
                    @click="action.handle"
                ></v-button>
            </div>
        </dialog>
    `
}
