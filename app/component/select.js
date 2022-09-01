import VIcon from '../element/icon.js';

export default {
    props: ['id', 'value'],
    components: {
        VIcon,
    },
    methods: {
        onChange(event) {
            this.$emit('input', this.value);
            this.$emit('change', this.value);
        }
    },
    template: `
        <div class="relative w-full">
            <select
                v-model="value"
                :id="id"
                autocomplete="off"
                @change="onChange"
                class="rounded-md w-full h-[52px] px-4 text-md bg-zinc-900 text-white outline-none appearance-none cursor-pointer pr-[52px]"
            >
                <slot></slot>
            </select>
            <div class="absolute top-0 right-0 w-[52px] h-[52px] select-none pointer-events-none">
                <v-icon id="chevron-down" class="text-white"></v-icon>
            </div>
        </div>
    `
}
