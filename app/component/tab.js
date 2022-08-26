import {state} from '../main.js';

export default {
    props: ['id', 'tab'],
    watch: {
        tab: function(value) {
            this.$emit(value === this.id ? 'show' : 'hide');
        }
    },
    template: `
        <div class="flex flex-col gap-6 sm:gap-12 min-w-full overflow-y-auto">
            <slot></slot>
        </div>
    `
}
