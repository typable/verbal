export default {
    props: ['id', 'tab'],
    watch: {
        tab: function(value) {
            this.$emit(value === this.id ? 'show' : 'hide');
        }
    },
    template: `
        <div v-if="id === tab" class="flex flex-col gap-6 sm:gap-12">
            <slot></slot>
        </div>
    `
}
