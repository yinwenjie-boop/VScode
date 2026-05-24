import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.essayapp.english',
  appName: '英语作文练习',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
