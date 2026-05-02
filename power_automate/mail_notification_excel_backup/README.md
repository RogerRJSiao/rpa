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

## 3. 自動化流程-設計與實作開發 📲

### 3.1 參考圖檔
以下為流程設計與設定相關畫面：
- [rpa_01-1設定flow.JPG](./images/rpa_01-1設定flow.JPG)
- [rpa_01-2設定節點.JPG](./images/rpa_01-2設定節點.JPG)
- [rpa_02-1定時器.JPG](./images/rpa_02-1定時器.JPG)
- [rpa_02-2讀取表格.JPG](./images/rpa_02-2讀取表格.JPG)
- [rpa_02-3過濾日期範圍.JPG](./images/rpa_02-3過濾日期範圍.JPG)
- [rpa_02-4判斷日期資料有無.JPG](./images/rpa_02-4判斷日期資料有無.JPG)
- [rpa_02-5定義判斷結果.JPG](./images/rpa_02-5定義判斷結果.JPG)
- [rpa_02-6取得篩選結果.JPG](./images/rpa_02-6取得篩選結果.JPG)
- [rpa_02-7判斷日期1-2日內.JPG](./images/rpa_02-7判斷日期1-2日內.JPG)
- [rpa_02-8定義判斷日期1-2日內結果.JPG](./images/rpa_02-8定義判斷日期1-2日內結果.JPG)
- [rpa_02-9設定提醒電郵.JPG](./images/rpa_02-9設定提醒電郵.JPG)
- [rpa_03-1判斷當天日期.JPG](./images/rpa_03-1判斷當天日期.JPG)
- [rpa_03-2複製檔案-取得內容.JPG](./images/rpa_03-2複製檔案-取得內容.JPG)
- [rpa_03-3複製檔案-建立新檔.JPG](./images/rpa_03-3複製檔案-建立新檔.JPG)
- [rpa_03-4設定排程電郵.JPG](./images/rpa_03-4設定排程電郵.JPG)
- [rpa_04自動執行成功.JPG](./images/rpa_04自動執行成功.JPG)
- [rpa_10-1匯出flow.JPG](./images/rpa_10-1匯出flow.JPG)
- [rpa_10-2匯出flow細項設定.JPG](./images/rpa_10-2匯出flow細項設定.JPG)
- [rpa_10-3取得zip檔案夾.JPG](./images/rpa_10-3取得zip檔案夾.JPG)
- [rpa_11-1匯入flow.JPG](./images/rpa_11-1匯入flow.JPG)
- [rpa_11-2匯入zip檔案夾.JPG](./images/rpa_11-2匯入zip檔案夾.JPG)
- [rpa_11-3選取匯入flow讀取權限.JPG](./images/rpa_11-3選取匯入flow讀取權限.JPG)
- [rpa_11-4指定完成flow讀取權限.JPG](./images/rpa_11-4指定完成flow讀取權限.JPG)
- [rpa_11-5成功匯入flow.JPG](./images/rpa_11-5成功匯入flow.JPG)
- [rpa_11-6成功匯入flow尚待啟用.JPG](./images/rpa_11-6成功匯入flow尚待啟用.JPG)

### 3.2 自動化流程概述
1. 定時觸發：每日排程執行 Flow。
2. 檢核期限：比對 SharePoint 或 Excel 中的提交期限清單。
3. 發送提醒：依時程寄送提醒電郵給填報者，並包含必要連結與說明。
4. 異常處理：若流程失敗或資料異常，通知管理者並記錄狀態。
5. 備份管理：到期當日自動複製進度檔，並於檔名標註提交日期以保留版本。

## 5. 關鍵服務與實作資源

| 串接服務 | 基本設定/需求 | 備註 |
| --- | --- | --- |
| Power Automate | Power Automate (雲端版) 帳戶 | 雲端版可以 import/export Flow |
| SharePoint | 取得目錄、文件的路徑來源 | 必須是以「頻道」建立群組的檔案夾 (不是) |
| Outlook 帳戶 | 將自己的電郵網址設為電郵的「寄件者」 | 同微軟 AD 帳號，域名是公司或集團專屬的 |
| Excel 企業版 | Excel 檔案亦可從地端完整上載 | 如果是用 OneDrive 用戶，應另外購買企業方案。<br>檔案裡面必須有已設為表格的作為參照。<br>引用 xlsx 完整路徑長度有限制，否則會讀取失敗。 |

- 實作檔案(ZIP)：[可在 Power Automate 雲端匯入的 zip](./mail_notification_excel_backup_v1.zip)

