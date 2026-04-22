import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Copy, CheckCircle2, AlertCircle, Loader2, RefreshCw, 
  ChevronLeft, Lightbulb, Scale, ShoppingBag, ShoppingCart, Box, 
  Globe, Facebook, Instagram, Settings, X, Zap, Hash, Menu,
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
  /減肥/, /瘦身/, /降血壓/, /治療/, /消炎/, /預防落髮/,
  /醫療級/, /療效/, /百分之百.*清潔/, /抗癌/
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

const PROMO_BLACKLIST = ["熱銷", "下殺", "贈送", "免運", "折扣", "特價", "爆款"];

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
  const [activeApp, setActiveApp] = useState('title'); // 'title' | 'copywriter'
  const [isModernLayout, setIsModernLayout] = useState(true); // 版面切換狀態：預設改為 true (全域頂部)
  const [copiedState, setCopiedState] = useState({}); 

  // --- 共用 API 引擎 (Exponential Backoff) ---
  const callGeminiAPI = async (promptText, systemInstruction, responseSchema, maxRetries = 3) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const delays = [1000, 2000, 4000];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("無效的 API 回應格式");
        return JSON.parse(text);

      } catch (err) {
        if (attempt === maxRetries - 1) throw new Error("系統繁忙或生成失敗，請稍後重試。");
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  };

  // --- 共用剪貼簿 ---
  const handleCopy = (text, id) => {
    if (!text) return;
    const executeCopy = (content) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(successCb);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); successCb(); } 
        catch (err) { console.error('Copy failed', err); }
        finally { document.body.removeChild(textArea); }
      }
    };
    const successCb = () => {
      setCopiedState(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedState(prev => ({ ...prev, [id]: false })), 2000);
    };
    executeCopy(text);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans pb-12" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif' }}>
      
      {/* 頂部導覽列 (整合雙軌Tab切換與版面切換) */}
      <nav className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 text-[#ea580c]"><ShoppingCart size={24} /></div>
            <span className="font-bold text-[16px] hidden sm:inline">馬尼電商工具箱</span>
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
          {/* 版面切換器 */}
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

      {/* 應用程式掛載區 */}
      {activeApp === 'title' ? (
        <TitleEngineApp handleCopy={handleCopy} copiedState={copiedState} callGeminiAPI={callGeminiAPI} isModernLayout={isModernLayout} />
      ) : (
        <CopywriterApp handleCopy={handleCopy} copiedState={copiedState} callGeminiAPI={callGeminiAPI} isModernLayout={isModernLayout} />
      )}
      
    </div>
  );
}

// ==========================================
// 🎯 子應用程式 1：雙軌標題引擎 (Title Engine)
// ==========================================
function TitleEngineApp({ handleCopy, copiedState, callGeminiAPI, isModernLayout }) {
  const [platform, setPlatform] = useState(TITLE_PLATFORMS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ brand: '', model: '', specs: '', promo: '', sellingPoints: '', audience: '', seo: '' });
  const [results, setResults] = useState({ ruleBased: null, aiBased: null, aiSkipped: false });

  // 智慧解析器狀態
  const [rawPaste, setRawPaste] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Load defaults based on platform
  useEffect(() => {
    const def = TITLE_DEFAULTS[platform] || TITLE_DEFAULTS['Shopee 蝦皮'];
    setFormData(prev => ({ ...prev, ...def })); 
  }, []);

  // 標題專屬智慧貼上解析邏輯
  const handleSmartParse = async () => {
    if (!rawPaste.trim()) return;
    setError('');
    setIsParsing(true);

    const schema = {
      type: "OBJECT",
      properties: {
        brand: { type: "STRING", description: "萃取品牌名稱，如 Apple, Samsung, Sony" },
        model: { type: "STRING", description: "萃取產品型號，如 iPhone 16 Pro, Galaxy S25" },
        specs: { type: "STRING", description: "萃取核心規格或特色參數，用半形逗號分隔，如 256GB, 5G, 120Hz" },
        promo: { type: "STRING", description: "萃取促銷活動、折扣或贈品，若無則留空" },
        sellingPoints: { type: "STRING", description: "萃取主要賣點。若原文未提及，請依據產品自動推導生成。" },
        audience: { type: "STRING", description: "推測目標受眾。若原文未提及，請依據產品自動推導生成。" },
        seo: { type: "STRING", description: "提取或自動生成 5-8 個相關的 SEO 關鍵字，用半形逗號分隔" }
      },
      required: ["brand", "model", "sellingPoints", "audience", "seo"]
    };

    const sysInst = "你是頂尖的資料拆解與電商行銷助理。請從使用者提供的商品文字中提取資訊。⚠️ 賦能指示：若原文中缺乏「產品賣點」、「目標族群」或「SEO關鍵字」，請直接運用電商專業「自動推導並生成補齊」，絕不留白！";

    try {
      const res = await callGeminiAPI(rawPaste, sysInst, schema, 3);
      if (res) {
        setFormData(prev => ({
          ...prev,
          brand: res.brand || prev.brand,
          model: res.model || prev.model,
          specs: res.specs || prev.specs,
          promo: res.promo || prev.promo,
          sellingPoints: res.sellingPoints || prev.sellingPoints,
          audience: res.audience || prev.audience,
          seo: res.seo || prev.seo
        }));
        setRawPaste(''); // 成功後清空
      }
    } catch (err) {
      setError('智慧解析失敗：' + err.message);
    } finally {
      setIsParsing(false);
    }
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
        { strategy: "🛡️ 標準公版（品牌識別優先）", title: cleanParts([tag, brand, model, ss, "馬尼通訊"]) },
        { strategy: "💡 痛點先決（長尾命中優先）", title: cleanParts([tag, ss, `${brand} ${model}`, "馬尼通訊"]) },
        { strategy: "✨ 焦點主打（專注核心賣點）", title: cleanParts([tag, brand, model, ts[0] || "", "馬尼通訊"]) }
      ];
    } else if (platform === 'Momo 購物網') {
      return [
        { strategy: "🛡️ 標準公版（均衡型）", title: cleanParts([brand, model, ss]).substring(0, 60) },
        { strategy: "👑 旗艦質感（台灣原廠保固）", title: cleanParts([`${brand} 官方旗艦`, model, "原廠公司貨", ss]).substring(0, 60) },
        { strategy: "🔄 規格倒裝（測試 SEO 權重）", title: cleanParts([model, ss, brand]).substring(0, 60) }
      ];
    } else {
      const top = ts[0] || "";
      const compress = (t) => t.replace(/ /g, "").replace(/\|/g, "");
      const cap = (t) => t.length > 24 ? t.substring(0, 24) : t;
      return [
        { strategy: "🔥 促銷帶量（價格敏感）", title: cap(compress(`${promo}${brand}${model}`)) },
        { strategy: "🏢 品牌本位（忠誠客群）", title: cap(compress(`${brand}${model}${promo}`)) },
        { strategy: "⚙️ 規格直擊（功能導向）", title: cap(compress(`${brand}${model}${top}`)) }
      ];
    }
  };

  const handleGenerate = async () => {
    const allInput = `${formData.brand} ${formData.model} ${formData.specs} ${formData.promo} ${formData.sellingPoints}`;
    const check = checkCompliance(allInput);
    
    if (!check.ok) {
      setError(`🚨 觸發法規紅線！包含違規詞彙：${check.word}，請修正後再試。`);
      return;
    }

    if (platform === 'Momo 購物網' && formData.promo.trim()) {
      setError("⚠️ Momo 嚴禁促銷字眼，請清空促銷欄位後再送出。");
      return;
    }

    if (!formData.brand || !formData.model) {
      setError("請填寫品牌名稱與產品型號。");
      return;
    }

    setError('');
    setIsGenerating(true);
    
    // 判斷是否需要啟動 AI 引擎 (只要有填寫任何一項賦能參數，就自動觸發)
    const shouldRunAi = !!(formData.sellingPoints.trim() || formData.audience.trim() || formData.seo.trim());
    
    const ruleBased = generateRuleBasedTitles();
    setResults(prev => ({ ...prev, ruleBased, aiBased: null, aiSkipped: !shouldRunAi }));

    if (shouldRunAi) {
      const rulesStr = {
        "Shopee 蝦皮": "蝦皮：演算法吃關鍵字命中率。雙層佈局：核心大字＋長尾詞。使用「|」分隔。促銷放最前用 [ ] 括起來（限5字）。結尾加「馬尼通訊」。",
        "Momo 購物網": "Momo：客群重信賴，精確匹配大於一切。總字數限 60 字。絕對不可出現促銷字眼。強調「台灣公司貨、原廠保固、官方正品」。",
        "Yahoo 奇摩":  "Yahoo：極致壓縮，嚴格限制 24 字元（英數符號各算1字）。嚴禁「|」或空格，越緊湊越好。",
      }[platform];

      const sysPrompt = `你是頂尖電商文案與 SEO 演算法專家。請依以下資訊撰寫 3 個高轉換商品標題。\n【平台規則】:${rulesStr}`;
      const userPrompt = `【商品】品牌:${formData.brand} 型號:${formData.model} 規格:${formData.specs} 促銷:${formData.promo}\n【行銷】賣點:${formData.sellingPoints} 族群:${formData.audience} SEO:${formData.seo}`;
      
      const schema = {
        type: "OBJECT",
        properties: { options: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, reason: { type: "STRING" } } } } },
        required: ["options"]
      };

      try {
        const aiData = await callGeminiAPI(userPrompt, sysPrompt, schema, 3);
        const processedAi = (aiData.options || []).map(opt => {
          const aiCheck = checkCompliance(opt.title);
          if (!aiCheck.ok) {
            return { title: "⚠️ [AI 生成違規已攔截]", reason: `觸發法規黑名單（${aiCheck.word}），已自動阻擋。` };
          }
          return opt;
        });
        setResults(prev => ({ ...prev, aiBased: processedAi }));
      } catch (err) {
        setError("AI 生成失敗：" + err.message);
      }
    }
    
    setIsGenerating(false);
  };

  const getCharBadge = (title, limit) => {
    const len = title.length;
    if (!limit) return <span className="text-[12px] px-2 py-0.5 rounded-[4px] bg-green-100 text-green-700 font-mono border border-green-200">{len} 字元</span>;
    if (len > limit) return <span className="text-[12px] px-2 py-0.5 rounded-[4px] bg-red-100 text-red-700 font-mono border border-red-200">{len} / {limit} 字元 (超限)</span>;
    if (len > limit * 0.88) return <span className="text-[12px] px-2 py-0.5 rounded-[4px] bg-amber-100 text-amber-700 font-mono border border-amber-200">{len} / {limit} 字元</span>;
    return <span className="text-[12px] px-2 py-0.5 rounded-[4px] bg-green-100 text-green-700 font-mono border border-green-200">{len} / {limit} 字元</span>;
  };

  const activePlatConfig = TITLE_PLATFORMS.find(p => p.id === platform);

  // --- 共用區塊 UI (依賴內部狀態) ---
  const SmartPasteSection = () => (
    <div className={`bg-[#f0fdf4] rounded-[12px] border border-[#bbf7d0] shadow-sm p-4 ${isModernLayout ? 'mb-6' : ''}`}>
      <label className="text-[13px] font-bold text-[#166534] flex items-center gap-2 mb-1.5">
        <Sparkles size={16} className="text-[#22c55e]"/>
        🪄 標題資料萃取器 (Smart Paste)
      </label>
      <p className="text-[12px] text-[#15803d] mb-3 leading-relaxed">
        貼上廠商的凌亂商品資訊，AI 將瞬間幫您將「品牌、型號、規格、賣點」分類填入下方 7 個欄位。
      </p>
      <div className="relative">
        <textarea
          value={rawPaste}
          onChange={(e) => setRawPaste(e.target.value)}
          placeholder="在此貼上原始商品資訊或 LINE 訊息..."
          rows={isModernLayout ? 4 : 3}
          className="w-full px-3 py-2.5 bg-white border border-[#86efac] rounded-[8px] text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 outline-none resize-none pb-12 shadow-inner"
        />
        <button
          onClick={handleSmartParse}
          disabled={!rawPaste.trim() || isParsing}
          className="absolute right-2 bottom-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[12px] font-bold px-3 py-1.5 rounded-[6px] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          智能拆解
        </button>
      </div>
    </div>
  );

  const FormSection = () => (
    <div className="space-y-5">
      {/* 平台選擇 */}
      <div className="grid grid-cols-3 gap-3">
        {TITLE_PLATFORMS.map(p => {
          const PIcon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => { setPlatform(p.id); setResults({ruleBased: null, aiBased: null}); setError(''); }}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-[10px] border-2 transition-all ${platform === p.id ? `border-[#ea580c] bg-white shadow-[0_4px_16px_rgba(234,88,12,0.15)]` : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'}`}
            >
              <PIcon size={20} className={p.color} />
              <span className="font-bold text-[14px]">{p.short}</span>
              <span className="text-[11px] text-[#64748b]">{p.desc}</span>
            </button>
          )
        })}
      </div>

      {platform === 'Momo 購物網' && (
         <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-[6px] text-[13px] font-medium flex items-center gap-2">
           <AlertTriangle size={16} /> ⚠️ Momo 嚴禁促銷字眼，促銷欄位請留空。
         </div>
      )}

      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-4">
        <h3 className="text-[13px] font-bold text-[#64748b] uppercase tracking-widest border-b pb-2">基本商品資訊 (必填)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#334155]">品牌名稱</label>
            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder={TITLE_DEFAULTS[platform]?.brand} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#334155]">產品型號</label>
            <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder={TITLE_DEFAULTS[platform]?.model} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#334155]">核心規格 (逗號分隔)</label>
          <input value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} placeholder={TITLE_DEFAULTS[platform]?.specs} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#334155]">促銷活動</label>
          <input value={formData.promo} onChange={e => setFormData({...formData, promo: e.target.value})} placeholder={platform==='Momo 購物網' ? "Momo 嚴禁填寫此欄" : TITLE_DEFAULTS[platform]?.promo} disabled={platform==='Momo 購物網'} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none disabled:bg-gray-100 disabled:opacity-60" />
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-4">
        <h3 className="text-[13px] font-bold text-[#64748b] uppercase tracking-widest border-b pb-2 flex items-center justify-between">
          <span>AI 賦能參數 (填寫即自動觸發)</span>
        </h3>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#334155]">產品賣點 (痛點/情境)</label>
          <textarea value={formData.sellingPoints} onChange={e => setFormData({...formData, sellingPoints: e.target.value})} placeholder={TITLE_DEFAULTS[platform]?.sellingPoints} rows={2} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#334155]">目標族群</label>
            <input value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} placeholder={TITLE_DEFAULTS[platform]?.audience} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#334155]">SEO 關鍵字</label>
            <input value={formData.seo} onChange={e => setFormData({...formData, seo: e.target.value})} placeholder={TITLE_DEFAULTS[platform]?.seo} className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-4 py-3 rounded-[8px] text-[14px] shadow-sm">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span dangerouslySetInnerHTML={{__html: error}}></span>
        </div>
      )}
      
      {/* 傳統模式按鈕跟著表單，現代模式按鈕吸底 */}
      <button 
        onClick={handleGenerate} 
        disabled={isGenerating} 
        className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white py-4 px-4 rounded-[10px] font-bold text-[16px] shadow-lg transition-all duration-300 hover:from-[#c2410c] hover:to-[#ea580c] disabled:opacity-70 disabled:cursor-not-allowed ${isModernLayout ? 'sticky bottom-4 z-10' : ''}`}
      >
         {isGenerating ? <><Loader2 size={20} className="animate-spin" /> 演算法運算中...</> : <><Zap size={20} /> 🚀 產出雙軌標題</>}
      </button>
    </div>
  );

  const ResultSection = () => (
    <div className="flex flex-col gap-6">
      {/* 規則結果 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold text-[#0f172a] mb-4 flex items-center gap-2">
           <ShieldIcon /> 規則引擎（絕對合規、秒速產出）
        </h3>
        {!results.ruleBased ? (
          <div className="text-[14px] text-[#94a3b8] py-8 text-center bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-[8px]">等待指派任務...</div>
        ) : (
          <div className="space-y-4">
            {results.ruleBased.map((res, i) => {
              const copyId = `rule_${i}`;
              return (
              <div key={i} className="border-l-4 border-[#ea580c] bg-white border border-[#e2e8f0] rounded-r-[8px] p-4 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-bold text-[#64748b]">{res.strategy}</span>
                  {getCharBadge(res.title, activePlatConfig.limit)}
                </div>
                <div className="text-[16px] font-bold text-[#0f172a] font-mono leading-relaxed mb-3">{res.title}</div>
                <button onClick={() => handleCopy(res.title, copyId)} className="absolute bottom-3 right-3 text-[12px] flex items-center gap-1 bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] px-3 py-1.5 rounded-[6px] font-bold transition-colors">
                  {copiedState[copyId] ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>} {copiedState[copyId] ? '已複製' : '複製'}
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* AI 結果 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold text-[#0f172a] mb-4 flex items-center gap-2">
           <Sparkles className="text-[#8b5cf6]" size={18} /> AI 創意引擎（發散創意、精準打擊）
        </h3>
        {!results.ruleBased ? (
          <div className="text-[14px] text-[#94a3b8] py-8 text-center bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-[8px]">等待指派任務...</div>
        ) : results.aiSkipped ? (
          <div className="text-[14px] text-[#ea580c] py-4 px-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] font-medium leading-relaxed">
            💡 只要填寫左方的「產品賣點」、「目標族群」或「SEO關鍵字」任一欄位，系統將會為您額外產出 3 組高轉化率的 AI 創意標題！
          </div>
        ) : !results.aiBased && isGenerating ? (
          <div className="text-[14px] text-[#8b5cf6] py-8 text-center flex items-center justify-center gap-2 bg-[#f5f3ff] border border-dashed border-[#ddd6fe] rounded-[8px]">
            <Loader2 size={16} className="animate-spin"/> 正在召喚千萬文案大師...
          </div>
        ) : (
          <div className="space-y-4">
            {results.aiBased && results.aiBased.map((res, i) => {
              const copyId = `ai_${i}`;
              const isWarn = res.title.includes("⚠️");
              return (
              <div key={i} className={`border-l-4 ${isWarn ? 'border-red-500 bg-red-50' : 'border-[#8b5cf6] bg-white'} border border-[#e2e8f0] rounded-r-[8px] p-4 shadow-sm relative group hover:shadow-md transition-shadow`}>
                {!isWarn && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[12px] font-bold text-[#8b5cf6]">🔮 AI 創意提案 {i+1}</span>
                    {getCharBadge(res.title, activePlatConfig.limit)}
                  </div>
                )}
                <div className={`text-[16px] font-bold font-mono leading-relaxed mb-2 ${isWarn ? 'text-red-700' : 'text-[#0f172a]'}`}>{res.title}</div>
                <div className={`text-[13px] pl-3 border-l-2 ${isWarn ? 'border-red-300 text-red-600' : 'border-[#ddd6fe] text-[#7c3aed]'} mt-3 py-1`}>{res.reason}</div>
                {!isWarn && (
                  <button onClick={() => handleCopy(res.title, copyId)} className="absolute top-3 right-3 text-[12px] flex items-center gap-1 bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#ede9fe] px-3 py-1.5 rounded-[6px] font-bold transition-colors">
                    {copiedState[copyId] ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>} {copiedState[copyId] ? '已複製' : '複製'}
                  </button>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold flex items-center gap-2">🎯 雙軌標題引擎</h1>
        <p className="text-[#64748b] text-[14px] mt-1">規則保底，AI 賦能。自動過濾違規字詞，打造高點擊率平台標題。</p>
      </div>

      {isModernLayout ? (
        /* 模式 B: 全域頂部 */
        <div className="animate-in fade-in duration-500">
          <SmartPasteSection />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative items-start">
            <div className="md:col-span-5 relative">
               <FormSection />
            </div>
            <div className="md:col-span-7">
               <ResultSection />
            </div>
          </div>
        </div>
      ) : (
        /* 模式 A: 傳統雙欄 */
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-5 relative">
              <SmartPasteSection />
              <FormSection />
            </div>
            <div className="md:col-span-7">
              <ResultSection />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

// ==========================================
// ✍️ 子應用程式 2：AI 文案產生器 (Copywriter)
// ==========================================
function CopywriterApp({ handleCopy, copiedState, callGeminiAPI, isModernLayout }) {
  const [formData, setFormData] = useState({ productName: '', features: '', imageDesc: '', seoTags: '', tone: 'professional' });
  const [generationMode, setGenerationMode] = useState('template'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [templates, setTemplates] = useState(COPY_DEFAULT_TEMPLATES);
  const [selectedPlatform, setSelectedPlatform] = useState('shopee');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [results, setResults] = useState(null); 
  const [error, setError] = useState('');
  const resultRef = useRef(null);

  // 智慧解析器狀態
  const [rawPaste, setRawPaste] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('marshall_copywriter_templates_v3');
    if (saved) { try { setTemplates(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const saveTemplates = () => {
    localStorage.setItem('marshall_copywriter_templates_v3', JSON.stringify(templates));
    setIsSettingsOpen(false);
  };

  const handleInput = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // 智慧貼上解析邏輯
  const handleSmartParse = async () => {
    if (!rawPaste.trim()) return;
    setError('');
    setIsParsing(true);

    const schema = {
      type: "OBJECT",
      properties: {
        productName: { type: "STRING", description: "萃取出商品的主要名稱與型號" },
        features: { type: "STRING", description: "萃取商品核心賣點或規格，適度整理成易讀的條列或短句" },
        seoTags: { type: "STRING", description: "提取或自動生成 6-8 個相關的高流量 SEO 關鍵字，用半形逗號隔開" }
      },
      required: ["productName", "features", "seoTags"]
    };

    const sysInst = "你是頂尖的資料萃取與電商行銷助理。請從原文中萃取商品名稱與特色。⚠️ 賦能指示：若原文缺乏 SEO 關鍵字，請直接運用專業「自動生成」高流量關鍵字補齊，不要留白！";

    try {
      const res = await callGeminiAPI(rawPaste, sysInst, schema, 3);
      if (res) {
        setFormData(prev => ({
          ...prev,
          productName: res.productName || prev.productName,
          features: res.features || prev.features,
          seoTags: res.seoTags || prev.seoTags
        }));
        setRawPaste(''); 
      }
    } catch (err) {
      setError('智慧解析失敗：' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerateSeo = async () => {
    if (!formData.productName.trim()) { setError('請填寫「商品名稱」'); return; }
    setError(''); setIsGeneratingSeo(true);
    const schema = { type: "OBJECT", properties: { tags: { type: "ARRAY", items: { type: "STRING" } } }, required: ["tags"] };
    try {
      const res = await callGeminiAPI(`為「${formData.productName}」提取6個電商SEO關鍵字。特徵：${formData.features}`, "你是資深 SEO 專家", schema);
      if (res?.tags) setFormData(prev => ({ ...prev, seoTags: res.tags.join(', ') }));
    } catch (err) { setError('關鍵字生成失敗：' + err.message); } 
    finally { setIsGeneratingSeo(false); }
  };

  const handleGenerate = async () => {
    if (!formData.productName.trim() || !formData.features.trim()) { setError('「商品名稱」與「特色」為必填。'); return; }
    setError(''); setIsGenerating(true);

    if (generationMode === 'template') {
      setTimeout(() => {
        const newResults = {};
        const baseTags = formData.seoTags ? formData.seoTags.split(',').map(t=>t.trim()) : [formData.productName.split(' ')[0], '熱銷推薦'];
        COPY_PLATFORMS.forEach(p => {
          let body = templates[p.id]
            .replace(/{{productName}}/g, formData.productName)
            .replace(/{{features}}/g, formData.features)
            .replace(/{{seoTags}}/g, formData.seoTags || '');
          newResults[p.id] = { title: formData.productName, body, tags: baseTags };
        });
        setResults(newResults);
        setIsGenerating(false);
        if (window.innerWidth < 768) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return;
    }

    const platformSchema = { type: "OBJECT", properties: { title: { type: "STRING" }, body: { type: "STRING" }, tags: { type: "ARRAY", items: { type: "STRING" } } }, required: ["title", "body", "tags"] };
    const responseSchema = { type: "OBJECT", properties: { shopee: platformSchema, momo: platformSchema, pchome: platformSchema, yahoo: platformSchema }, required: ["shopee", "momo", "pchome", "yahoo"] };
    
    const sysInst = `一次產出 4 種平台文案。1. 蝦皮購物：強調免運特價、條列式。2. momo購物網：強調品牌保證、禁促銷。3. PChome：極度強調出貨速度、硬派條列。4. Yahoo拍賣：強調買家好評、超商取貨、拍賣賣家親切語氣。`;
    const selectedToneLabel = TONES.find(t => t.id === formData.tone)?.label || '專業';
    const promptText = `商品：${formData.productName}\n特色：${formData.features}\nSEO：${formData.seoTags}\n風格：${selectedToneLabel}`;

    try {
      const generatedJson = await callGeminiAPI(promptText, sysInst, responseSchema, 4);
      setResults(generatedJson);
      if (window.innerWidth < 768) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { setError(err.message || '生成失敗'); } 
    finally { setIsGenerating(false); }
  };

  const getFullText = (k) => results?.[k] ? `【${results[k].title}】\n\n${results[k].body}\n\n${results[k].tags?.map(t=>`#${t}`).join(' ') || ''}` : '';

  // --- 共用區塊 UI ---
  const SmartPasteSection = () => (
    <div className={`bg-[#fff7ed] rounded-[12px] border border-[#fed7aa] shadow-sm p-4 ${isModernLayout ? 'mb-6' : ''}`}>
      <label className="text-[13px] font-bold text-[#9a3412] flex items-center gap-2 mb-1.5">
        <Sparkles size={16} className="text-[#ea580c]"/>
        🪄 智慧貼上解析器 (Smart Paste)
      </label>
      <p className="text-[12px] text-[#c2410c] mb-3 leading-relaxed">
        直接貼上廠商提供的商品資訊或 LINE 對話，AI 將自動拆解並填寫下方表單。
      </p>
      <div className="relative">
        <textarea
          value={rawPaste}
          onChange={(e) => setRawPaste(e.target.value)}
          placeholder="在此貼上未排版的原始商品資訊..."
          rows={isModernLayout ? 4 : 3}
          className="w-full px-3 py-2.5 bg-white border border-[#fdba74] rounded-[8px] text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 outline-none resize-none pb-12 shadow-inner"
        />
        <button
          onClick={handleSmartParse}
          disabled={!rawPaste.trim() || isParsing}
          className="absolute right-2 bottom-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-[12px] font-bold px-3 py-1.5 rounded-[6px] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          智能解析
        </button>
      </div>
    </div>
  );

  const FormSection = () => (
    <div className="space-y-5">
      <div className="bg-white p-1.5 rounded-[10px] border border-[#e2e8f0] shadow-sm flex items-center justify-between">
        <button onClick={() => setGenerationMode('template')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 ${generationMode === 'template' ? 'bg-white text-[#0f172a] shadow-sm ring-1 ring-[#e2e8f0]' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
          <Zap size={18} className={generationMode === 'template' ? 'text-amber-500' : ''} /> 產出模組
        </button>
        <button onClick={() => setGenerationMode('ai')} className={`flex-1 py-2.5 text-[14px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 ${generationMode === 'ai' ? 'bg-white text-[#ea580c] shadow-sm ring-1 ring-[#fed7aa]' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
          <Sparkles size={18} className={generationMode === 'ai' ? 'text-[#ea580c]' : ''} /> AI 智能生成
        </button>
      </div>

      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#334155]">商品名稱 *</label>
          <input name="productName" value={formData.productName} onChange={handleInput} placeholder="例：Thrustmaster T248 賽車方向盤" className="w-full px-3 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#334155]">商品特色 / 描述 *</label>
          <textarea name="features" value={formData.features} onChange={handleInput} rows={4} placeholder="例：動態力量回饋、支援 PS5/PC" className="w-full px-3 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none resize-none" />
        </div>
        <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
          <div className="flex justify-between items-center">
            <label className="text-[13px] font-bold text-[#334155] flex items-center gap-1.5"><Hash size={14} className="text-[#8b5cf6]" /> SEO 標籤池 (選填)</label>
            <button onClick={handleGenerateSeo} disabled={isGeneratingSeo} className="text-[12px] flex items-center gap-1 bg-[#f3e8ff] text-[#7c3aed] px-2 py-1 rounded-[4px] font-medium disabled:opacity-50 hover:bg-[#e9d5ff]"><Sparkles size={12}/>智能抓詞</button>
          </div>
          <input name="seoTags" value={formData.seoTags} onChange={handleInput} placeholder="例：賽車遊戲, PS5周邊" className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] text-[13px] focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] outline-none" />
        </div>
      </div>

      <div className={`transition-all duration-300 ${generationMode === 'ai' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5">
          <label className="text-[14px] font-bold text-[#0f172a] block mb-3">AI 語氣微調</label>
          <div className="grid grid-cols-2 gap-3">
            {TONES.map(t => (
              <button key={t.id} onClick={() => setFormData(p => ({ ...p, tone: t.id }))} className={`flex items-center gap-2 px-3 py-2.5 rounded-[8px] border text-[14px] ${formData.tone === t.id ? 'border-[#ea580c] bg-[#ea580c]/5 text-[#ea580c] font-bold' : 'border-[#e2e8f0] text-[#64748b]'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-4 py-3 rounded-[8px] text-[14px] font-medium">{error}</div>}

      <button 
        onClick={handleGenerate} 
        disabled={isGenerating} 
        className={`w-full flex items-center justify-center gap-2 text-white py-4 px-4 rounded-[10px] font-bold text-[16px] shadow-lg transition-all ${generationMode === 'ai' ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316]' : 'bg-[#0f172a]'} disabled:opacity-70 ${isModernLayout ? 'sticky bottom-4 z-10' : ''}`}
      >
        {isGenerating ? <Loader2 size={20} className="animate-spin" /> : (generationMode === 'ai' ? <Sparkles size={20} /> : <Zap size={20} />)}
        {generationMode === 'ai' ? '一鍵生成跨平台文案' : '產出模組'}
      </button>
    </div>
  );

  const ResultSection = () => (
    <div className="flex flex-col gap-6" ref={resultRef}>
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm flex flex-col min-h-[400px]">
        {results ? (() => {
          const active = COPY_PLATFORMS.find(p => p.id === selectedPlatform);
          const ActiveIcon = active.icon;
          const res = results[selectedPlatform];

          return (
            <>
              <div className="px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[#f8fafc] to-white">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active.bg} ${active.color}`}><ActiveIcon size={18} /></div>
                  <h2 className="text-[20px] font-bold">{active.name} 文案</h2>
                </div>
                <button onClick={() => handleCopy(getFullText(selectedPlatform), 'main')} className="flex items-center gap-1.5 text-[14px] text-white bg-[#0f172a] hover:bg-[#1e293b] px-5 py-2 rounded-[8px] font-bold shadow-sm">
                  {copiedState['main'] ? <CheckCircle2 size={16} className="text-green-400"/> : <Copy size={16} />} {copiedState['main'] ? '已複製' : '一鍵複製'}
                </button>
              </div>
              <div className="p-6 flex-1 bg-[#f8fafc] m-6 rounded-[10px] border border-[#e2e8f0] shadow-inner space-y-6">
                <div>
                  <div className="text-[13px] text-[#64748b] mb-1.5 font-bold">商品標題</div>
                  <div className="text-[18px] font-bold bg-white p-3.5 rounded-[8px] border border-[#cbd5e1]">{res?.title || '生成中...'}</div>
                </div>
                <div>
                  <div className="text-[13px] text-[#64748b] mb-1.5 font-bold">行銷內文</div>
                  <div className="text-[15px] leading-[1.8] whitespace-pre-wrap bg-white p-5 rounded-[8px] border border-[#cbd5e1] min-h-[120px]">{res?.body || '生成中...'}</div>
                </div>
              </div>
            </>
          );
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8] p-12">
            <div className="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-5"><Box size={32} className="text-[#cbd5e1]" /></div>
            <h3 className="text-[20px] font-bold text-[#475569]">等待指派任務</h3>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {COPY_PLATFORMS.map(p => {
          const Icon = p.icon;
          const isSel = selectedPlatform === p.id;
          const hasRes = !!results?.[p.id];
          return (
            <div key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`relative border rounded-[10px] p-4 cursor-pointer bg-white transition-all ${isSel ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${p.bg} ${p.color}`}><Icon size={14} /></div>
                  <span className="font-bold text-[14px]">{p.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleCopy(getFullText(p.id), p.id); }} disabled={!hasRes} className="text-[12px] bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] font-bold px-2 py-1 rounded-[6px] disabled:opacity-50">
                  {copiedState[p.id] ? '已複製' : '複製'}
                </button>
              </div>
              <div className="text-[12px] text-[#64748b] line-clamp-2 h-[36px]">{hasRes ? results[p.id].body : '尚未生成...'}</div>
              {isSel && <div className="absolute -left-[2px] top-4 bottom-4 w-[4px] bg-[#ea580c] rounded-r-[4px]"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold flex items-center gap-2">✍️ AI 電商文案產生器</h1>
          <p className="text-[#64748b] text-[14px] mt-1">四大電商平台一魚多吃。結合產出模組與 AI 智能，加速營運效率。</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 text-[14px] text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e2e8f0] px-3 py-2 rounded-[8px] font-medium shadow-sm transition-colors">
          <Settings size={16}/> 模組參數設定
        </button>
      </div>

      {isModernLayout ? (
        /* 模式 B: 全域頂部 */
        <div className="animate-in fade-in duration-500">
          <SmartPasteSection />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative items-start">
            <div className="md:col-span-5 relative">
              <FormSection />
            </div>
            <div className="md:col-span-7">
              <ResultSection />
            </div>
          </div>
        </div>
      ) : (
        /* 模式 A: 傳統雙欄 */
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-5 relative">
              <SmartPasteSection />
              <FormSection />
            </div>
            <div className="md:col-span-7">
              <ResultSection />
            </div>
          </div>
        </div>
      )}

      {/* 模組設定 Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <h3 className="text-[20px] font-bold flex items-center gap-2"><Settings size={22} className="text-[#ea580c]" /> 產出模組設定</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-[#64748b] hover:bg-[#e2e8f0] rounded-full"><X size={24} /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-[#fff7ed] border border-[#fed7aa] p-4 rounded-[8px] flex items-start gap-3">
                <Lightbulb size={20} className="text-[#ea580c] flex-shrink-0 mt-0.5" />
                <div className="text-[13px] text-[#9a3412] leading-relaxed">
                  系統變數支援：<code className="bg-white px-1 font-mono rounded">{"{{productName}}"}</code>, <code className="bg-white px-1 font-mono rounded">{"{{features}}"}</code>, <code className="bg-white px-1 font-mono rounded">{"{{seoTags}}"}</code>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COPY_PLATFORMS.map(p => (
                  <div key={p.id} className="space-y-2 bg-[#f8fafc] p-4 rounded-[10px] border border-[#e2e8f0]">
                    <label className="text-[14px] font-bold flex items-center gap-2"><p.icon size={14} className={p.color}/> {p.name}</label>
                    <textarea value={templates[p.id]} onChange={e => setTemplates(prev => ({...prev, [p.id]: e.target.value}))} rows={5} className="w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-[6px] text-[13px] font-mono outline-none focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#e2e8f0] bg-white flex justify-end gap-3">
              <button onClick={() => setTemplates(COPY_DEFAULT_TEMPLATES)} className="mr-auto text-[13px] font-medium text-[#64748b] underline">還原預設值</button>
              <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2.5 text-[14px] font-bold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-[8px]">取消</button>
              <button onClick={saveTemplates} className="px-5 py-2.5 bg-[#0f172a] text-white text-[14px] font-bold rounded-[8px] hover:bg-[#1e293b] flex items-center gap-2"><CheckCircle2 size={16} /> 儲存設定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}