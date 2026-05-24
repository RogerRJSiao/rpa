// 1. 讀取相關節點資料
const transferData = $("轉乘站時刻").all();
const startData = $("起始站時刻").all();

// 2. 建立起始站對照 Map
const startMap = new Map(startData.map(i => [i.json.train_no, i.json]));

// 3. 進行比對與過濾
return transferData
  .map(item => {
    const trainNo = item.json.train_no;
    const matchedStart = startMap.get(trainNo);

    return {
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
    };
  });