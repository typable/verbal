import {watch} from '/asset/lib/vue.min.js';
import {state} from '../main.js';
import {$lang} from '../utils.js';
import VButton from './button.js';

export default {
    props: ['station'],
    data() {
        return {
            state,
            synced: false,
            playing: false,
            loading: false,
            error: false
        };
    },
    components: {
        VButton
    },
    methods: {
        $lang,
        togglePlay(station) {
            if(this.synced) {
                state.app.$refs.player.setPlaying(!this.playing);
                return;
            }
            state.app.$refs.player.play(station);
        }
    },
    mounted() {
        watch([
            () => this.station,
            () => state.app.$refs.player.station,
            () => state.app.$refs.player.playing,
            () => state.app.$refs.player.loading,
            () => state.app.$refs.player.error
        ], ([station, value, playing, loading, error]) => {
            if(value === null || value?.id !== station?.id) {
                this.synced = false;
                this.playing = false;
                return;
            }
            this.synced = true;
            this.playing = playing;
            this.loading = loading;
            this.error = error;
        }, { immediate: true, deep: true });
    },
    template: `
        <v-button
            :icon="[ error ? 'alert-circle' : (loading ? 'rotate-clockwise' : (playing ? 'player-pause' : 'player-play')) ]"
            @click="() => togglePlay(station)"
            :text="$lang(loading ? 'player.loading' : (playing ? 'global.pause' : 'global.listen'))"
            class="bg-zinc-900 hover:bg-white px-1"
            :animation="[ error ? '' : (loading ? 'animate-spin' : '') ]"
            :active="synced"
        ></v-button>
    `
}
