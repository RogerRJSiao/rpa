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
