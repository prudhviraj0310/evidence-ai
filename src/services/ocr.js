import Tesseract from 'tesseract.js';

let worker = null;

async function getWorker() {
  if (!worker) {
    worker = await Tesseract.createWorker('eng');
  }
  return worker;
}

/**
 * Run OCR on an image file — returns extracted text
 */
export async function extractText(imageFile) {
  const w = await getWorker();
  const imageUrl = URL.createObjectURL(imageFile);
  try {
    const { data } = await w.recognize(imageUrl);
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words?.length || 0,
      lines: data.lines?.length || 0,
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Check if file is an image that can be OCR'd
 */
export function isOcrCompatible(file) {
  return file.type.startsWith('image/');
}
