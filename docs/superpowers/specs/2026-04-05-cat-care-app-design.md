# Cat Care Tracker — Design Spec

## Overview

一個可愛風格嘅養貓記錄 PWA，幫新手貓奴記錄日常照顧、健康追蹤、開支管理。可安裝落手機主畫面當 native app 用。

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + 可愛/卡通主題
- **State:** Zustand (local state) + React Query (server state)
- **Backend:** Supabase (Auth, Database, Storage, Realtime)
- **PWA:** vite-plugin-pwa (離線支援、可安裝)
- **Charts:** Recharts (體重趨勢、開支統計)
- **Date:** date-fns
- **Deploy:** GitHub Pages 或 Vercel

## Data Model (Supabase)

### cat_profile
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| name | text | 貓咪名 |
| breed | text | 品種 |
| gender | text | 性別 |
| birthday | date | 出生日期（估算都得） |
| adopted_date | date | 領養 / 到家日期 |
| avatar_url | text | 大頭照 (Supabase Storage) |
| color | text | 毛色 |
| microchip_id | text | 晶片號碼 |
| notes | text | 備註 |

### feeding_log
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| fed_at | timestamptz | 餵食時間 |
| food_type | text | 乾糧 / 濕糧 / 零食 / 其他 |
| food_brand | text | 品牌 |
| amount_g | numeric | 份量 (克) |
| notes | text | |

### weight_log
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| measured_at | date | 量度日期 |
| weight_kg | numeric | 體重 (kg) |
| notes | text | |

### vet_record
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| visit_date | date | 睇醫生日期 |
| vet_name | text | 診所名 |
| reason | text | 原因（年檢、打針、病咗等） |
| diagnosis | text | 診斷 |
| treatment | text | 治療 |
| cost | numeric | 費用 |
| next_visit_date | date | 下次覆診日期 |
| notes | text | |

### reminder
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| type | text | vaccine / deworming / vet_visit / custom |
| title | text | 提醒標題 |
| due_date | date | 到期日 |
| is_done | boolean | 已完成？ |
| recurrence_days | int | 重複間隔（日），null = 一次性 |
| notes | text | |

### mood_log
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| logged_at | timestamptz | 記錄時間 |
| mood | text | happy / playful / sleepy / anxious / sick / angry |
| energy_level | int | 1-5 |
| note | text | |

### milestone
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| date | date | 日期 |
| title | text | 里程碑標題 |
| description | text | 描述 |
| photo_url | text | 相片 |

### photo
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| url | text | Supabase Storage URL |
| caption | text | 描述 |
| taken_at | timestamptz | 拍攝時間 |
| tags | text[] | 標籤 |

### expense
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| cat_id | uuid FK | |
| date | date | 日期 |
| category | text | food / medical / toy / grooming / other |
| amount | numeric | 金額 (HKD) |
| description | text | 描述 |

## Pages & Features

### 1. Dashboard（首頁）
- 貓咪大頭照 + 名 + 年齡（X歲Y月 + 人類換算年齡）
- 今日餵食狀態（食咗幾餐）
- 最近體重 + 趨勢箭頭（升/跌/持平）
- 即將到期嘅提醒（疫苗、驅蟲、覆診）
- 今日心情
- 新手貼士卡片（「第 X 日養貓小知識」，頭 30 日每日一條）

### 2. 餵食記錄
- 快速記錄按鈕（常用食物一鍵記錄）
- 餵食歷史 timeline
- 每日 / 每週進食量統計

### 3. 體重追蹤
- 輸入體重
- 趨勢折線圖（Recharts）
- 健康體重範圍參考線

### 4. 健康 & 醫療
- 睇醫生記錄列表
- 疫苗 / 驅蟲時間表（預設模板 + 自訂）
- 提醒管理（到期前首頁顯示警示）

### 5. 心情日記
- Emoji 選擇器（6 種心情 + 活力等級）
- 每日 timeline
- 月曆 heatmap 顯示心情趨勢

### 6. 里程碑
- 時間線展示重要時刻
- 支持上傳相片
- 預設里程碑建議（第一次用貓砂、第一次剪指甲等）

### 7. 相簿
- Grid / masonry 排列
- 按日期 / 標籤篩選
- 上傳至 Supabase Storage

### 8. 開支記錄
- 新增開支（分類 + 金額）
- 月度 / 年度統計圓餅圖
- 分類排行

### 9. 貓咪檔案
- 基本資料編輯
- 大頭照上傳
- 晶片號碼、品種、毛色等

### 10. 新手指南
- 頭 30 日每日養貓貼士
- 常見問題 FAQ
- 新貓到家 checklist（買貓砂盤、指定食物、藏好電線等）

## UI / UX 設計原則

- **可愛卡通風格**：圓角卡片、柔和粉色/奶油色調、貓爪圖案點綴
- **底部 Tab Navigation**：Dashboard / 餵食 / 健康 / 相簿 / 更多
- **Mobile-first**：手機優先設計，desktop 都要 responsive
- **快速操作**：首頁一鍵餵食記錄、快速記體重
- **Emoji 大量使用**：心情選擇、分類圖標

## 色彩方案

- Primary: `#F4A9C0` (粉紅)
- Secondary: `#FFF5E6` (奶油色)
- Accent: `#7EC8C8` (薄荷綠)
- Text: `#4A4A4A` (深灰)
- Background: `#FFFAF5` (暖白)
- Success: `#8BC34A`
- Warning: `#FFB74D`
- Danger: `#E57373`

## 目錄結構

```
Cat/
├── public/
│   ├── icons/              # PWA icons
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ui/             # 通用 UI 組件 (Button, Card, Modal, etc.)
│   │   ├── layout/         # Layout 組件 (TabBar, Header)
│   │   ├── dashboard/      # Dashboard 相關組件
│   │   ├── feeding/        # 餵食相關組件
│   │   ├── health/         # 健康醫療組件
│   │   ├── mood/           # 心情日記組件
│   │   ├── milestone/      # 里程碑組件
│   │   ├── photo/          # 相簿組件
│   │   ├── expense/        # 開支組件
│   │   └── guide/          # 新手指南組件
│   ├── pages/              # 頁面組件
│   ├── hooks/              # Custom hooks
│   ├── stores/             # Zustand stores
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── utils.ts        # 工具函數
│   ├── data/
│   │   ├── tips.ts         # 新手貼士數據
│   │   ├── vaccine-schedule.ts  # 疫苗模板
│   │   └── milestones.ts   # 預設里程碑
│   ├── types/              # TypeScript 類型
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/         # SQL migrations
├── docs/
│   └── superpowers/
│       └── specs/
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Authentication

- Supabase Auth（Email + Password）
- 簡單登入/註冊流程
- Row Level Security (RLS) 確保每個用戶只睇到自己嘅數據

## PWA 配置

- Service worker 快取靜態資源
- 離線時可瀏覽已快取嘅數據
- 可安裝至手機主畫面
- App icon 用可愛貓咪圖案

## Routing

使用 React Router v7：
- `/` — Dashboard
- `/feeding` — 餵食記錄
- `/weight` — 體重追蹤
- `/health` — 健康醫療
- `/mood` — 心情日記
- `/milestones` — 里程碑
- `/photos` — 相簿
- `/expenses` — 開支記錄
- `/profile` — 貓咪檔案
- `/guide` — 新手指南
- `/login` — 登入
- `/signup` — 註冊
