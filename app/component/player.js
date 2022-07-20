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
            title: '- No song title available -',
            interval: null,
            resume: false
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
                this.title = '- No song title available -';
                this.updateMediaSession();
            }
        }
    },
    methods: {
        $lang,
        async setLike(is_favorite) {
            try {
                await http`${is_favorite ? 'post' : 'delete'}::/api/like`(this.station.uuid);
                this.station.is_favorite = is_favorite;
                state.app.$refs.favorites.doFetch();
            }
            catch(error) {
                console.log(error);
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
        onError(event) {
            this.error = true;
            this.loading = false;
            this.playing = false;
        },
        updateMediaSession() {
            if('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: this.title,
                    artist: this.station.name,
                    artwork: [
                        { src: this.station.favicon, sizes: '96x96', type: 'image/jpg' },
                        { src: this.station.favicon, sizes: '128x128', type: 'image/jpg' },
                        { src: this.station.favicon, sizes: '192x192', type: 'image/jpg' },
                        { src: this.station.favicon, sizes: '256x256', type: 'image/jpg' },
                        { src: this.station.favicon, sizes: '384x384', type: 'image/jpg' },
                        { src: this.station.favicon, sizes: '512x512', type: 'image/jpg' }
                    ]
                });
            }
        },
        async fetchSong() {
            try {
                const song = await http`get::/api/song`({ url: this.station.stream_url });
                this.title = song === '' ? '- No song title available -' : song;
            }
            catch(err) {
                this.title = '- No song title available -';
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
    template: `
        <div class="sticky top-[98px] z-30">
            <div
                v-if="station"
                class="flex flex-col bg-black pb-6"
            >
                <audio
                    ref="player"
                    controls autoplay
                    :src="station.stream_url"
                    @loadeddata="onLoad"
                    @play="onPlay"
                    @pause="onPause"
                    @error="onError"
                    class="select-none pointer-events-none w-0 h-0 opacity-0"
                >
                    <source :src="station.stream_url" type="audio/mpeg">
                    <source :src="station.stream_url" type="audio/ogg">
                    <source :src="station.stream_url" type="audio/aac">
                </audio>
                <div class="p-5 bg-zinc-800 rounded-xl flex gap-5 items-center relative overflow-hidden shadow-2xl z-30">
                    <img
                        v-if="station.favicon"
                        :src="station.favicon"
                        :alt="station.name"
                        :class="{ 'animate-pulse': playing }"
                        class="w-full h-full object-cover absolute top-0 left-0 right-0 bottom-0 blur-2xl opacity-30 z-0 pointer-events-none select-none"
                    >
                    <div class="w-[64px] h-[64px] min-w-[64px] bg-zinc-900 rounded-lg overflow-hidden z-10">
                        <img
                            v-if="station.favicon"
                            :src="station.favicon"
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
                        class="flex flex-col flex-1 z-10 min-w-0 cursor-pointer"
                    >
                        <p class="text-xl font-semibold text-white pb-1 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none">
                            {{station.name}}
                        </p>
                        <p class="text-md text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none">
                            {{title ?? $lang('player.loading')}}
                        </p>
                    </div>
                    <div class="inline-flex gap-4 z-10 pr-2">
                        <v-button
                            :icon="[ station.is_favorite ? 'heart-off' : 'heart' ]"
                            :title="[ $lang(station.is_favorite ? 'global.unlike' : 'global.like') ]"
                            :active="station.is_favorite"
                            class="bg-zinc-900 hover:bg-white focus:ring-[6px] ring-white/10"
                            @click="setLike(!station.is_favorite)"
                        ></v-button>
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
            <div class="bg-gradient-to-b from-black h-2 sm:h-4"></div>
        </div>
    `
}
