import type { DialogRequestState } from '@picker/common/types';
import { createOpenFileHandler } from './open-file-handler';
import { createSaveFileHandler } from './save-file-handler';
// import { createOpenFolderHandler } from './open-folder-handler'; // future
// import { createSaveFolderHandler } from './save-folder-handler'; // future

/**
 * Registers every fileDialog capability this app implements against the
 * running system. Must be called synchronously, before Vue mounts...the
 * window only exists because a capability call spawned it
 * (forOneConnectionOnly), so handlers need to be live before anything else runs.
 *
 * Adding a new dialog capability (e.g. saveFolderDialog) only means adding
 * a line here + a new handler file.
 */
export function registerDialogCapabilities(dialogRequest: DialogRequestState) {
  w3n.rpc!.provideCAPtoSystem!('w3n.shell.fileDialogs.openFileDialog', createOpenFileHandler(dialogRequest));

  w3n.rpc!.provideCAPtoSystem!('w3n.shell.fileDialogs.saveFileDialog', createSaveFileHandler(dialogRequest));
}
