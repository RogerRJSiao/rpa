# n8n - 台鐵時刻表查詢與搭乘規劃

## 1. 專案概述

本專案針對台灣鐵路公司山線與海線交會路段，利用現行時刻表進行資料查詢比對、乘車規劃。

**專案目標**：透過 n8n (地端)自動化流程，整理直達、轉乘列車的最新資訊，補足台鐵官網提供的時刻表查詢不足。專案重點在於整合跨路線的時刻資料，根據起迄站簡化複雜路線排點閱讀，輸出便於一般民眾參考的山海線搭乘、轉乘方式。

## 2. 設計概念

- **網頁爬蟲資料擷取**：使用爬蟲技術取得最新時刻表資料，確保乘車規劃依據為最新營運資訊。
- **單點故障快速定位**：將流程設計成具備錯誤監控與節點檢測的架構，若 RPA 出現單點故障可迅速找到問題來源。
- **JS 資料清洗與實際比對**：使用 JavaScript 進行時刻表與站間關係的資料清洗，深入理解車站與排點之間的轉乘邏輯。

## 3. 系統架構與資料流程

1. 輸入基本條件：以表單形式，要求登打並檢查搭乘日期、轉乘站、開始站、抵達站，提供後續自動化查詢必要資料。
2. 輸入驗證與日期處理：使用 `On form submission` 節點的時戳，轉換成 `Asia/Taipei` 時區，並透過時間比較與數字轉型檢查搭乘日與班次時間合法性。
3. 來源擷取：從指定的資料來源取出 TRC 檔案內容，或透過台鐵 API/HTTP request 查詢站別時刻表。
4. 資料解析：將取得的 HTML/原始資料解析成可處理的中間格式，例如 JSON，並補上行駛方向、無座票標記等欄位。
5. 資料清洗與合併：使用 `Filter`、`Sort`、`Remove Duplicates`、`Merge` 等節點進行欄位標準化、空值處理、重複資料移除與多來源合併。
6. 轉檔處理：依需求進行欄位轉換、欄位重新命名、資料格式轉換等，並依照後續 `Convert to File` 的需求維持 JSON 欄位順序。
7. 同步控制與檔案下載：利用 `Merge` 節點確保跨來源資料已全部到達，再輸出 CSV，並以開始站、抵達站、轉乘站、搭乘日與下載時戳建立檔名。
8. 結果輸出：匯出為目標格式，並存放到指定位置或推送到下游系統。

## 4. 資料清洗條件與規則 (TBC)

- 資料清洗通常包含以下幾個步驟：
    1. 表單欄位
        - 開始站、抵達站不可相同。
        - 預計搭乘日設為必填，且當前可查詢日期只限 7 日前，且在未來 3 個月內。
        - 
- 欄位標準化：統一欄位名稱與格式，避免上下游欄位對應錯誤。
- 空值處理：對必要欄位進行補植、預設值設置或濾除空值記錄。
- 格式校正：例如日期、數值或字串格式的統一轉換。
- 重複資料檢查：檢查並移除重複資料，確保轉檔結果正確性。

## 5. 實作 RPA 重點技術

### 5-1. 日期與時區使用
- 善用節點 `On form submission` 產生的時戳：以 .setZone('Asia/Taipei') 轉換成台灣時區，再用 .plus() 和 .minus() 作為動態時間範圍。 
    ```n8n
    {{ DateTime.fromISO($json["submittedAt"]).setZone('Asia/Taipei').minus({ days: 7 }) }}
    ```

- 比較時間點大小的方法：一種是直接以 'hh:MM' 格式，透過 is after 或 is before 搞定兩個時間點的大小。另一種方式是強制轉型成數字，用 is greater than 或 is less than 判斷。
    - 把時間強制轉型數字的寫法：```{{ Number($json.transfer_time.replace(':', '')) }}```

### 5-2. 網頁爬蟲
- 查詢實際 API 和網址規則：當查詢台鐵站別時刻表，輸入下方網址能跳出順行與逆行完整表格資訊。這個格式可用於 HTTP request 節點，以 GET 方法向伺服器提出請求，參數只有 2 個搭乘日 yyyy/MM/dd、站別代號-名稱。
   ```n8n
   https://www.railway.gov.tw/tra-tip-web/tip/tip001/tip112/querybystationblank?rideDate={{ DateTime.fromISO($json["預計搭乘日"]).toFormat('yyyy/MM/dd') }}&station={{ $json["開始"] }}
   ```
- 正確解析 HTML 文本並儲存成 JSON 格式：使用 Code 節點，將原有欄位有 5 欄 (車種車次、出發時間、終點站、設施服務、狀態)，存入 JSON 時另再加上表頭的行駛方向，以及是否不發售無座票。
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

## 5-3. 資料整理與格式化
- 處理資料清洗與調整欄位順序：考量後續節點 `Convert to File` 是直接拿 JSON 轉成 CSV 檔案下載，清洗資料時，欄位格式與順序非常重要，必須與寫入/整理的 JSON key 順序一致。
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
- JSON 格式資料清洗可使用的節點：(務必留意執行的先後順序)
    - 節點 `Filter` 能保留資料集指定條件資料。
    - 節點 `Sort` 可多重排序指定key。
    - 節點 `Remove Duplicates` 能指定或全選欄位，移除有重複的某幾筆(列)資料。
    - 節點 `Merge` 可用於多個來源的 JSON，合併成單一 JSON 輸出。
    - 節點 `Code` 是撰寫 JS 原碼腳本，處理更複雜的讀取與轉換。(Docker 環境下的 Python 3 受限使用，待確認！)

### 5-3. 同步/非同步處理、檔案下載
- 處理多個 `HTTP request` 串聯的效能問題：當串聯多個 HTTP request 節點時，可能造成記憶體不足，觸發讀取異常報錯，或降低 RPA 執行速度。故極度不建議前後「串聯」不只一個的爬蟲節點，應改以「並聯」形式可避開這個潛在問題，最後再以節點 `Merge` 合併輸出或處理多份 JSON 資料。    

- 確認交叉比對資料的取得時機：為避免在 JS 中，因調用尚未執行的前面節點出現 undefined 報錯，如 `const transferData = $("轉乘站時刻").all();`，宜搭配使用 `Merge` 節點，可強制等待所有 Input 節點都執行完畢，才繼續執行後續節點。
    - 不合併資料選 Choose Branch 加 Wait for all Inputs to Arrive，要合併資料選 Append。前者 Use Data of Input 選出的會是 Output，實際執行顯示的 item 數量僅供參考，仍依後續節點呼叫的資料集/變數為準。

- 定義下載檔的命名規則：這次下載到地端檔案都是 csv 格式檔案，分成「直達」與「轉乘」兩種，都有在檔名標註開始站名、抵達站名、下載日期時戳、預計搭乘日，利於使用者快速分辨新舊檔案、整理內容。
    ```n8n
    臺鐵時刻表{{ $('輸入資料完整？').first().json['預計搭乘日'] }}_{{ $('輸入資料完整？').first().json['開始'].split('-')[1] }}到{{ $('輸入資料完整？').first().json['抵達'].split('-')[1] }}_{{ $('輸入資料完整？').first().json['轉乘站'].split('-')[1] }}轉乘_{{ $now.setZone('Asia/Taipei').format('yyyyMMdd_HHmmss') }}.csv
    ```

## 6. 後續擴充建議

- 加入通知機制：當流程執行失敗或完成時發送通知。
- 加強驗證規則：對輸入資料進行更嚴格的內容驗證。
