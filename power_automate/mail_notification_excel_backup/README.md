# 專案進度填寫提醒與備份自動化

## 1. 專案簡介
專案進度填寫提醒與備份自動化，係透過 Power Automate 雲端流程串接 SharePoint、Outlook、Excel，降低人工提醒成本並確保每位填報者如期提交項目進度。

**附加價值**：提升部門內文書作業的內部管理與行政效率，減少填報遺漏與延誤風險。

**使用情境**：
- 每日定時檢核提交期限清單，並自動寄送排程電郵給管理者。
- 到期前 1~2 日自動寄送提醒電郵予填報者，協助遵守時程。
- 到期當日自動複製進度檔並標註提交日期，保留原始檔案版本。
- 在提醒電郵中同步提供檔案連結、分工項目與填報規範，確保填寫標準一致。
- 支援 Flow 管理者與共享者手動執行流程，用於測試或補執行當日未正常執行的狀況。

## 2. 自動化流程-使用指南 🎯
### ▶️ Flow 使用者
1. 開啟 Outlook 收取提醒電郵。
2. 依照電郵中提供的檔案連結與填報規範，進行進度填寫。[📧 mail01_通知提醒電郵.msg](./examples/sample_mail01_通知提醒電郵.msg)
3. 截止日前指定人須完成填寫，避免忘記未填問題。
### ▶️ Flow 管理者
1. 確認雲端版 Power Automate Flow 已成功匯入並啟用(Run)。
2. 確認 SharePoint 上 Excel 提交期限清單資料是否正確。[📗 excel01_deadline.xlsx](./examples/deadline.xlsx)
3. 必要時，可由 Flow 管理者或共享者手動執行流程進行測試或補執行。[📧 mail02_flow成功執行電郵.msg](./examples/sample_mail02_flow成功執行電郵.msg)

![rpa_04自動執行成功.JPG](./images/rpa_04自動執行成功.JPG)

## 3. 自動化流程-設計與實作開發 📲

### 3.1 開發 Flow

<details><summary>步驟 1. 開啟 Power Automate 建立新的 Flow 架構</summary>

![rpa_01-1設定flow.JPG](./images/rpa_01-1設定flow.JPG)
![rpa_01-2設定節點.JPG](./images/rpa_01-2設定節點.JPG)
</details>

<details><summary>步驟 2. 建立定時器、讀取並過濾 Excel 表格資料</summary>

> **節點 Recurrence:**
> - 時區請設定為 Taipei (UTC+08:00)，Start time 欄位實際仍以 UTC 時間表示，格式為 yyyy-MM-ddTHH:mm:ss.sssZ。Flow 執行時會依所選時區自動轉換。

![rpa_02-1定時器.JPG](./images/rpa_02-1定時器.JPG)

> **節點 List rows present in a table:**
> - xlsx 檔案必須在 SharePoint 的某一頻道。
> - xlsx 檔案的讀取範圍，必須完成「設定成表格」，並且該 Table 名稱不得重複，欄位名稱也不得重複。
> - 若有排序需求，建議在 xlsx 原始資料處理好，或於 Order By 鍵入，如 `due_date asc`。

![rpa_02-2讀取表格.JPG](./images/rpa_02-2讀取表格.JPG)

> **節點 Filter array:**
> - 判別日期範圍，可用 `formatDateTime(utcNow(), 'yyyy/MM/dd')`，但後面格式需與原資料格式相同。亦可使用 `addDays(utcNow(), 0, 'yyyy/MM/dd')`。

![rpa_02-3過濾日期範圍.JPG](./images/rpa_02-3過濾日期範圍.JPG)
</details>

<details><summary>步驟 3. 判斷日期資料是否為1~2日前或當天</summary>

> **節點 Condition:**
> - 計數轉型：判斷條件若要計數，要在外層括上 `int()`，如 `int(length(body('Filter_array')))`，透過強制轉型成整數的資料型別。
> - Run After 設定：Settings 要同時勾選「Is successful」及「Is skipped」這兩項，避免結果 False 發生中斷的情況。這裡是為了確保最終的「Flow 執行完畢」節點可被執行。
> - 多重判斷順序：使用左上的 And/Or，這裡是分成兩階段判斷，先判斷日期在 1~2 日內到期，再判斷是否為當天(如 `addDays(utcNow(), 0, 'yyyy/MM/dd')`)。
> - 判斷式設定時，選擇 Or 要注意最下方的空值 is equal to 空值，執行結果反而是 True，為微軟不合理的設計(bug)。建議改用 And 指定日期區間，用大小於包夾正確的日期範圍。
> - 想要使用大小於、等於對日期與時間進行比較的話，由於這裡無法像 SQL 讓 String 比大小，故強烈建議要搭配 tick()，將日期格式統一轉換成數值。(BTW 排查已執行 Flow 可能也看不出問題，因為目前這套雲端流程似乎會無法解析)

![rpa_02-4判斷日期資料有無.JPG](./images/rpa_02-4判斷日期資料有無.JPG)
![rpa_02-5定義判斷結果.JPG](./images/rpa_02-5定義判斷結果.JPG)
![rpa_02-6取得篩選結果.JPG](./images/rpa_02-6取得篩選結果.JPG)
![rpa_02-7判斷日期1-2日內.JPG](./images/rpa_02-7判斷日期1-2日內.JPG)
![rpa_02-8定義判斷日期1-2日內結果.JPG](./images/rpa_02-8定義判斷日期1-2日內結果.JPG)

> **節點 Compose:**
> - 這裡使用 `first()` 取出最小日期值，是基於節點 List rows present in a table 已依日期完成排序。

![rpa_03-1判斷當天日期.JPG](./images/rpa_03-1判斷當天日期.JPG)
</details>

<details><summary>步驟 4. 設定電郵主旨、內容、收件者</summary>

> **節點 Send an email (V2):**
> - Email Subject、Body 皆可使用前段節點的輸出變數。如 Compose 結果是 `outputs('Compose')?['weekno']`。
> - Email Body 編輯器操作不易，易發生跑版錯位，建議通篇先以純文字貼上，再逐步套用粗體、底色、超連結等格式。
> - 完整時戳設定函式是 `formatDateTime(addHours(utcNow(), 8), 'yyyy/MM/dd HH:mm:ss')`。

![rpa_02-9設定提醒電郵.JPG](./images/rpa_02-9設定提醒電郵.JPG)
![rpa_03-4設定排程電郵.JPG](./images/rpa_03-4設定排程電郵.JPG)
</details>

<details><summary>步驟 5. 建立 Excel 檔案的檢查與複製機制</summary>

> **節點 Get file content 與 Create file:**
> - 若要同時從 SharePoint 中複製檔案+重新命名(如檔名押上日期)，這兩個節點串接會是首推的建議組合。
> - 這兩個節點都有 SharePoint、OneDrive 版本，請選取 SharePoint 的節點。
> - Create file 的資料來源是在 File Content 設定，選取 File Content 即可。若選不到，請檢查前一節點 Get file content 設定 File Identifier。

![rpa_03-2複製檔案-取得內容.JPG](./images/rpa_03-2複製檔案-取得內容.JPG)
![rpa_03-3複製檔案-建立新檔.JPG](./images/rpa_03-3複製檔案-建立新檔.JPG)
</details>

### 3.2 匯出/匯入 Flow
<details><summary>如何在雲端流程匯出 Flow</summary>

![rpa_10-1匯出flow.JPG](./images/rpa_10-1匯出flow.JPG)
![rpa_10-2匯出flow細項設定.JPG](./images/rpa_10-2匯出flow細項設定.JPG)
![rpa_10-3取得zip檔案夾.JPG](./images/rpa_10-3取得zip檔案夾.JPG)
</details>

<details><summary>如何在雲端流程匯入 Flow</summary>

![rpa_11-1匯入flow.JPG](./images/rpa_11-1匯入flow.JPG)
![rpa_11-2匯入zip檔案夾.JPG](./images/rpa_11-2匯入zip檔案夾.JPG)
![rpa_11-3選取匯入flow讀取權限.JPG](./images/rpa_11-3選取匯入flow讀取權限.JPG)
![rpa_11-4指定完成flow讀取權限.JPG](./images/rpa_11-4指定完成flow讀取權限.JPG)
![rpa_11-5成功匯入flow.JPG](./images/rpa_11-5成功匯入flow.JPG)
![rpa_11-6成功匯入flow尚待啟用.JPG](./images/rpa_11-6成功匯入flow尚待啟用.JPG)
![rpa_04自動執行成功.JPG](./images/rpa_04自動執行成功.JPG)
</details>

## 4. Flow 架構與執行要點
```mermaid
flowchart TD
  A[開始] --> B[掃描deadline期限列表]
  B --> C{當天是否在當週期限3日以內？}
  C -->|提交日1~2日前| D[發送電郵_進度填寫提醒]
  C -->|當天是提交日| E[建立進度表的備份檔]
  C -->|其他| G[發送電郵_Flow成功執行]
  D --> G
  E --> G
```
#### **主要實作 & Flow 執行項目**
1. **定時觸發**：每日排程執行 Flow。
2. **檢核期限**：比對 SharePoint 或 Excel 中的提交期限清單。
3. **發送提醒**：依時程寄送提醒電郵給填報者，並包含必要連結與說明。
4. **異常處理**：若流程失敗或資料異常，通知管理者並記錄狀態。
5. **備份管理**：到期當日自動複製進度檔，並於檔名標註提交日期以保留版本。

## 5. 關鍵服務與實作資源

| 串接服務 | 基本設定/需求 | 備註 |
| --- | --- | --- |
| Power Automate | Power Automate (雲端版) 帳戶 | 雲端版可以 import/export Flow |
| SharePoint | 取得目錄、文件的路徑來源 | 必須是以「頻道」建立群組的檔案夾 (不是) |
| Outlook 帳戶 | 將自己的電郵網址設為電郵的「寄件者」 | 同微軟 AD 帳號，域名是公司或集團專屬的 |
| Excel 企業版 | Excel 檔案亦可從地端完整上載 | 如果是用 OneDrive 用戶，應另外購買企業方案。<br>檔案裡面必須有已設為表格的作為參照。<br>引用 xlsx 完整路徑長度有限制，否則會讀取失敗。 |

- 實作檔案(ZIP)：[可在 Power Automate 雲端匯入的 zip](./mail_notification_excel_backup_v1.zip)

