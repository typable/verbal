import VStation from './station.js';
import VButton from '../element/button.js';

export default {
    props: ['title', 'items'],
    data() {
        return {
            index: 0,
            length: null,
            size: null,
            count: null
        };
    },
    components: {
        VStation,
        VButton
    },
    methods: {
        calc() {
            const items = this.$refs.list.querySelectorAll('li');
            this.length = items.length;
            if(this.length > 0) {
                this.size = items[1].offsetLeft;
                this.count = Math.ceil(this.$refs.list.clientWidth / this.size);
            }
        },
        prev() {
            this.calc();
            if(this.index === 0) {
                return;
            }
            if(this.index - this.count < 0) {
                this.index = 0;
                return;
            }
            this.index -= this.count;
        },
        next() {
            this.calc();
            if(this.index === this.length - this.count - 1) {
                return;
            }
            if(this.index + this.count > this.length - this.count) {
                this.index = this.length - this.count;
                return;
            }
            this.index += this.count;
        },
        onResize() {
            this.calc();
            this.index = 0;
        }
    },
    created() {
        window.addEventListener('resize', this.onResize);
    },
    destroyed() {
        window.removeEventListener('resize', this.onResize);
    },
    computed: {
        transform() {
            return {
                'transform': `translate(${this.index * -this.size}px, 0)`,
                'transition': `transform ease-in-out 300ms`
            };
        },
        hasPrev() {
            if(this.length === null) {
                return false;
            }
            return this.index > 0;
        },
        hasNext() {
            if(this.length === null) {
                return true;
            }
            return this.index < this.length - this.count - 1;
        }
    },
    template: `
        <div>
            <div class="flex items-center pt-4 sm:pt-0 pb-5">
                <h3 class="flex-1 text-white text-[24px] font-bold">{{title}}</h3>
                <v-button
                    icon="chevron-left"
                    class="hidden sm:block w-[44px] min-w-[44px] h-[44px]"
                    @click="prev()"
                    :disabled="!hasPrev"
                ></v-button>
                <v-button
                    icon="chevron-right"
                    class="hidden sm:block w-[44px] min-w-[44px] h-[44px]"
                    @click="next()"
                    :disabled="!hasNext"
                ></v-button>
            </div>
            <div class="relative sm:overflow-x-hidden">
                <ul
                    ref="list"
                    class="flex overflow-x-auto sm:overflow-x-visible max-w-full snap-x snap-mandatory gap-4 lg:gap-6 scroll-hidden transition-transform"
                    :style="transform"
                >
                    <li
                        :key="item.id"
                        v-for="item in items"
                        class="snap-start min-w-[calc(33.333%-(1rem/3*2))] sm:min-w-[calc(25%-(1rem/4*3))] md:min-w-[calc(20%-(1rem/5*4))] lg:min-w-[calc(16.666%-(1.5rem/6*5))]"
                    >
                        <v-station :station="item" type="grid"></v-station>
                    </li>
                </ul>
            </div>
        </div>
    `
}
