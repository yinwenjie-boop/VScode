// 用 tesseract.js 做本地 OCR。仅识别英文（eng），语言包从 jsDelivr CDN 拉取，
// 首次使用会下载 ~10MB，之后会被浏览器/WebView 缓存。
import Tesseract from 'tesseract.js'

export interface OcrProgress {
  status: string
  progress: number
}

export async function recognizeImage(
  file: File | Blob,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress) onProgress({ status: m.status, progress: m.progress })
    },
  })
  return (data.text || '').trim()
}
