import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  dialogs,
  i18n,
  I18nOptions,
  notifications,
  storeVueBus,
  storeI18n,
  storeNotifications,
  vueBus,
} from '@v1nt1248/3nclient-lib/plugins';
import { piniaRouter } from '@/plugins/pinia-router';
import { initializationServices } from '@/services/services-provider';

import App from '@/views/app.vue';

import '@v1nt1248/3nclient-lib/variables.css';
import '@v1nt1248/3nclient-lib/style.css';
import '@/assets/styles/main.css';

import en from './data/i18/en.json';

const init = () => {
  initializationServices().then(() => {
    const pinia = createPinia();
    pinia.use(piniaRouter);
    pinia.use(storeVueBus);
    pinia.use(storeI18n);
    pinia.use(storeNotifications);

    const app = createApp(App);

    app.config.globalProperties.$router = router;
    // app.config.globalProperties.$store = store
    app.config.compilerOptions.isCustomElement = tag => {
      return tag.startsWith('ui3n-');
    };

    dayjs.extend(relativeTime);

    app
      .use(pinia)
      .use<I18nOptions>(i18n, { lang: 'en', messages: { en } })
      .use(vueBus)
      .use(dialogs)
      .use(notifications)
      .use(router)
      .mount('#main');
  });
};

init();
