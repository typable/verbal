export default {
    props: ['id', 'tab'],
    template: `
        <div v-if="id === tab" class="flex flex-col gap-6 sm:gap-12">
            <slot></slot>
        </div>
    `
}
