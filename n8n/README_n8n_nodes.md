## 常用的 n8n 節點與相關設定

### 基本功能
- expression：用大括號 `{{ }}` 框起來，括號內的動態變數、運算子能被執行。

### 常見格式
- JSON：以 key - value 組成，是 n8n 常用的資料傳遞格式。API 通常會提供這個格式。
- Excel

### 流程控制的節點
| 節點名稱 | 使用說明 | 備註 |
| -- | -- | -- |
| `Filter` | 按照條件，將資料集分成 Kept 和 Discarded 兩個子集，只輸出符合條件的資料。 | 原有欄位架構不變。 |
| `If` | 按照條件，將資料集分成 True Branch 和 False Branch 兩個子集，同時輸出兩種資料。 | 原有欄位架構不變。|
| `Switch` | 按照多個條件，將資料集分成多個子集，同時輸出這些資料。<br>注意：強烈建議加上 Fallback Output 的 Extra Output，在下方的 Add option 可使用，避免部分資料從中意外脫落。| 原有欄位架構不變。善用 Rename 可修改輸出子集的名稱。|
| `Edit Fields` | 留下指定欄位資料，也能重新命名欄位名稱。常用於整個 RPA 流程的最後輸出節點之前。| 欄位架構將改變。|

### 網路爬蟲
> 請注意！不是所有放在網路上的資料都能爬取，可能涉及侵權行為。<br>
> 範例 1：YouBike2.0 公共自行車即時資訊 [臺北市](https://data.gov.tw/dataset/137993)、[新北市](https://data.gov.tw/dataset/146969)、[臺中市](https://data.gov.tw/dataset/136781)。<br>
> 範例 2：臺灣證券交易所 OpenAPI [股價資訊](https://openapi.twse.com.tw/)。<br>
> 範例 3：[中央氣象局](https://opendata.cwa.gov.tw/index) <== 需要註冊，取得 API key。<br>
> 範例 4：[批踢踢實業坊](https://www.ptt.cc/bbs/Stock/index.html) <== 無 API。<br>
 
| 節點名稱 | 使用說明 | 備註 |
| -- | -- | -- |
| `HTTP` | 根據 API 取得原始資料。<br>Query Parameters 可自定義，把 URL 的查詢字串 (?key1=value1) 拆解出來當作變數帶入。 | 根據原始資料結構，建立欄位。 |
| `Trigger manually` | 手動觸發 | |
| `On a schedule` | 排程觸發。<br>n8n 服務不中止：1. Server 和 Docker 不關閉。2. 該流程必須 Publish。<br>調整時區：在 n8n 介面對個別流程設定 'Asia Taipei'，或在 docker run 的參數加上時區 `-e GENERIC_TIMEZONE="Asia/Taipei"`。| 初期設計時，通常不會用這個節點。 |
| `HTML` | 透過 CSS selector，取得 HTML 腳本指定資料，包括 Text (標籤內的文字內容)、HTML、Attribute (標籤屬性值)、value (表單欄位的值)。如在  CSS selector 寫上 `.r-ent .title a` 取出 Attribute，Return Array。 | 根據原始資料結構，建立欄位。產出 1 個 item。 |
| `Split out` | 將 HTML 爬蟲資料，由 1 item 拆成多個 item。| 維持原本欄位結構。 |

### Google Workspace 自動化
> 學習重點
> 1. 用 ngrok 把內部服務，設定公開對外網址。
> 2. 設定 Google 授權，啟用 API 服務。
> 3. 建立 n8n 節點，測試自動化工作項。
> - 目的：把本機執行的 n8n 服務 (`localhost:5678`)，透過 ngrok 建立的外部網址 (如 `https://abc123.ngrok-free.dev`) 對外公開。<br>

**A. 自建對外 n8n 服務**
1. 註冊並登錄 ngrok 帳號。https://ngrok.com/ 
2. 在 ngrok 取得 ngrok 固定網址、ngrok Authtoken，
3. 設定本地的環境變數。(依據 OS 種類、n8n 安裝方式，可參考 https://ngrok-gen.cann.workers.dev/)
4. 開啟一個 cmd，啟動 n8n 服務。
5. 開啟另一個新的 cmd，安裝並啟動 ngrok 主程式。(可能優化成一支小程式，一鍵執行)
6. 輸入 ngrok 固定網址到網址列，可看到 n8n 服務。

     > **NGROK** (ngrok 免費版提供 20k HTTP/HTTPS 的請求服務。(開發/測試階段專用))<br> 
     > 
     > **案例 1 - n8n 內部服務對外公開**
     > - Request：使用者在瀏覽器輸入 ngrok 外部網址發出 HTTP Request → 先送達 ngrok 雲端的 Edge Server → 透過事先建立好的 Tunnel (本機 ngrok agent 主動建立的持久連線) 反向轉發給本機的 ngrok agent → agent 再將 Request 轉發至本機的 n8n 服務。
     > - Response：n8n 處理該 Request 並產生 Response → 依原路徑回傳回應 (由 n8n → ngrok agent → Tunnel → ngrok Edge Server → 最終送達使用者瀏覽器)。
     >
     > 
     > **案例 2 - LINE 即時問答式聊天機器人**
     > 1. 運作原理：LINE Bot Webhook 指向 ngrok 給的 HTTPS 網址，請求先送達 ngrok 雲端伺服器，再透過本機事先建立好的 Tunnel 轉發給本機的 ngrok agent，agent 接著把請求導向本機執行的後端程式，再呼叫 LINE 的 Reply API，帶入該次 webhook 事件附帶的 replyToken + 回覆內容，直接送達使用者的 LINE App。
     > 2. 限制：webhook 進來後先驗證簽章才處理。後端程式需在 2 秒內回覆 HTTP 200。replyToken 只能用一次，有時效性。
     > 3. 收費：Reply API 是機器人針對使用者傳來的訊息進行的自動回覆，屬於「不列入計價的訊息」。只有 Push API 機器人在任何時間點主動對好友發送訊息，才會被算進每月的訊息額度、產生費用。

**B. 串接 Google 服務** ([操作步驟](https://5xcampus.notion.site/Google-185df074dc7f809c9762ffd042ac67d3)、[線上學習](https://youtu.be/wX6ZMZ-xwd0?si=DHox-h6MifH2AvWk))
1. 新增一個 Google Cloud 新的專案。[Google Cloud Console](https://cloud.google.com/cloud-console)
2. 在這個雲端專案，啟用 Google 的 API 服務 (如 Gmail、Drive、Calendar、Sheets)。
3. 設定「OAuth」(電子郵件、外部、聯絡資訊、同意服務政策)。
4. 開啟 n8n 畫面，(左導覽列上方) 取得 Gmail 重新導向 URI 的 Credential。
5. 回到 Google 專案，建立「OAuth 用戶端」(網頁應用程式、貼上從 n8n 取得的 New Credentials)，取得 API 服務的 Client ID、Client Secret (只能取得一次，高機密性)。
6. 再回到 n8n 畫面，貼上 Client ID、Client Secret，連線 API 成功是「已封鎖存取權...」。
7. 回到 Google 專案，在設定「目標對象」頁面，完成「發布應用程式」。
8. 再回到 n8n 畫面，點擊 `Sign in with Google` (點擊進階 + 勾選存取範圍)。

    > 實際運作：WEB A 服務 -> Gmail 登入 -> 跳出登入 Gmail 視窗 -> OAuth 授權成功 -> 已授權的重新導向 URI (WEB A)。
