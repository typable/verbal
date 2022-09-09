import {state, SWIPE_THRESHOLD} from '../main.js';
import {http, $lang} from '../utils.js';
import VButton from '../element/button.js';
import VIcon from '../element/icon.js';
import VImage from '../element/image.js';

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
            open: false,
            tooLong: false,
            animationDuration: null,
            state
        };
    },
    components: {
        VButton,
        VIcon,
        VImage
    },
    watch: {
        async title(value) {
            await this.$nextTick();
            const outer = this.$refs.songtitle;
            const inner = outer.querySelector('span');
            this.tooLong = outer.clientWidth - 12 < inner.clientWidth;
            this.animationDuration = `${Math.max(Math.abs(outer.clientWidth - 12 - inner.clientWidth) * 70, 2500)}ms`;
        }
    },
    methods: {
        $lang,
        play(station) {
            if(this.station?.id === station?.id) {
                return;
            }
            this.station = station;
            this.playing = false;
            this.error = false;
            if(this.station !== null) {
                this.loading = true;
                this.title = null;
                this.updateMediaSession();
            }
        },
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
        },
        async showDetail(station) {
            await state.app.$refs.detail.show(station);
            this.open = false;
        },
        onTouchStart(event) {
            this.touch = event.changedTouches[0];
            this.target = event.target;
        },
        onTouchEnd(event) {
            const touch = event.changedTouches[0];
            const diff = {
                x: touch.pageX - this.touch.pageX,
                y: touch.pageY - this.touch.pageY
            };
            const angle = Math.atan(diff.x / diff.y) * (180 / Math.PI);
            const index = state.tabs.indexOf(state.tab);
            if(this.open) {
                if(Math.abs(diff.y) >= SWIPE_THRESHOLD) {
                    if(diff.y > 0 && angle >= -30 && angle <= 30) {
                        this.open = false;
                    }
                }
                return;
            }
            if(Math.abs(diff.y) >= SWIPE_THRESHOLD) {
                if(Math.abs(diff.y) >= SWIPE_THRESHOLD) {
                    if(!this.open && this.target === this.$refs.button?.$refs.image) {
                        if(diff.y < 0 && angle >= -30 && angle <= 30) {
                            this.open = true;
                        }
                    }
                }
            }
        }
    },
    created() {
        document.body.addEventListener('touchstart', this.onTouchStart);
        document.body.addEventListener('touchend', this.onTouchEnd);
    },
    onUnmounted() {
        document.body.removeEventListener('touchstart', this.onTouchStart);
        document.body.removeEventListener('touchend', this.onTouchEnd);
    },
    computed: {
        opacity() {
            return {
                'opacity': `${this.open === true ? 1 : 0}`,
                'pointer-events': `${this.open === true ? 'all' : 'none'}`
            };
        }
    },
    template: `
        <div class="z-50">
            <div
                @click="open = false"
                class="fixed top-0 bottom-0 left-0 right-0 bg-black/60 transition-modal"
                :style="opacity"
            >
            </div>
            <div
                ref="modal"
                class="w-full mx-auto flex flex-col bg-black fixed left-0 right-0 top-[100vh] h-[100vh] px-4 sm:px-10 transition-modal"
                :class="{ 'modal-active': open }"
            >
                <div class="w-full flex flex-col max-w-[1200px] mx-auto">
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
                    <div class="w-full h-[98px] py-6 flex gap-4 justify-between">
                        <v-button
                            icon="chevron-down"
                            @click="open = false"
                        ></v-button>
                        <v-button
                            icon="cast"
                        ></v-button>
                    </div>
                    <div  class="flex gap-8 items-center flex-col">
                        <v-image
                            :station="station"
                            ref="button"
                            class="h-[75vw] max-h-[400px] aspect-square rounded-lg z-10 fixed right-[50%] translate-x-[50%] translate-y-[100%] bottom-[calc(100vh-98px-32px)] transition-modal"
                            :class="{ 'slide-active': !open, 'slide-hidden': !station }"
                            @click="open = true"
                        >
                        </v-image>
                        <div class="h-[75vw] max-h-[400px] mt-[32px]"></div>
                        <div
                            v-if="station"
                            class="flex flex-col flex-1 z-10 min-w-0 w-[75vw] max-w-[400px] transition-modal"
                            :style="opacity"
                        >
                            <p
                                class="text-xl font-semibold text-white pb-2 overflow-hidden text-ellipsis whitespace-nowrap text-center cursor-pointer"
                                @click="showDetail(station)"
                            >
                                {{station.name}}
                            </p>
                            <p ref="songtitle" class="songtitle text-md text-gray-400 overflow-hidden whitespace-nowrap relative px-2" :class="{'text-center': !tooLong, 'text-animate': tooLong}">
                                <span class="inline-block" :style="{'animation-duration': animationDuration}">{{title ?? $lang('player.no-song-title')}}</span>
                            </p>
                        </div>
                        <div class="inline-flex flex-col gap-6 z-10 pr-2 items-center">
                            <v-button
                                :icon="[ error ? 'alert-circle' : (loading ? 'rotate-clockwise' : (playing ? 'player-pause' : 'player-play')) ]"
                                :title="[ error ? $lang('global.error') : (playing ? $lang('global.pause') : $lang('global.play')) ]"
                                size="28px"
                                :animation="[ error ? '' : (loading ? 'animate-spin' : '') ]"
                                class="bg-zinc-900 hover:bg-white focus:ring-[6px] ring-white/10 !min-w-[64px] !min-h-[64px]"
                                @click="setPlaying(!playing)"
                            ></v-button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                @input="setVolume"
                                class="w-[200px]"
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
