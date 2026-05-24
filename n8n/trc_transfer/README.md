# n8n - 台鐵時刻表查詢與搭乘規劃

## 1. 專案概述

本專案針對台灣鐵路公司山線與海線交會路段，利用現行時刻表進行資料查詢、比對與搭乘規劃。

**專案目標**：透過 n8n 地端自動化流程，整理直達與轉乘列車的最新資訊，補足台鐵官網時刻表查詢的不足。專案重點在於整合跨路線時刻資料，根據起迄站簡化複雜路線排點，輸出適合一般乘客參考的山海線搭乘與轉乘方案。

![台鐵時刻表查詢與搭乘規劃v1](../images/n8n_台鐵山海線搭乘規劃v1.png)

![台鐵時刻表查詢與搭乘規劃v1](../images/n8n_台鐵山海線搭乘規劃v1_output.png)

## 2. 設計概念

- **網頁爬蟲資料擷取**：使用爬蟲取得最新時刻表資料，確保規劃依據為最新營運資訊。
- **單點故障快速定位**：流程設計具備錯誤監控與節點檢測機制，若 RPA 發生單點故障，可迅速定位問題來源。
- **JS 資料清洗與比對**：使用 JavaScript 進行時刻表與站間關係的資料清洗，讓系統更準確理解站別間的轉乘邏輯。

## 3. 系統架構與資料流程

1. 輸入基本條件：以表單方式收集搭乘日期、轉乘站、起站、迄站等資訊，提供自動化查詢所需資料。
2. 輸入驗證與日期處理：使用 `On form submission` 節點取得時戳，轉換為 `Asia/Taipei` 時區，並以時間比較及數字轉換檢查搭乘日與班次時間的合法性。
3. 來源擷取：從指定資料來源讀取 TRC 檔案內容，或透過台鐵 API / HTTP request 查詢站別時刻表。
4. 資料解析：將取得的 HTML / 原始資料解析成可處理的中間格式（例如 JSON），並補上行駛方向、無座票標記等欄位。
5. 資料清洗與合併：使用 `Filter`、`Sort`、`Remove Duplicates`、`Merge` 等節點進行欄位標準化、空值處理、重複資料移除與多來源合併。
6. 轉檔處理：依需求進行欄位轉換、欄位重命名與資料格式轉換，並維持後續 `Convert to File` 所需的 JSON 欄位順序。
7. 同步控制與檔案下載：利用 `Merge` 節點確保跨來源資料全部到達後再輸出 CSV，並以起站、迄站、轉乘站、搭乘日與下載時戳建立檔名。
8. 結果輸出：將結果匯出至指定儲存位置或推送至下游系統。

## 4. 資料清洗條件與規則 (TBC)

- 資料清洗通常包含以下步驟：
    1. 表單欄位驗證
        - 起站與迄站不可相同。
        - 預計搭乘日為必填，且可查詢日期限制為過去 7 天內，且不超過未來 3 個月。
- 欄位標準化：統一欄位名稱與格式，避免上下游欄位對應錯誤。
- 空值處理：對必要欄位補植預設值或移除不完整資料。
- 格式校正：統一轉換日期、數值與字串格式。
- 重複資料檢查：移除重複資料，確保轉檔後結果正確。

## 5. 實作 RPA 重點技術

### 5-1. 日期與時區應用
- 使用 `On form submission` 節點產生的時戳，透過 `.setZone('Asia/Taipei')` 轉換成台灣時區，並以 `.plus()` / `.minus()` 計算動態時間範圍。
    ```n8n
    {{ DateTime.fromISO($json["submittedAt"]).setZone('Asia/Taipei').minus({ days: 7 }) }}
    ```

    ![On form submission](../images/n8n_台鐵山海線_01_form.png)

- 比較時間大小的方式：可直接使用 `hh:MM` 格式搭配 `is after` / `is before`，也可將時間強制轉成數字，再以 `is greater than` / `is less than` 判斷。
    - 例如：```{{ Number($json.transfer_time.replace(':', '')) }}```

### 5-2. 網頁爬蟲
- 取得站別時刻表的 API 與網址格式：輸入下方網址可取得順行與逆行完整表格資訊，適用於 HTTP request 節點的 GET 請求，參數為搭乘日 `yyyy/MM/dd` 與站別代號-名稱。
   ```n8n
   https://www.railway.gov.tw/tra-tip-web/tip/tip001/tip112/querybystationblank?rideDate={{ DateTime.fromISO($json["預計搭乘日"]).toFormat('yyyy/MM/dd') }}&station={{ $json["開始"] }}
   ```
- 正確解析 HTML 並儲存成 JSON：使用 Code 節點將原始欄位（車種車次、出發時間、終點站、設施服務、狀態）轉成 JSON，並補上行駛方向與無座票資訊。
    ```JS
    direction: direction,                                                   // 順行、逆行
    train_no: trainNo,                                                      // 車種車次
    departure_station: $('On form submission').first().json["開始"],        // 開車車站
    departure_time: (actualDataTds[0] || "").replace(/^00:/, "24:"),        // 開車時間 (00:20 轉 24:20)
    destination_station: actualDataTds[1] ? `往:${actualDataTds[1]}` : "",  // 到達站
    service: actualDataTds[2].replace(/[\r\n\t]+/g, " ").trim() || "",      // 服務設施
    // status: actualDataTds[actualDataTds.length - 1] || ""                // 狀態
    seat: /自強\(3000\)|普悠瑪|太魯閣/.test(trainNo) ? "▲ reserved" : ""     // 不售無座
    ```

    ![爬蟲技術01](../images/n8n_台鐵山海線_02-1_webcrawling.png)
    ![爬蟲技術02](../images/n8n_台鐵山海線_02-2_webcrawling.png)
    ![爬蟲技術03](../images/n8n_台鐵山海線_02-3_webcrawling.png)
    ![爬蟲技術04](../images/n8n_台鐵山海線_02-4_webcrawling.png)
    ![爬蟲技術05](../images/n8n_台鐵山海線_03-1_datacleaning.png)

### 5-3. 資料整理與格式化
- 清洗資料並調整欄位順序：後續 `Convert to File` 節點會直接將 JSON 轉成 CSV。清洗時務必要維持欄位格式與欄位順序與 JSON key 一致。
    ```JS
    json: {
        "direction": item.json.direction,
        "train_no": trainNo,
        "destination_station": item.json.destination_station,
        "service": item.json.service,
        // "status": item.json.status,
        // 串接起始站資料（若查無則留白）
        "start_station": matchedStart ? matchedStart.departure_station : "",
        "start_time": matchedStart ? matchedStart.departure_time : "",
        // 轉乘站
        "transfer_station": item.json.departure_station,
        "transfer_time": item.json.departure_time,
        // 抵達站在此階段留白
        "arrival_station": "",
        "arrival_time": "",
        "seat": item.json.seat
      }
    ```
- 常用資料清洗節點：
    - `Filter`：保留符合條件的資料。
    - `Sort`：依指定 key 進行多欄排序。
    - `Remove Duplicates`：移除重複資料列。
    - `Merge`：將多個來源 JSON 合併成單一輸出。
    - `Code`：撰寫 JS 腳本處理更複雜的 JSON 轉換。
        - 範例 1：[解析站別時刻 HTML 文本](js/parse_trc_HTML.js)
        - 範例 2：[比對兩站的列車時刻內容](js/clean_trc_raw_data.js)
        - 範例 3：[確認站別與列車方向關聯](js/check_trc_direction.js)
        - 備註：Docker 環境下 Python 3 使用受限，待確認。

### 5-4. 同步/非同步處理與檔案下載
- 連續串聯多個 `HTTP request` 節點可能造成記憶體不足或讀取異常，並影響執行效率。因此建議將爬蟲節點改為並聯，最後再用 `Merge` 節點合併輸出。
- 確認交叉比對資料的取得時機：若 JS 中調用尚未完成的前置節點，可能產生 `undefined` 錯誤。建議搭配 `Merge` 節點，強制等待所有輸入節點完成後再執行後續邏輯。
    - 不合併資料時使用 Choose Branch 並勾選 `Wait for all Inputs to Arrive`。
    - 合併資料時使用 Append。前者的 `Use Data of Input` 僅會選取輸出資料，實際 item 數量仍依後續節點呼叫的資料集 / 變數為準。

- 下載檔案命名規則：輸出 CSV 檔案時，名稱標示起站、迄站、轉乘站、預計搭乘日與下載時間，方便使用者快速辨識與管理檔案。
    ```n8n
    臺鐵時刻表{{ $('輸入資料完整？').first().json['預計搭乘日'] }}_{{ $('輸入資料完整？').first().json['開始'].split('-')[1] }}到{{ $('輸入資料完整？').first().json['抵達'].split('-')[1] }}_{{ $('輸入資料完整？').first().json['轉乘站'].split('-')[1] }}轉乘_{{ $now.setZone('Asia/Taipei').format('yyyyMMdd_HHmmss') }}.csv
    ```

## 6. 後續擴充建議

- 加入通知機制：當流程失敗或完成時發送通知。
- 強化驗證規則：對輸入資料進行更嚴格的內容檢核。
