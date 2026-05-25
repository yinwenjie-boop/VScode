// 语音识别：优先用 Capacitor 原生插件（Android 系统识别），
// 在浏览器开发环境下回落到 Web Speech API。
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

const LANG = 'en-US'

export interface SpeechHandle {
  stop: () => Promise<void>
}

export type PartialHandler = (text: string, isFinal: boolean) => void

function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function ensurePermission(): Promise<boolean> {
  if (!isNative()) return true
  const avail = await SpeechRecognition.available()
  if (!avail.available) return false
  const perm = await SpeechRecognition.checkPermissions()
  if (perm.speechRecognition === 'granted') return true
  const req = await SpeechRecognition.requestPermissions()
  return req.speechRecognition === 'granted'
}

export async function isAvailable(): Promise<boolean> {
  if (isNative()) {
    try {
      const a = await SpeechRecognition.available()
      return a.available
    } catch {
      return false
    }
  }
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

/**
 * 开始持续监听，分段返回识别结果。
 * onPartial(text, false) — 还在说，UI 用该文本覆盖显示当前段；
 * onPartial(text, true)  — 这段说完了，调用方应当把该段固化（追加到正文）。
 */
export async function startListening(onPartial: PartialHandler): Promise<SpeechHandle> {
  if (isNative()) {
    let stopped = false
    let lastPartial = ''

    const partialSub = await SpeechRecognition.addListener(
      'partialResults',
      (data: { matches?: string[] }) => {
        const text = (data?.matches?.[0] || '').trim()
        if (!text) return
        lastPartial = text
        onPartial(text, false)
      },
    )

    // Android 原生识别会因静默自动停止，监听到 stopped 后把当前段固化并重启，
    // 让外部看起来像可以一直说。
    const stateSub = await SpeechRecognition.addListener(
      'listeningState',
      async (data: { status: 'started' | 'stopped' }) => {
        if (data.status === 'stopped' && !stopped) {
          if (lastPartial) {
            onPartial(lastPartial, true)
            lastPartial = ''
          }
          restart()
        }
      },
    )

    const restart = async () => {
      if (stopped) return
      try {
        await SpeechRecognition.start({
          language: LANG,
          partialResults: true,
          popup: false,
        })
      } catch {
        if (!stopped) setTimeout(restart, 400)
      }
    }

    await restart()

    return {
      stop: async () => {
        stopped = true
        try {
          await SpeechRecognition.stop()
        } catch {
          // 忽略
        }
        if (lastPartial) {
          onPartial(lastPartial, true)
          lastPartial = ''
        }
        await partialSub.remove()
        await stateSub.remove()
      },
    }
  }

  // Web Speech API 回落
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) throw new Error('当前浏览器不支持语音识别')
  const rec = new Ctor()
  rec.lang = LANG
  rec.continuous = true
  rec.interimResults = true
  let stopped = false
  rec.onresult = (ev: SpeechRecognitionEvent) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i]
      const text = (r[0]?.transcript || '').trim()
      if (!text) continue
      onPartial(text, !!r.isFinal)
    }
  }
  rec.onend = () => {
    if (!stopped) {
      try {
        rec.start()
      } catch {
        // 忽略
      }
    }
  }
  rec.start()
  return {
    stop: async () => {
      stopped = true
      try {
        rec.stop()
      } catch {
        // 忽略
      }
    },
  }
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [i: number]: { isFinal: boolean; 0: { transcript: string } }
  }
}
