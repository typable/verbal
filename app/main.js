import VMenu from './component/menu.js';
import VSearch from './page/search.js';
import VFavorites from './page/favorites.js';
import VAccount from './page/account.js';

export const state = {
    locale: 'en',
    tab: 'search',
    station: {
        name: 'Liquid Trap',
        favicon: 'https://cdn-images.audioaddict.com/6/b/5/b/d/6/6b5bd66a99e46fa1258cb565d988ea7c.jpg'
    }
};

new Vue({
    el: '#app',
    data: {
        state
    },
    components: {
        VMenu,
        VSearch,
        VFavorites,
        VAccount
    },
    mounted() {
        document.body.style.display = '';
    },
    template: `
        <div class="px-4 sm:px-10 pb-8 sm:pb-[100px] max-w-[800px] mx-auto flex flex-col">
            <v-menu :state="state"></v-menu>
            <v-search :state="state"></v-search>
            <v-favorites :state="state"></v-favorites>
            <v-account :state="state"></v-account>
        </div>
    `
});
