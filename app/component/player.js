import {state} from '../main.js';
import {http, $lang} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';

export default {
    props: ['station'],
    data() {
        return {
            playing: false,
            loading: false,
            error: false,
            title: null,
            interval: null,
            resume: false,
            state
        };
    },
    components: {
        VButton,
        VIcon
    },
    watch: {
        station: function(station) {
            this.playing = false;
            this.error = false;
            if(station !== null) {
                this.loading = true;
                this.title = null;
                this.updateMediaSession();
                state.open = true;
            }
        }
    },
    methods: {
        $lang,
        setPlaying(playing) {
            if(this.error || this.loading) {
                return;
            }
            this.playing = playing;
            this.$refs.player[this.playing ? 'play' : 'pause']();
            if(this.playing) {
                this.playing = false;
                this.loading = true;
                this.$refs.player.load();
            }
        },
        setVolume(event) {
            this.$refs.player.volume = event.target.value;
        },
        onPlay() {
            if(this.resume) {
                this.playing = false;
                this.loading = true;
                this.$refs.player.load();
            }
        },
        onPause() {
            this.playing = false;
            this.resume = true;
        },
        onLoad() {
            this.loading = false;
            this.playing = true;
            this.resume = false;
            this.updateSong();
        },
        onError() {
            this.error = true;
            this.loading = false;
            this.playing = false;
        },
        updateMediaSession() {
            if('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: this.title ?? $lang('player.no-song-title'),
                    artist: this.station.name,
                    artwork: [
                        { src: this.station.icon, sizes: '96x96', type: 'image/jpg' },
                        { src: this.station.icon, sizes: '128x128', type: 'image/jpg' },
                        { src: this.station.icon, sizes: '192x192', type: 'image/jpg' },
                        { src: this.station.icon, sizes: '256x256', type: 'image/jpg' },
                        { src: this.station.icon, sizes: '384x384', type: 'image/jpg' },
                        { src: this.station.icon, sizes: '512x512', type: 'image/jpg' }
                    ]
                });
            }
        },
        async fetchSong() {
            try {
                const song = await http`get::/api/song`(this.station);
                this.title = song === '' ? null : song;
            }
            catch(err) {
                console.error(err);
                clearInterval(this.interval);
                this.title = null;
            }
            this.updateMediaSession();
        },
        updateSong() {
            this.fetchSong();
            clearInterval(this.interval);
            this.interval = setInterval(async () => {
                if(!this.playing) {
                    clearInterval(this.interval);
                    return;
                }
                await this.fetchSong();
            }, 10000);
        }
    },
    computed: {
        transform() {
            return {
                'transform': `translate(0, ${state.open ? 0 : 100}vh)`
            };
        },
        opacity() {
            return {
                'opacity': `${state.open ? 1 : 0}`,
                'pointer-events': `${state.open ? 'all' : 'none'}`
            };
        }
    },
    template: `
        <div class="z-30">
            <div
                @click="state.open = false"
                class="fixed top-0 bottom-0 left-0 right-0 bg-black/60 transition-opacity duration-300 ease-in-out"
                :style="opacity"
            >
            </div>
            <div
                v-if="station"
                ref="button"
                class="fixed w-[64px] h-[64px] bg-white rounded-full bottom-4 right-4 z-40 cursor-pointer shadow-xl"
                @click="state.open = !state.open"
            >
                <v-icon
                    id="playlist"
                    class="pointer-events-none"
                >
                </v-icon>
            </div>
            <div
                class="w-full flex flex-col bg-zinc-800 pb-6 rounded-t-2xl fixed left-0 right-0 bottom-0 px-4 pt-4 h-[70vh] transition-transform duration-300 ease-in-out"
                :style="transform"
            >
                <div class="w-[40px] h-[8px] bg-zinc-500 rounded-[4px] mx-auto mb-12"></div>
                <audio
                    v-if="station"
                    ref="player"
                    controls autoplay
                    :src="station.url"
                    @loadeddata="onLoad"
                    @play="onPlay"
                    @pause="onPause"
                    @error="onError"
                    class="select-none pointer-events-none w-0 h-0 opacity-0"
                >
                    <source :src="station.url" type="audio/mpeg">
                    <source :src="station.url" type="audio/ogg">
                    <source :src="station.url" type="audio/aac">
                </audio>
                <div v-if="station" class="flex gap-5 items-center relative flex-col sm:flex-row">
                    <div class="w-[140px] h-[140px] min-w-[140px] bg-zinc-900 rounded-lg overflow-hidden z-10">
                        <img
                            v-if="station.icon"
                            :src="station.icon"
                            :alt="station.name"
                            class="w-full h-full object-contain select-none"
                        >
                        <v-icon
                            v-else
                            id="access-point"
                            size="38px"
                            class="text-gray-400"
                        ></v-icon>
                    </div>
                    <div
                        class="flex flex-col flex-1 z-10 min-w-0 max-w-full"
                    >
                        <p class="text-xl font-semibold text-white pb-1 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none text-center sm:text-left">
                            {{station.name}}
                        </p>
                        <p class="text-md text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none text-center sm:text-left">
                            {{title ?? $lang('player.no-song-title')}}
                        </p>
                    </div>
                    <div class="inline-flex gap-4 z-10 pr-2">
                        <input type="range" min="0" max="1" step="0.05" @change="setVolume">
                        <v-button
                            :icon="[ error ? 'alert-circle' : (loading ? 'rotate-clockwise' : (playing ? 'player-pause' : 'player-play')) ]"
                            :title="[ error ? $lang('global.error') : (playing ? $lang('global.pause') : $lang('global.play')) ]"
                            :animation="[ error ? '' : (loading ? 'animate-spin' : '') ]"
                            class="bg-zinc-900 hover:bg-white focus:ring-[6px] ring-white/10"
                            @click="setPlaying(!playing)"
                        ></v-button>
                    </div>
                </div>
            </div>
        </div>
    `
}
