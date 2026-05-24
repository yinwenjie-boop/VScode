# 把英语作文练习打包成 Android APK

工程已经用 Capacitor 配好了。你有 **两条路** 拿到 APK,选一条做。

---

## 路线 A:云端构建(推荐,零本地安装)

不用装 Android Studio、不用装 JDK。把代码推到 GitHub,GitHub Actions 自动帮你编 APK 下载。

### 步骤

1. 在 GitHub 新建一个仓库(私有公开都行),不用初始化任何文件。
2. 在本目录(`essay-app/`)打开 PowerShell:

   ```powershell
   git init
   git add .
   git commit -m "init essay app"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

3. 推送完成后,打开 GitHub 仓库页 → **Actions** 选项卡 → 看到 `Build Android APK` 工作流,等 3~5 分钟跑完。
4. 跑完后点进这次运行,页面底部 **Artifacts** 区有 `essay-app-debug-apk`,下载下来解压,里面就是 `app-debug.apk`。
5. 把 APK 通过微信/QQ/USB/邮件发到手机,点开安装(需要在手机「设置 → 安全」里允许「安装未知来源应用」)。

工作流文件已经在 `.github/workflows/build-apk.yml`,你不用改。

---

## 路线 B:本地构建(需要装 Android Studio)

适合以后频繁改代码 + 出包。

### 一次性环境准备

1. 下载安装 **Android Studio**:https://developer.android.com/studio
   安装时按默认选项,它会自动帮你下载 JDK 17 + Android SDK + 模拟器。
2. 安装完打开一次 Android Studio,让它跑完首次 SDK 下载(约 2~3GB)。
3. 设置环境变量(PowerShell 管理员):

   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
   ```

   重启 PowerShell 窗口让变量生效。

### 出 APK

每次想出包,在 `essay-app/` 目录跑:

```powershell
pnpm android:apk
```

它会:`pnpm build` → `cap sync` → 用 gradle 编出 debug APK。

产物路径:`android/app/build/outputs/apk/debug/app-debug.apk`

把它发到手机安装即可。

### 想用 Android Studio 图形界面

```powershell
pnpm android:open
```

会自动打开 Android Studio,等它索引完点 **Build → Build App Bundle(s) / APK(s) → Build APK(s)**。

---

## 改代码后重新出包

```powershell
pnpm android:sync     # 把最新前端代码同步进 android/
```

然后:
- 路线 A:`git push` 一下,Actions 自动重新构建。
- 路线 B:`pnpm android:apk`。

---

## 安装到手机时的注意事项

- APK 是 **debug 包(未签名)**,可以直接装,也能用,但 Google Play 上架需要 release 签名包,这里不需要。
- 第一次装会提示「未知来源」,在手机「设置 → 安全 → 安装未知应用」里允许浏览器/文件管理器即可。
- 应用数据(写过的作文)存在手机 IndexedDB,卸载 APK 会一起清掉,所以重要内容自己备份。
- 完全离线运行,不需要联网。

---

## 常见问题

**Q: 推 GitHub 之后 Actions 没跑?**
A: 检查仓库 Settings → Actions → General,确认 Actions 已启用。或者点 Actions 选项卡里的 `Build Android APK` → 右上角 `Run workflow` 手动触发。

**Q: 装 APK 提示「解析包时出错」?**
A: 多半是下载坏了,重新从 Artifacts 下载一次。或者手机太老(Android 6 以下),Capacitor 8 要求最低 Android 7。

**Q: 应用图标想换?**
A: 替换 `android/app/src/main/res/mipmap-*/` 下的 PNG,或在 Android Studio 里 New → Image Asset 用图形界面替换。
