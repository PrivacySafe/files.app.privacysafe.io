import * as pdfjs from 'pdfjs-dist';

export async function createPdfThumbnail(byteArray: Uint8Array, targetSize: number): Promise<string> {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

  const pdf = await pdfjs.getDocument(byteArray).promise;
  const page1 = await pdf.getPage(1);
  let viewport = page1.getViewport({ scale: 1 });
  viewport = page1.getViewport({ scale: targetSize / viewport.width });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  await page1.render({
    canvasContext: ctx,
    viewport,
  }).promise;
  return canvas.toDataURL();
}
