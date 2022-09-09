import {state} from '../main.js';

export default {
    props: ['id', 'tab'],
    data() {
        return {
            state
        };
    },
    watch: {
        tab: function(value) {
            this.$emit(value === this.id ? 'show' : 'hide');
        }
    },
    template: `
        <div v-if="state.tab === id" class="flex flex-col gap-6 sm:gap-12 min-w-full">
            <slot></slot>
        </div>
    `
}
