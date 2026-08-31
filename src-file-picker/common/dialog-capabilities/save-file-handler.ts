import type { DialogRequestState } from '@picker/common/types';
import { beginDialogRequest } from '@picker/common/capability-bridge/dialog-request-bridge';
/**
 * Factory for the saveFileDialog capability handler.
 * Signature per web3n.shell.files.SaveFileDialog:
 *   (title, btnLabel, defaultPath, filters?) => Promise<WritableFile | undefined>
 */
export function createSaveFileHandler(dialogRequest: DialogRequestState): web3n.shell.files.SaveFileDialog {
  return (title, btnLabel, defaultPath, filters) =>
    new Promise<web3n.files.WritableFile | undefined>(resolve => {
      beginDialogRequest(dialogRequest, 'saveFile', resolve, {
        title,
        btnLabel: btnLabel || 'Save',
        defaultPath,
        filters,
      });
    });
}
