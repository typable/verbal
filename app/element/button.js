import VIcon from './icon.js';

const TYPES = {};

export default {
    props: ['text', 'icon', 'title', 'active', 'animation', 'size', 'disabled'],
    emits: ['click'],
    components: {
        VIcon
    },
    template: `
        <button
            @click="$emit('click')"
            :title="title"
            :class="{ 'bg-zinc-900': active, '!bg-inherit pointer-events-none': disabled }"
            class="group min-w-[50px] h-[50px] hover:bg-white rounded-full inline-flex justify-center items-center cursor-pointer transition-colors outline-none"
        >
            <v-icon
                v-if="icon"
                :id="icon"
                :size="size"
                :class="[ active ? 'text-gray-100' : 'text-gray-400', text ? 'group-hover:text-gray-700' : '', animation, text ? 'min-w-[50px]' : 'w-full', disabled ? '!text-gray-700' : '' ]"
                class="hover:text-gray-800"
            ></v-icon>
            <slot v-else></slot>
            <p
                v-if="text"
                :class="[ active ? 'text-gray-100' : 'text-gray-400' ]"
                class="group-hover:text-gray-800 transition-colors -ml-[6px] pr-4 font-medium overflow-hidden text-ellipsis whitespace-nowrap"
            >
                {{text}}
            </p>
        </button>
    `
}
