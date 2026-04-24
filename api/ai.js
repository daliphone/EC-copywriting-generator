// Vercel Serverless Function
// 檔案位置必須為專案根目錄下的: /api/ai.js

export default async function handler(req, res) {
  // 1. 僅允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. 🔐 內部驗證 (Internal Auth)
  // 驗證前端傳來的 Token 是否與 Vercel 環境變數中的 INTERNAL_TOKEN 吻合
  const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${INTERNAL_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized: 內部驗證失敗，請確認前端與後端的 Token 設置是否一致' });
  }

  // 3. 🚫 簡易限流防護 (Rate Limiting)
  // 避免單一執行個體被異常狂刷 (重啟會歸零，適合基礎防護)
  if (!global.usageCount) global.usageCount = 0;
  if (global.usageCount > 2000) {
    return res.status(429).json({ error: 'Rate Limit Exceeded: 今日 API 呼叫次數已達安全上限' });
  }
  global.usageCount++;

  const { promptText, systemInstruction, responseSchema } = req.body;

  if (!promptText) {
    return res.status(400).json({ error: 'Bad Request: 缺少 promptText' });
  }

  // 4. 🧠 基礎 Log (未來可在 Vercel Logs 中查閱用量)
  console.log({
    event: "AI_Generation_Request",
    time: new Date().toISOString(),
    usage: global.usageCount,
    ip: req.headers['x-forwarded-for'] || 'unknown'
  });

  try {
    // 💡 提取真正的 Gemini API 金鑰 (不會外洩到前端)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("伺服器遺失 GEMINI_API_KEY 環境變數");
    }

    // 呼叫 Google API (使用2.0-flash 與 v1beta 端點)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        // ⚠️ Google API 必須嚴格使用 snake_case
        system_instruction: { parts: [{ text: systemInstruction }] },
        generation_config: {
          response_mime_type: "application/json",
          response_schema: responseSchema
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Google API 拒絕 (${response.status}): ${errData.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Backend AI Error:', err);
    
    // 5. ⚡ Fallback：發生錯誤時回傳 500 給前端，避免前端崩潰
    return res.status(500).json({ 
      error: "系統核心連線異常，請稍後再試 🙏", 
      details: err.message 
    });
  }
}
