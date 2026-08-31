import { createApp } from 'vue';
import { createPinia } from 'pinia';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { dialogs, vueBus, notifications, storeNotifications } from '@v1nt1248/3nclient-lib/plugins';
import i18n from '@/data/i18';
import '@v1nt1248/3nclient-lib/variables.css';
import '@v1nt1248/3nclient-lib/style.css';
import '@/assets/styles/main.css';

import App from '@picker/desktop/pages/app.vue';

import {
  createDialogRequestState,
  DIALOG_REQUEST_KEY,
} from '@picker/common/capability-bridge/dialog-request-bridge';
import { registerDialogCapabilities } from '@picker/common/dialog-capabilities/register-dialog-caps';
import { settleDialog } from '@picker/common/capability-bridge/settle-dialog';

import { initializationServices } from '@/services/services-provider'; // this part is under probation

const dialogRequest = createDialogRequestState();

// Registered synchronously, at module load...the window only exists because
// a capability call spawned it (forOneConnectionOnly), so handlers need to
// be live before anything else runs.
registerDialogCapabilities(dialogRequest);

initializationServices()
  .then(() => {
    const pinia = createPinia();
    const app = createApp(App);
    pinia.use(storeNotifications);

    app.config.compilerOptions.isCustomElement = tag => tag.startsWith('ui3n-');

    dayjs.extend(relativeTime);

    app.provide(DIALOG_REQUEST_KEY, dialogRequest);
    app.use(pinia).use(i18n).use(vueBus).use(dialogs).use(notifications).mount('#main-picker');
  })
  .catch(err => {
    console.error('🔥 ERROR CREATE FILE PICKER. ', err);
    dialogRequest.resolve?.(undefined);
    settleDialog(dialogRequest, undefined);
  });
