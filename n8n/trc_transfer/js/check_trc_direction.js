const directionLookup = {
    "大甲": { "彰化": "逆行", "員林": "逆行", "台中": "逆行", "大慶": "逆行" },
    "彰化": { "大甲": "順行", "台中": "順行", "大慶": "順行", "員林": "逆行" },
    "大慶": { "大甲": "逆行", "彰化": "逆行", "員林": "逆行", "台中": "順行" },
    "台中": { "大甲": "逆行", "彰化": "逆行", "員林": "逆行", "大慶": "逆行" },
    "員林": { "彰化": "順行", "大甲": "順行", "台中": "順行", "大慶": "順行" }
};

const item = $("輸入資料完整？").first().json;

// 1. 切出站名對照字典
const start = item["開始"] ? item["開始"].split('-')[1] : "";
const end = item["抵達"] ? item["抵達"].split('-')[1] : "";
const direction = directionLookup[start]?.[end] || "未知";

// 2. 嚴格維持你指定的 JSON 欄位架構與順序
return [{
    json: {
        "預計搭乘日": item["預計搭乘日"],
        "轉乘站": item["轉乘站"],
        "開始": item["開始"],
        "抵達": item["抵達"],
        "直達方向": direction, // 🎯 完美插在抵達下方
        "submittedAt": item["submittedAt"],
        "formMode": item["formMode"]
    }
}];