// Vercel Serverless Function
// 檔案位置：/api/ai.js

// 🔧 schema type 大寫轉小寫（符合 gemini 規格）
function normalizeSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const result = { ...schema };
  if (result.type) result.type = result.type.toLowerCase();
  if (result.properties) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([k, v]) => [k, normalizeSchema(v)])
    );
  }
  if (result.items) result.items = normalizeSchema(result.items);
  if (result.required) result.required = result.required;
  return result;
}

// 🔄 帶重試的 fetch（自動處理 503/429 暫時性錯誤）
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastResponse;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok || (response.status !== 503 && response.status !== 429)) {
      return response;
    }
    lastResponse = response;
    const waitMs = attempt * 1500; // 1.5s → 3s → 4.5s
    console.log(`[Retry ${attempt}/${maxRetries}] status=${response.status}, waiting ${waitMs}ms`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  return lastResponse;
}

export default async function handler(req, res) {
  // 1. 僅允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. 🔐 內部驗證
  const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${INTERNAL_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized: 內部驗證失敗' });
  }

  // 3. 🚫 簡易限流
  if (!global.usageCount) global.usageCount = 0;
  if (global.usageCount > 2000) {
    return res.status(429).json({ error: 'Rate Limit Exceeded: 今日呼叫次數已達上限' });
  }
  global.usageCount++;

  const { promptText, systemInstruction, responseSchema } = req.body;
  if (!promptText) {
    return res.status(400).json({ error: 'Bad Request: 缺少 promptText' });
  }

  // 4. Log
  console.log({
    event: 'AI_Generation_Request',
    time: new Date().toISOString(),
    usage: global.usageCount,
    ip: req.headers['x-forwarded-for'] || 'unknown'
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('伺服器遺失 GEMINI_API_KEY 環境變數');

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const normalizedSchema = responseSchema ? normalizeSchema(responseSchema) : undefined;

    const body = {
      contents: [{ parts: [{ text: promptText }] }],
      system_instruction: { parts: [{ text: systemInstruction || '' }] },
      generation_config: {
        response_mime_type: 'application/json',
        ...(normalizedSchema && { response_schema: normalizedSchema })
      }
    };

    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Google API 拒絕 (${response.status}): ${errData.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Backend AI Error:', err.message);
    return res.status(500).json({
      error: '系統核心連線異常，請稍後再試 🙏',
      details: err.message
    });
  }
}
