// 1. 取得上一個節點傳來的 HTML 字串
const htmlContent = $input.all()[0].json.data || "";

const results = [];

// 2. 依照「<li class="active">」來切分「順行大區塊」與「逆行大區塊」
// 我們用這個標籤當作切刀，把網頁分成好幾塊
const blocks = htmlContent.split(/<li\s+class="active">/);

// blocks[0] 通常是開頭無用的 HTML，我們從 blocks[1] 開始處理
for (let i = 1; i < blocks.length; i++) {
    const blockContent = blocks[i];
    
    // 3. 從這個區塊中精準找出方向（優先找 <span>，找不到就找 <h3> 內的文字）
    let direction = "未知";
    const spanMatch = blockContent.match(/<span>(順行|逆行)<\/span>/);
    const h3Match = blockContent.match(/<h3>\s*([^<\s]+)/);
    
    if (spanMatch) {
        direction = spanMatch[1].trim();
    } else if (h3Match) {
        direction = h3Match[1].trim();
    }
    
    // 4. 找出這個區塊內對應的 <table> 內容
    const tableMatch = blockContent.match(/<table[^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) continue; // 如果這塊沒有表格就跳過
    
    const tableContent = tableMatch[1];
    
    // 5. 解析表格內的每一列 <tr>
    const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
    let trMatch;
    let isHeader = true; // 用來跳過每張表格的第一列（欄位標頭）
    
    while ((trMatch = trRegex.exec(tableContent)) !== null) {
        if (isHeader) {
            isHeader = false; 
            continue;
        }
        
        const trContent = trMatch[1];
        
        // A. 提取車種車次 (從 class="links" 的超連結文字抓取)
        const trainMatch = trContent.match(/class="links"[^>]*>([^<]+)</);
        if (!trainMatch) continue;
        
        const trainNo = trainMatch[1].trim();
        
        // B. 提取該列中所有的 <td> 內容
        const tdRegex = /<td>([\s\S]*?)<\/td>/g;
        let tdMatch;
        const tds = [];
        while ((tdMatch = tdRegex.exec(trContent)) !== null) {
            tds.push(tdMatch[1].trim());
        }
        
        // C. 清理所有 td 內的 HTML 標籤與空白
        const cleanTds = tds.map(text => text.replace(/<[^>]+>/g, '').trim());
        
        // D. 過濾出真正的數據（排除純數字的項次、排除包含車次名稱的欄位）
        const actualDataTds = cleanTds.filter(text => {
            if (/^\d+$/.test(text) || text.includes(trainNo)) return false;
            return true;
        });

        // 經過前面過濾後，actualDataTds 的順序保證是：
        // [0] -> 開車時間
        // [1] -> 到達站
        // [2] -> 服務設施備註
        // [3] -> 狀態
        
        if (actualDataTds.length >= 2) {
            results.push({
                json: {
                    direction: direction,                               // 順行、逆行
                    train_no: trainNo,                                  // 車種車次
                    departure_station: $('On form submission').first().json["開始"], //開車車站
                    departure_time: (actualDataTds[0] || "").replace(/^00:/, "24:"), // 開車時間 (00:20 轉 24:20)
                    destination_station: actualDataTds[1] ? `往:${actualDataTds[1]}` : "",        // 到達站
                    service: actualDataTds[2].replace(/[\r\n\t]+/g, " ").trim() || "",                    // 服務設施
                    // status: actualDataTds[actualDataTds.length - 1] || "" // 狀態
                    seat: /自強\(3000\)|普悠瑪|太魯閣/.test(trainNo) ? "▲ reserved" : "" // 不售無座
                }
            });
        }
    }
}

return results;