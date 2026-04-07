import {
  notarizeStoredFileWithKayros,
  type KayrosNotarizeStoredFileRequest,
  type UploadedFileMetadata,
} from '@/utils/kayros-rpc';

export async function notarizeUploadedFileWithKayros({
  fs,
  file,
  fullFilePath,
  uploadedFile,
  fileId,
  byteLength,
}: {
  fs: web3n.files.WritableFS;
  file: web3n.files.WritableFile;
  fullFilePath: string;
  uploadedFile: File;
  fileId: string;
  byteLength: number;
}): Promise<void> {
  const metadataPayload: UploadedFileMetadata = {
    storageFileId: fileId,
    originalName: uploadedFile.name,
    mimeType: uploadedFile.type || 'application/octet-stream',
    size: byteLength,
    lastModified: uploadedFile.lastModified,
    uploadedAt: new Date().toISOString(),
  };

  const request: KayrosNotarizeStoredFileRequest = {
    fullFilePath,
    metadataPayload,
  };

  await notarizeStoredFileWithKayros(request, file, fs);
}
