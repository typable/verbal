import VIcon from './icon.js';

export default {
    props: ['station'],
    components: {
        VIcon,
    },
    methods: {
        getIcon(station) {
            return station.is_icon ? `/media/${station.id}.jpg` : station.icon;
        },
    },
    template: `
        <div
            ref="image"
            class="bg-zinc-900 rounded-md overflow-hidden"
            @click="$emit('click')"
        >
            <img
                v-if="station?.icon"
                :alt="station?.name"
                :src="getIcon(station)"
                @error="() => station.icon = null"
                class="w-full h-full object-contain select-none pointer-events-none"
            >
            <v-icon
                v-else
                id="access-point"
                size="32px"
                class="text-gray-400 select-none pointer-events-none"
            ></v-icon>
        </div>
    `
}
