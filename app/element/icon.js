export default {
    props: ['id', 'size'],
    computed: {
        classes() {
            return [
                `ti-${this.id}`,
            ];
        },
        styles() {
            return {
                'font-size': `${this.size ?? '24px'}`
            };
        }
    },
    template: `
        <div
            class="ti min-w-[50px] h-full transition-colors relative before:absolute before:top-[50%] before:left-[50%] before:-translate-x-1/2 before:-translate-y-[55%]"
            :class="classes"
            :style="styles"
        ></div>
    `
}
