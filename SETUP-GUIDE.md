# 🎵 高中音樂學習網 — 架設完整教學

## 📁 網站結構

```
music-site/
├── index.html                    ← 首頁
├── assets/
│   ├── css/shared.css            ← 共用樣式
│   └── js/shared.js              ← AI助手 + Firebase + 共用函式
├── history/
│   ├── index.html                ← 音樂史首頁
│   ├── western-music.html        ← 西洋音樂史
│   ├── world-music.html          ← 世界音樂
│   ├── taiwan-indigenous.html    ← 台灣原住民音樂
│   ├── taiwan-music.html         ← 戲曲與台灣音樂史
│   ├── chinese-music.html        ← 中國音樂史
│   ├── chinese-instruments.html  ← 中國樂器概論
│   └── teacher-resources.html   ← 音樂史教師資料庫
├── theory/
│   ├── index.html                ← 樂理首頁
│   ├── basic-notes.html          ← 基礎音名
│   ├── intervals-scales.html     ← 音程與音階
│   ├── chords-tonality.html      ← 和弦與調性
│   ├── transposing.html          ← 移調樂器
│   ├── signs-terms.html          ← 記號與術語
│   └── teacher-resources.html   ← 樂理教師資料庫
└── .github/workflows/deploy.yml  ← 自動部署
```

---

## 🚀 STEP 1：建立 GitHub 儲存庫

1. 到 [github.com](https://github.com) 登入帳號
2. 點右上角 **+** → **New repository**
3. Repository name：`music-site`（或自訂）
4. 選 **Public**（GitHub Pages 免費方案需要公開）
5. **不要**勾選 Add README
6. 按 **Create repository**

---

## 🚀 STEP 2：上傳網站檔案

### 方法A：網頁直接上傳（最簡單）
1. 進入你建立的儲存庫
2. 點 **Add file** → **Upload files**
3. 把整個 `music-site` 資料夾的內容（包含 `index.html`、`assets/`、`history/`、`theory/` 等）拖進去
4. Commit message 寫「初始上傳」
5. 按 **Commit changes**

### 方法B：用 Git 指令（進階）
```bash
cd music-site
git init
git add .
git commit -m "初始上傳"
git branch -M main
git remote add origin https://github.com/你的帳號/music-site.git
git push -u origin main
```

---

## 🚀 STEP 3：開啟 GitHub Pages

1. 進入儲存庫 → 點 **Settings**（齒輪圖示）
2. 左側選單找 **Pages**
3. Source 選 **GitHub Actions**
4. 等待約 2 分鐘，頁面會顯示：
   `Your site is live at https://你的帳號.github.io/music-site/`

✅ **之後每次修改檔案 push 到 main，網站會自動更新！**

---

## 🔥 STEP 4：設定 Firebase（進度追蹤 + 資料庫）

### 4-1. 建立 Firebase 專案
1. 到 [console.firebase.google.com](https://console.firebase.google.com)
2. 點 **建立專案** → 輸入名稱（如 `music-site-db`）
3. 可以關閉 Google Analytics（不需要）
4. 等待建立完成

### 4-2. 開啟 Authentication（Google 登入）
1. 左側選 **Authentication** → **Sign-in method**
2. 點 **Google** → 開啟 → 輸入專案公開名稱 → 儲存

### 4-3. 建立 Firestore 資料庫
1. 左側選 **Firestore Database** → **建立資料庫**
2. 選 **以正式版模式開始**
3. 地區選 **asia-east1（台灣）**
4. 按 **完成**

### 4-4. 設定 Storage（存上傳的講義）
1. 左側選 **Storage** → **開始使用**
2. 選正式版規則 → 完成

### 4-5. 取得 Firebase 設定碼
1. 左側齒輪 → **專案設定**
2. 下方 **您的應用程式** → 點 **</>** 網頁圖示
3. 應用程式暱稱輸入 `music-web` → **註冊應用程式**
4. 複製 `firebaseConfig` 物件的內容（apiKey, authDomain 等）

### 4-6. 填入設定碼
打開 `assets/js/shared.js`，找到這段，把內容換掉：
```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",           // ← 填入你的
  authDomain: "music-site-db.firebaseapp.com",
  projectId: "music-site-db",
  storageBucket: "music-site-db.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

### 4-7. 設定 Firestore 安全規則
在 Firebase Console → Firestore → **規則**，貼上：
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 學習進度：本人可讀寫
    match /progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // 教師資料：登入者可讀，只有教師可寫
    match /resources/{resId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email in ['teacher@school.edu.tw'];
    }
  }
}
```

---

## 🤖 STEP 5：設定 AI 助手（Claude API）

1. 到 [console.anthropic.com](https://console.anthropic.com) 申請帳號
2. 建立 API Key（複製保存）
3. 打開 `assets/js/shared.js`，找到：
```javascript
const ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY";
```
換成你的金鑰

> ⚠️ **注意**：API Key 放在前端會被看到。建議：
> - 學校內網使用：直接放前端即可
> - 公開網站：需要建立一個後端 Proxy（可用 Cloudflare Workers，免費）

---

## 👩‍🏫 STEP 6：設定教師帳號

打開 `history/teacher-resources.html` 和 `theory/teacher-resources.html`，找到：
```javascript
const TEACHER_EMAILS = [
  "teacher@school.edu.tw",   // ← 改成老師的 Gmail
  "music@school.edu.tw"
];
```
換成老師的真實 Gmail 帳號。

---

## 📤 上傳教學資料（教師操作）

1. 用教師 Gmail 登入網站（右上角登入）
2. 進入任一「教師資料庫」頁面
3. 頂部出現綠色教師工具列
4. 點「＋ 上傳新資料」
5. 填寫標題、分類、說明
6. 選擇檔案（PDF/Word/圖片）或貼上連結
7. 按「上傳資料」

學生重新整理頁面後就能看到新資料 ✅

---

## 🔄 日常更新流程

修改任何 HTML 檔案後：
```bash
git add .
git commit -m "更新內容"
git push
```
→ 網站約 1 分鐘後自動更新

---

## ❓ 常見問題

**Q: 網站打開是空白的？**
A: 確認 GitHub Pages 有開啟，等待首次部署完成（約 3-5 分鐘）

**Q: AI 助手沒反應？**
A: 確認 ANTHROPIC_API_KEY 已填入，且帳號有足夠額度

**Q: Firebase 進度沒儲存？**
A: 確認 FIREBASE_CONFIG 已填入，且 Authentication 有開啟 Google 登入

**Q: 教師看不到上傳按鈕？**
A: 確認 TEACHER_EMAILS 中有填入正確的 Gmail，且已用該帳號登入
