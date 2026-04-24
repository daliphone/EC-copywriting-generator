import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Copy, CheckCircle2, AlertCircle, Loader2, RefreshCw, 
  ChevronLeft, Lightbulb, Scale, ShoppingBag, ShoppingCart, Box, 
  Globe, Share2, Camera, Settings, X, Zap, Hash, Menu,
  Check, AlertTriangle, Tag, BookOpen, LayoutTemplate, LayoutPanelLeft
} from 'lucide-react';

// ==========================================
// 1. 文案產生器 (Copywriter) 系統變數
// ==========================================
const COPY_PLATFORMS = [
  { id: 'shopee', name: '蝦皮購物', icon: ShoppingBag, color: 'text-[#ee4d2d]', bg: 'bg-[#ee4d2d]/10' },
  { id: 'momo', name: 'momo購物網', icon: ShoppingCart, color: 'text-[#d71559]', bg: 'bg-[#d71559]/10' },
  { id: 'pchome', name: 'PChome', icon: Box, color: 'text-[#00509e]', bg: 'bg-[#00509e]/10' },
  { id: 'yahoo', name: 'Yahoo拍賣', icon: Tag, color: 'text-[#6e1fbd]', bg: 'bg-[#6e1fbd]/10' },
];

const TONES = [
  { id: 'professional', label: '專業', icon: '👔' },
  { id: 'friendly', label: '親切', icon: '😊' },
  { id: 'lively', label: '活潑', icon: '🎉' },
  { id: 'urgent', label: '促銷急迫', icon: '🔥' },
];

const COPY_DEFAULT_TEMPLATES = {
  shopee: '🔥 限時特賣 🔥\n【{{productName}}】\n\n✅ 核心特色：\n{{features}}\n\n🚚 蝦皮店到店免運中！',
  momo: '【原廠公司貨】{{productName}}\n\n保證原廠公司貨，品質有保障。\n\n📌 核心規格：\n{{features}}',
  pchome: '{{productName}}\n\n■ {{features}}',
  yahoo: '【Yahoo嚴選】{{productName}}\n\n💯 買家好評推薦！\n👉 {{features}}\n\n🎁 立即下標，超商取貨付款最安心！',
};

// ==========================================
// 2. 雙軌標題引擎 (Title Engine) 系統變數
// ==========================================
const TITLE_BLACKLIST = [
  /第一/, /最強/, /最好/, /世界級/, /保證獲利/, /永久/, /唯一/,
  /殺菌/, /療效/, /官方唯一指定/, /全網最低/, /加賴/, /私下交易/, /Line/
];

const SPEC_TRANSLATION = {
  "10000mAh": "超大電量",   "12000Pa": "強勁大吸力",
  "144Hz":    "高刷流暢",   "120Hz":   "超順暢螢幕",
  "ANC":      "主動降噪",   "IP68":    "最高防塵防水",
  "Type-C":   "Type-C快充", "GaN":     "氮化鎵黑科技",
  "5G":       "5G高速",     "65W":     "超快充",
  "60W":      "60W超快充",  "256GB":   "256G大容量",
  "128GB":    "128G容量",   "MagSafe": "MagSafe無線充",
  "eSIM":     "eSIM雙卡",   "Wi-Fi 6": "Wi-Fi 6極速",
};

const TITLE_PLATFORMS = [
  { id: 'Shopee 蝦皮', short: '蝦皮', icon: ShoppingBag, color: 'text-[#ee4d2d]', bg: 'bg-[#ee4d2d]/10', desc: '長標題・長尾', limit: null, promoOk: true },
  { id: 'Momo 購物網', short: 'Momo', icon: ShoppingCart, color: 'text-[#d71559]', bg: 'bg-[#d71559]/10', desc: '60字・禁促銷', limit: 60, promoOk: false },
  { id: 'Yahoo 奇摩', short: 'Yahoo', icon: Box, color: 'text-[#6e1fbd]', bg: 'bg-[#6e1fbd]/10', desc: '24字・極致壓縮', limit: 24, promoOk: true },
];

const TITLE_DEFAULTS = {
  "Shopee 蝦皮": { brand: "Soundcore", model: "Liberty 4 NC", specs: "ANC, IP68", promo: "限時", sellingPoints: "搭載業界頂尖主動降噪，單次續航 10 小時。", audience: "通勤族", seo: "降噪耳機, 平替AirPods" },
  "Momo 購物網": { brand: "Apple", model: "iPhone 16", specs: "5G, 128GB", promo: "", sellingPoints: "A18 晶片強勁，台灣公司貨。", audience: "果粉升級", seo: "iPhone 16, 原廠保固" },
  "Yahoo 奇摩":  { brand: "Samsung", model: "S25", specs: "120Hz, 5G", promo: "9折", sellingPoints: "Galaxy AI 全面進化，夜拍業界頂尖。", audience: "安卓忠實用戶", seo: "三星手機, 5G手機推薦" },
};

// ==========================================
// 主應用程式 Component
// ==========================================
export default function App() {
  const [activeApp, setActiveApp] = useState('title');
  const [isModernLayout, setIsModernLayout] = useState(true);
  const [copiedState, setCopiedState] = useState({}); 

  // --- 🚀 企業級重構：內部 API 代理呼叫 ---
  const callGeminiAPI = async (promptText, systemInstruction, responseSchema, maxRetries = 3) => {
    
    // 💡 關鍵修正：從環境變數讀取 Token，不要設為空字串 ""
    const internalToken = import.meta.env.VITE_INTERNAL_TOKEN;

    // 防呆檢查：如果真的讀不到，在開發者主控台印出警告
    if (!internalToken && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error("🚨 系統偵測不到 VITE_INTERNAL_TOKEN！請檢查 Vercel 環境變數設定。");
    }
    
    const delays = [1000, 2000, 4000];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${internalToken}` // 現在這裡會帶上正確的暗號了
          },
          body: JSON.stringify({
            promptText: promptText,
            systemInstruction: systemInstruction,
            responseSchema: responseSchema
          })
        });
// ... 剩下的程式碼保持不變

        // 捕捉 HTTP 錯誤 (401 驗證失敗, 429 請求過多, 500 伺服器錯誤)
        if (!response.ok) {
          const errData = await response.json();
          // 若在沒有 /api 資料夾的環境 (如預覽窗) 執行，攔截 404
          if (response.status === 404) {
            throw new Error("無法連線至後端。請確認 /api/ai.js 檔案已建立並部署至 Vercel。");
          }
          throw new Error(`系統提示 (${response.status}): ${errData.error || errData.details || '連線失敗'}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // 解析 Gemini 傳回的資料
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("無效的系統回應格式 (內容為空)");
        
        return JSON.parse(text);

      } catch (err) {
        if (attempt === maxRetries - 1) throw new Error(err.message);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    const executeCopy = (content) => {
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); successCb(); } 
      catch (err) { console.error('Copy failed', err); }
      finally { document.body.removeChild(textArea); }
    };
    const successCb = () => {
      setCopiedState(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedState(prev => ({ ...prev, [id]: false })), 2000);
    };
    executeCopy(text);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans pb-12 relative" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif' }}>
      
      <nav className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 text-[#ea580c]"><ShoppingCart size={24} /></div>
            <span className="font-bold text-[16px] hidden sm:inline">Money Engine 電商工具箱</span>
          </div>
          <div className="flex items-center gap-2 sm:ml-4 sm:border-l border-[#e2e8f0] sm:pl-4">
            <button 
              onClick={() => setActiveApp('title')}
              className={`px-3 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${activeApp === 'title' ? 'text-[#ea580c] bg-[#fff7ed]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'}`}
            >
              🎯 雙軌標題引擎
            </button>
            <button 
              onClick={() => setActiveApp('copywriter')}
              className={`px-3 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${activeApp === 'copywriter' ? 'text-[#ea580c] bg-[#fff7ed]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'}`}
            >
              ✍️ AI 文案產生器
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-[#f1f5f9] p-1 rounded-[8px] border border-[#e2e8f0]">
            <button
              onClick={() => setIsModernLayout(false)}
              className={`px-3 py-1 text-[12px] font-bold rounded-[6px] transition-all flex items-center gap-1.5 ${!isModernLayout ? 'bg-white text-[#ea580c] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              title="傳統雙欄佈局"
            >
              <LayoutPanelLeft size={14} /> 傳統雙欄
            </button>
            <button
              onClick={() => setIsModernLayout(true)}
              className={`px-3 py-1 text-[12px] font-bold rounded-[6px] transition-all flex items-center gap-1.5 ${isModernLayout ? 'bg-white text-[#ea580c] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              title="全域頂部佈局"
            >
              <LayoutTemplate size={14} /> 全域頂部
            </button>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#f8bc94] text-[#a03600] flex items-center justify-center font-bold shadow-sm">M</div>
        </div>
      </nav>

      {activeApp === 'title' ? (
        <TitleEngineApp handleCopy={handleCopy} copiedState={copiedState} callGeminiAPI={callGeminiAPI} isModernLayout={isModernLayout} />
      ) : (
        <CopywriterApp handleCopy={handleCopy} copiedState={copiedState} callGeminiAPI={callGeminiAPI} isModernLayout={isModernLayout} />
      )}
      
    </div>
  );
}

function TitleEngineApp({ handleCopy, copiedState, callGeminiAPI, isModernLayout }) {
  const [platform, setPlatform] = useState(TITLE_PLATFORMS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ brand: '', model: '', specs: '', promo: '', sellingPoints: '', audience: '', seo: '' });
  const [results, setResults] = useState({ ruleBased: null, aiBased: null, aiSkipped: false });

  const [rawPaste, setRawPaste] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const def = TITLE_DEFAULTS[platform] || TITLE_DEFAULTS['Shopee 蝦皮'];
    setFormData(prev => ({ ...prev, ...def })); 
  }, []);

  const handleSmartParse = async () => {
    if (!rawPaste.trim()) return;
    setError('');
    setIsParsing(true);
    const schema = {
      type: "OBJECT",
      properties: { brand: { type: "STRING" }, model: { type: "STRING" }, specs: { type: "STRING" }, promo: { type: "STRING" }, sellingPoints: { type: "STRING" }, audience: { type: "STRING" }, seo: { type: "STRING" } },
      required: ["brand", "model", "sellingPoints", "audience", "seo"]
    };
    try {
      const res = await callGeminiAPI(rawPaste, "你是頂尖電商助理，提取商品資訊。", schema);
      if (res) {
        setFormData(prev => ({ ...prev, brand: res.brand || prev.brand, model: res.model || prev.model, specs: res.specs || prev.specs, promo: res.promo || prev.promo, sellingPoints: res.sellingPoints || prev.sellingPoints, audience: res.audience || prev.audience, seo: res.seo || prev.seo }));
        setRawPaste(''); 
      }
    } catch (err) { setError(`<b>AI 解析失敗</b><br/>${err.message}`); } 
    finally { setIsParsing(false); }
  };

  const checkCompliance = (text) => {
    for (let pattern of TITLE_BLACKLIST) {
      if (pattern.test(text)) return { ok: false, word: pattern.source };
    }
    return { ok: true };
  };

  const translateSpecs = (specsStr) => {
    return specsStr.split(',').map(s => {
      const key = s.trim();
      return SPEC_TRANSLATION[key] || key;
    }).filter(Boolean);
  };

  const cleanParts = (parts, sep = " | ") => {
    return parts.filter(p => p && p.trim()).join(sep);
  };

  const generateRuleBasedTitles = () => {
    const { brand, model, specs, promo } = formData;
    const ts = translateSpecs(specs);
    const ss = cleanParts(ts, " ");
    if (platform === 'Shopee 蝦皮') {
      const tag = promo ? `[${promo.substring(0,5)}]` : "";
      return [
        { strategy: "🛡️ 標準公版", title: cleanParts([tag, brand, model, ss, "馬尼通訊"]) },
        { strategy: "💡 痛點先決", title: cleanParts([tag, ss, `${brand} ${model}`, "馬尼通訊"]) },
        { strategy: "✨ 焦點主打", title: cleanParts([tag, brand, model, ts[0] || "", "馬尼通訊"]) }
      ];
    } else if (platform === 'Momo 購物網') {
      return [
        { strategy: "🛡️ 標準公版", title: cleanParts([brand, model, ss]).substring(0, 60) },
        { strategy: "👑 旗艦質感", title: cleanParts([`${brand} 官方旗艦`, model, "原廠公司貨", ss]).substring(0, 60) },
        { strategy: "🔄 規格倒裝", title: cleanParts([model, ss, brand]).substring(0, 60) }
      ];
    } else {
      const top = ts[0] || "";
      const compress = (t) => t.replace(/ /g, "").replace(/\|/g, "");
      const cap = (t) => t.length > 24 ? t.substring(0, 24) : t;
      return [
        { strategy: "🔥 促銷帶量", title: cap(compress(`${promo}${brand}${model}`)) },
        { strategy: "🏢 品牌本位", title: cap(compress(`${brand}${model}${promo}`)) },
        { strategy: "⚙️ 規格直擊", title: cap(compress(`${brand}${model}${top}`)) }
      ];
    }
  };

  const handleGenerate = async () => {
    const allInput = `${formData.brand} ${formData.model} ${formData.specs} ${formData.promo} ${formData.sellingPoints}`;
    const check = checkCompliance(allInput);
    if (!check.ok) { setError(`🚨 違規詞彙：${check.word}`); return; }
    if (!formData.brand || !formData.model) { setError("請填寫品牌與型號"); return; }
    setError('');
    setIsGenerating(true);
    const ruleBased = generateRuleBasedTitles();
    setResults(prev => ({ ...prev, ruleBased, aiBased: null }));
    const shouldRunAi = !!(formData.sellingPoints.trim() || formData.audience.trim() || formData.seo.trim());
    setResults(prev => ({ ...prev, aiSkipped: !shouldRunAi }));
    if (shouldRunAi) {
      try {
        const sysPrompt = "你是頂尖電商文案專家，產出 3 個高轉換標題。";
        const userPrompt = `品牌:${formData.brand} 型號:${formData.model} 規格:${formData.specs} 賣點:${formData.sellingPoints} SEO:${formData.seo}`;
        const schema = { type: "OBJECT", properties: { options: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, reason: { type: "STRING" } } } } }, required: ["options"] };
        const aiData = await callGeminiAPI(userPrompt, sysPrompt, schema);
        setResults(prev => ({ ...prev, aiBased: aiData.options }));
      } catch (err) { setError(`<b>AI 生成失敗</b><br/>${err.message}`); }
    }
    setIsGenerating(false);
  };

  const getCharBadge = (title, limit) => {
    const len = title.length;
    return <span className={`text-[12px] px-2 py-0.5 rounded-[4px] font-mono ${limit && len > limit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{len} {limit ? `/ ${limit}` : ''} 字元</span>;
  };

  const activePlatConfig = TITLE_PLATFORMS.find(p => p.id === platform);

  const SmartPasteSection = () => (
    <div className={`bg-[#f0fdf4] rounded-[12px] border border-[#bbf7d0] shadow-sm p-4 ${isModernLayout ? 'mb-6' : ''}`}>
      <label className="text-[13px] font-bold text-[#166534] flex items-center gap-2 mb-1.5">
        <Sparkles size={16} className="text-[#22c55e]"/>
        🪄 AI 解析器 (Smart Paste)
      </label>
      <div className="relative">
        <textarea value={rawPaste} onChange={(e) => setRawPaste(e.target.value)} placeholder="在此貼上原始商品資訊..." rows={isModernLayout ? 4 : 3} className="w-full px-3 py-2.5 bg-white border border-[#86efac] rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#22c55e]/50 pb-12" />
        <button onClick={handleSmartParse} disabled={!rawPaste.trim() || isParsing} className="absolute right-2 bottom-2 bg-[#22c55e] text-white text-[12px] font-bold px-3 py-1.5 rounded-[6px] disabled:opacity-50 flex items-center gap-1.5">
          {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} AI 解析
        </button>
      </div>
    </div>
  );

  const FormSection = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {TITLE_PLATFORMS.map(p => (
          <button key={p.id} onClick={() => setPlatform(p.id)} className={`flex flex-col items-center p-3 rounded-[10px] border-2 transition-all ${platform === p.id ? 'border-[#ea580c] bg-white shadow-md' : 'border-[#e2e8f0] bg-white'}`}>
            <p.icon size={20} className={p.color} />
            <span className="font-bold text-[14px] mt-1">{p.short}</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="品牌" className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20" />
          <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="型號" className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20" />
        </div>
        <input value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} placeholder="規格 (逗號隔開)" className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none" />
        <input value={formData.promo} onChange={e => setFormData({...formData, promo: e.target.value})} placeholder="促銷活動" disabled={platform==='Momo 購物網'} className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none disabled:bg-gray-100" />
      </div>
      <button onClick={handleGenerate} disabled={isGenerating} className={`w-full flex items-center justify-center gap-2 bg-[#ea580c] text-white py-4 rounded-[10px] font-bold shadow-lg hover:bg-[#c2410c] ${isModernLayout ? 'sticky bottom-4 z-10' : ''}`}>
         {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />} 🚀 產出雙軌標題
      </button>
    </div>
  );

  const ResultSection = () => (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold mb-4">🛡️ 規則引擎</h3>
        {!results.ruleBased ? <div className="text-[14px] text-gray-400 py-8 text-center bg-gray-50 rounded-[8px]">等待指派任務...</div> : (
          <div className="space-y-4">
            {results.ruleBased.map((res, i) => (
              <div key={i} className="border-l-4 border-[#ea580c] bg-white border p-4 relative shadow-sm">
                <div className="flex justify-between mb-2"><span className="text-[12px] font-bold text-gray-500">{res.strategy}</span>{getCharBadge(res.title, activePlatConfig.limit)}</div>
                <div className="text-[16px] font-bold text-[#0f172a] pr-12">{res.title}</div>
                <button onClick={() => handleCopy(res.title, `rule_${i}`)} className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 rounded">{copiedState[`rule_${i}`] ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold mb-4">🔮 AI 創意提案</h3>
        {!results.ruleBased ? <div className="text-[14px] text-gray-400 py-8 text-center bg-gray-50 rounded-[8px]">等待指派任務...</div> : results.aiSkipped ? <div className="text-[13px] text-orange-600 p-4 bg-orange-50 rounded border border-orange-100">💡 填寫 AI 賦能參數獲取提案。</div> : (
          <div className="space-y-4">
            {results.aiBased?.map((res, i) => (
              <div key={i} className="border-l-4 border-[#8b5cf6] bg-white border p-4 relative shadow-sm">
                <div className="flex justify-between mb-2"><span className="text-[12px] font-bold text-purple-500">提案 {i+1}</span>{getCharBadge(res.title, activePlatConfig.limit)}</div>
                <div className="text-[16px] font-bold text-[#0f172a] pr-12">{res.title}</div>
                <button onClick={() => handleCopy(res.title, `ai_${i}`)} className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 rounded">{copiedState[`ai_${i}`] ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 relative">
      {error && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-5 py-3.5 rounded-[12px] shadow-2xl animate-in slide-in-from-top-4 max-w-[90vw] md:max-w-[500px]">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" /><span className="text-[14px] font-medium leading-relaxed flex-1" dangerouslySetInnerHTML={{__html: error}}></span><button onClick={() => setError('')} className="flex-shrink-0 text-[#fca5a5] hover:text-[#dc2626]"><X size={18}/></button>
        </div>
      )}
      <div className="mb-6"><h1 className="text-[26px] font-bold">🎯 雙軌標題引擎</h1><p className="text-gray-500 text-[14px]">Money Engine 為您加速電商產能。</p></div>
      <div className={isModernLayout ? "animate-in fade-in duration-500" : "animate-in fade-in duration-300"}>
        {isModernLayout && <SmartPasteSection />}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-5 relative">{!isModernLayout && <SmartPasteSection />}<FormSection /></div>
          <div className="md:col-span-7"><ResultSection /></div>
        </div>
      </div>
    </div>
  );
}

function CopywriterApp({ handleCopy, copiedState, callGeminiAPI, isModernLayout }) {
  const [formData, setFormData] = useState({ productName: '', features: '', seoTags: '', tone: 'professional' });
  const [generationMode, setGenerationMode] = useState('template'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [templates, setTemplates] = useState(COPY_DEFAULT_TEMPLATES);
  const [selectedPlatform, setSelectedPlatform] = useState('shopee');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null); 
  const [error, setError] = useState('');
  const resultRef = useRef(null);
  const [rawPaste, setRawPaste] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('money_copywriter_templates');
    if (saved) { try { setTemplates(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const saveTemplates = () => { localStorage.setItem('money_copywriter_templates', JSON.stringify(templates)); setIsSettingsOpen(false); };
  const handleInput = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSmartParse = async () => {
    if (!rawPaste.trim()) return;
    setError(''); setIsParsing(true);
    const schema = { type: "OBJECT", properties: { productName: { type: "STRING" }, features: { type: "STRING" }, seoTags: { type: "STRING" } }, required: ["productName", "features", "seoTags"] };
    try {
      const res = await callGeminiAPI(rawPaste, "提取商品名稱與特色。", schema);
      if (res) { setFormData(prev => ({ ...prev, productName: res.productName || prev.productName, features: res.features || prev.features, seoTags: res.seoTags || prev.seoTags })); setRawPaste(''); }
    } catch (err) { setError(`<b>AI 解析失敗</b><br/>${err.message}`); } 
    finally { setIsParsing(false); }
  };

  const handleGenerate = async () => {
    if (!formData.productName.trim() || !formData.features.trim()) { setError('「商品名稱」與「特色」為必填。'); return; }
    setError(''); setIsGenerating(true);
    if (generationMode === 'template') {
      setTimeout(() => {
        const newResults = {};
        const baseTags = formData.seoTags ? formData.seoTags.split(',').map(t=>t.trim()) : [formData.productName.split(' ')[0], '熱銷推薦'];
        COPY_PLATFORMS.forEach(p => {
          let body = templates[p.id].replace(/{{productName}}/g, formData.productName).replace(/{{features}}/g, formData.features).replace(/{{seoTags}}/g, formData.seoTags || '');
          newResults[p.id] = { title: formData.productName, body, tags: baseTags };
        });
        setResults(newResults); setIsGenerating(false);
        if (window.innerWidth < 768) resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 400); return;
    }
    try {
      const platformSchema = { type: "OBJECT", properties: { title: { type: "STRING" }, body: { type: "STRING" }, tags: { type: "ARRAY", items: { type: "STRING" } } }, required: ["title", "body", "tags"] };
      const responseSchema = { type: "OBJECT", properties: { shopee: platformSchema, momo: platformSchema, pchome: platformSchema, yahoo: platformSchema }, required: ["shopee", "momo", "pchome", "yahoo"] };
      const generatedJson = await callGeminiAPI(`商品：${formData.productName}\n特色：${formData.features}\n風格：${formData.tone}`, "一次產出 4 種平台文案。", responseSchema);
      setResults(generatedJson);
      if (window.innerWidth < 768) resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { setError(`<b>AI 生成失敗</b><br/>${err.message}`); } 
    finally { setIsGenerating(false); }
  };

  const getFullText = (k) => results?.[k] ? `【${results[k].title}】\n\n${results[k].body}\n\n${results[k].tags?.map(t=>`#${t}`).join(' ') || ''}` : '';

  const SmartPasteArea = () => (
    <div className={`bg-[#fff7ed] rounded-[12px] border border-[#fed7aa] shadow-sm p-4 ${isModernLayout ? 'mb-6' : ''}`}>
      <label className="text-[13px] font-bold text-orange-800 flex items-center gap-2 mb-1.5"><Sparkles size={16} className="text-[#ea580c]"/>🪄 AI 解析器 (Smart Paste)</label>
      <div className="relative">
        <textarea value={rawPaste} onChange={(e) => setRawPaste(e.target.value)} placeholder="貼上商品資訊或對話..." rows={isModernLayout ? 4 : 3} className="w-full px-3 py-2.5 bg-white border border-[#fdba74] rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#ea580c]/50 pb-12 shadow-inner" />
        <button onClick={handleSmartParse} disabled={!rawPaste.trim() || isParsing} className="absolute right-2 bottom-2 bg-[#ea580c] text-white text-[12px] font-bold px-3 py-1.5 rounded-[6px] disabled:opacity-50">{isParsing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} AI 解析</button>
      </div>
    </div>
  );

  const FormSection = () => (
    <div className="space-y-5">
      <div className="bg-white p-1.5 rounded-[10px] border border-[#e2e8f0] shadow-sm flex items-center">
        <button onClick={() => setGenerationMode('template')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-[6px] ${generationMode === 'template' ? 'bg-white text-[#0f172a] shadow-sm ring-1 ring-gray-100' : 'text-gray-500'}`}>產出模組</button>
        <button onClick={() => setGenerationMode('ai')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-[6px] ${generationMode === 'ai' ? 'bg-white text-[#ea580c] shadow-sm ring-1 ring-orange-100' : 'text-gray-500'}`}>AI 智能生成</button>
      </div>
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-5">
        <input name="productName" value={formData.productName} onChange={handleInput} placeholder="商品名稱 *" className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 shadow-sm" />
        <textarea name="features" value={formData.features} onChange={handleInput} rows={4} placeholder="描述核心規格..." className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 resize-none shadow-sm" />
        <input name="seoTags" value={formData.seoTags} onChange={handleInput} placeholder="SEO 標籤池 (選填)" className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 shadow-sm" />
      </div>
      <button onClick={handleGenerate} disabled={isGenerating} className={`w-full flex items-center justify-center gap-2 text-white py-4 rounded-[10px] font-bold shadow-lg ${generationMode === 'ai' ? 'bg-[#ea580c]' : 'bg-[#0f172a]'} ${isModernLayout ? 'sticky bottom-4 z-10' : ''}`}>{isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />} {generationMode === 'ai' ? '一鍵生成跨平台文案' : '產出模組文案'}</button>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 relative">
      {error && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-5 py-3.5 rounded-[12px] shadow-2xl animate-in slide-in-from-top-4 max-w-[90vw] md:max-w-[500px]">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" /><span className="text-[14px] font-medium leading-relaxed flex-1" dangerouslySetInnerHTML={{__html: error}}></span><button onClick={() => setError('')} className="flex-shrink-0 text-[#fca5a5] hover:text-[#dc2626]"><X size={18}/></button>
        </div>
      )}
      <div className="mb-6 flex justify-between items-end"><div><h1 className="text-[26px] font-bold">✍️ AI 文案產生器</h1><p className="text-gray-500 text-[14px]">四大平台文案同時生成。</p></div><button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 text-[13px] border px-3 py-1.5 rounded-[8px] bg-white hover:bg-gray-50"><Settings size={16}/> 模組設定</button></div>
      <div className={isModernLayout ? "animate-in fade-in duration-500" : "animate-in fade-in duration-300"}>
        {isModernLayout && <SmartPasteArea />}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-5 relative">{!isModernLayout && <SmartPasteArea />}<FormSection /></div>
          <div className="md:col-span-7" ref={resultRef}>
            <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm flex flex-col min-h-[450px]">
               {results ? (() => {
                 const res = results[selectedPlatform];
                 return (
                   <>
                     <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-[12px]"><h2 className="text-[18px] font-bold">{COPY_PLATFORMS.find(p=>p.id===selectedPlatform)?.name} 文案</h2><button onClick={() => handleCopy(getFullText(selectedPlatform), 'main')} className="bg-[#0f172a] text-white px-4 py-2 rounded-[8px] text-[14px] font-bold">一鍵複製</button></div>
                     <div className="p-6 flex-1 space-y-6"><div className="text-[16px] font-bold bg-[#f8fafc] p-3 rounded-[8px] border shadow-inner">{res?.title}</div><div className="text-[14px] leading-relaxed bg-[#f8fafc] p-4 rounded-[8px] border whitespace-pre-wrap shadow-inner min-h-[200px]">{res?.body}</div></div>
                   </>
                 );
               })() : <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12"><RefreshCw size={40} className="mb-4 opacity-20" /><p className="font-bold">等待指派任務...</p></div>}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {COPY_PLATFORMS.map(p => (
                <div key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`p-4 border rounded-[10px] cursor-pointer bg-white transition-all ${selectedPlatform === p.id ? 'border-[#ea580c] ring-2 ring-orange-50 shadow-md' : 'hover:border-gray-300 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-2"><span className="font-bold text-[13px]">{p.name}</span><button onClick={(e) => { e.stopPropagation(); handleCopy(getFullText(p.id), p.id); }} className="text-[11px] text-orange-600 font-bold underline">複製</button></div>
                  <div className="text-[11px] text-gray-500 line-clamp-2 h-[32px]">{results?.[p.id]?.body || '尚未生成...'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-[#f8fafc]"><h3 className="font-bold text-[18px]">產出模組設定</h3><button onClick={() => setIsSettingsOpen(false)}><X size={20}/></button></div>
            <div className="p-6 overflow-y-auto space-y-5 bg-white">
               {COPY_PLATFORMS.map(p => (
                 <div key={p.id} className="space-y-1.5"><label className="text-[13px] font-bold text-[#334155]">{p.name}</label><textarea value={templates[p.id]} onChange={e => setTemplates(prev => ({...prev, [p.id]: e.target.value}))} rows={4} className="w-full p-3 border rounded-[10px] font-mono text-[12px] outline-none shadow-inner" /></div>
               ))}
            </div>
            <div className="p-5 border-t flex justify-end gap-3"><button onClick={saveTemplates} className="px-6 py-2.5 bg-[#0f172a] text-white rounded-[10px] text-[14px] font-bold">儲存變更</button></div>
          </div>
        </div>
      )}
    </div>
  );
}