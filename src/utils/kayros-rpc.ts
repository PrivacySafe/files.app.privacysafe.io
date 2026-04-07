const KAYROS_APP_DOMAIN = 'kayros.app.provable.dev';
const KAYROS_SERVICE_NAME = 'KayrosNotary';

export interface UploadedFileMetadata {
  storageFileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  lastModified: number;
  uploadedAt: string;
}

export interface KayrosNotarizeStoredFileRequest {
  fullFilePath: string;
  metadataPayload: UploadedFileMetadata;
}

function serializeErrorDetails(err: unknown): string {
  if (err instanceof Error) {
    const extra = Object.entries(err as Error & Record<string, unknown>)
      .filter(([key]) => key !== 'message' && key !== 'stack' && key !== 'name')
      .reduce<Record<string, unknown>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    if (Object.keys(extra).length === 0) {
      return err.message;
    }

    return `${err.message} ${JSON.stringify(extra)}`;
  }

  if (typeof err === 'string') {
    return err;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function encodeJson(value: unknown): web3n.rpc.PassedDatum {
  return { bytes: new TextEncoder().encode(JSON.stringify(value ?? null)) };
}

function decodeJson<T>(datum: web3n.rpc.PassedDatum | undefined): T {
  if (!datum?.bytes) {
    return undefined as T;
  }

  return JSON.parse(new TextDecoder().decode(datum.bytes)) as T;
}

async function callKayros<TRequest, TResponse>(
  method: string,
  payload: TRequest,
  passedByReference?: unknown[],
): Promise<TResponse> {
  if (!w3n.rpc?.otherAppsRPC) {
    throw new Error('Kayros RPC capability is not available in Storage.');
  }

  let connection: web3n.rpc.client.RPCConnection | undefined;
  try {
    connection = await w3n.rpc.otherAppsRPC(KAYROS_APP_DOMAIN, KAYROS_SERVICE_NAME);
    const reply = await connection.makeRequestReplyCall(method, {
      ...encodeJson(payload),
      passedByReference,
    });
    return decodeJson<TResponse>(reply);
  } catch (err) {
    const detail = serializeErrorDetails(err);
    console.error('Kayros RPC call failed', {
      app: KAYROS_APP_DOMAIN,
      service: KAYROS_SERVICE_NAME,
      method,
      payload,
      error: err,
    });
    await w3n.log?.('error', `Kayros RPC call failed: ${method}`, {
      detail,
      payload,
    });
    throw new Error(detail);
  } finally {
    await connection?.close();
  }
}

export async function notarizeStoredFileWithKayros(
  request: KayrosNotarizeStoredFileRequest,
  file: web3n.files.WritableFile,
  fs: web3n.files.WritableFS,
): Promise<void> {
  await callKayros<KayrosNotarizeStoredFileRequest, void>(
    'notarizeStoredFile',
    request,
    [file, fs],
  );
}
