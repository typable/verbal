export default {
    props: ['id', 'size', 'classes'],
    computed: {
        styles() {
            return {
                '-webkit-mask': `url(https://cdn.typable.dev/tabler/${this.id})`,
                'mask-repeat': 'no-repeat',
                'mask-position': 'center',
                'mask-size': this.size ?? ''
            };
        }
    },
    template: `
        <div
            :style="styles"
            class="min-w-[50px] h-full group-hover:bg-gray-700 transition-colors"
            :class="classes"
        ></div>
    `
}
