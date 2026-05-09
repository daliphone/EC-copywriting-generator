import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Copy, Loader2, RefreshCw,
  ShoppingBag, ShoppingCart, Box,
  Settings, X, Zap,
  Check, AlertTriangle, Tag, LayoutTemplate, LayoutPanelLeft,
  ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================
// 平台規範（基於官方文件確認）
// 蝦皮：120字上限，允許促銷字，關鍵字前置
// Momo：60字上限，禁所有促銷/活動/贈品/熱銷用語，品牌系統帶入
// Yahoo：60字上限，允許促銷字，格式清晰為主
// ============================================================
const TITLE_PLATFORMS = [
  {
    id: 'Shopee 蝦皮', short: '蝦皮', icon: ShoppingBag,
    color: 'text-[#ee4d2d]', bg: 'bg-[#ee4d2d]/10',
    desc: '120字・長尾關鍵字', limit: 120, promoOk: true,
    tip: '關鍵字前置，前30字最重要。可用促銷標籤。'
  },
  {
    id: 'Momo 購物網', short: 'Momo', icon: ShoppingCart,
    color: 'text-[#d71559]', bg: 'bg-[#d71559]/10',
    desc: '60字・嚴禁促銷用語', limit: 60, promoOk: false,
    tip: '格式：品牌＋品名＋特色關鍵字。活動/贈品/熱銷/代言等字眼一律禁止。'
  },
  {
    id: 'Yahoo 奇摩', short: 'Yahoo', icon: Box,
    color: 'text-[#6e1fbd]', bg: 'bg-[#6e1fbd]/10',
    desc: '60字・可含促銷', limit: 60, promoOk: true,
    tip: '促銷標籤可放前段，格式清晰，品牌＋型號＋規格＋促銷。'
  },
];

// ============================================================
// 文案產生器平台（4個）
// ============================================================
const COPY_PLATFORMS = [
  { id: 'shopee', name: '蝦皮購物', icon: ShoppingBag, color: 'text-[#ee4d2d]', bg: 'bg-[#ee4d2d]/10' },
  { id: 'momo',   name: 'momo購物網', icon: ShoppingCart, color: 'text-[#d71559]', bg: 'bg-[#d71559]/10' },
  { id: 'pchome', name: 'PChome', icon: Box, color: 'text-[#00509e]', bg: 'bg-[#00509e]/10' },
  { id: 'yahoo',  name: 'Yahoo拍賣', icon: Tag, color: 'text-[#6e1fbd]', bg: 'bg-[#6e1fbd]/10' },
];

const TONES = [
  { id: 'professional', label: '專業', icon: '👔' },
  { id: 'friendly',     label: '親切', icon: '😊' },
  { id: 'lively',       label: '活潑', icon: '🎉' },
  { id: 'urgent',       label: '促銷急迫', icon: '🔥' },
];

const COPY_DEFAULT_TEMPLATES = {
  shopee: '🔥 限時特賣 🔥\n【{{productName}}】\n\n✅ 核心特色：\n{{features}}\n\n🚚 蝦皮店到店免運中！',
  momo:   '【原廠公司貨】{{productName}}\n\n保證原廠公司貨，品質有保障。\n\n📌 核心規格：\n{{features}}',
  pchome: '{{productName}}\n\n■ {{features}}',
  yahoo:  '【Yahoo嚴選】{{productName}}\n\n💯 買家好評推薦！\n👉 {{features}}\n\n🎁 立即下標，超商取貨付款最安心！',
};

// ============================================================
// 違規詞：通用黑名單（誇大不實、醫療聲稱、導外）
// ============================================================
const TITLE_BLACKLIST = [
  /第一/, /最強/, /最好/, /世界級/, /保證獲利/, /永久/, /唯一/,
  /殺菌/, /療效/, /官方唯一指定/, /全網最低/, /加賴/, /私下交易/, /Line/,
  /減肥/, /瘦身/, /降血壓/, /治療/, /消炎/, /醫療級/, /抗癌/, /療癒/
];

// Momo 額外禁用：任何促銷、活動、贈品相關文案
const MOMO_TITLE_BLACKLIST = [
  '活動', '贈送', '代言', '熱銷', '限時', '下殺', '折扣', '特價',
  '爆款', '免運', '免費', '優惠', '搶購', '瘋搶'
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
  "45W":      "45W快充",    "IP67":    "防塵防水",
  "4K":       "4K超清",     "HDR":     "HDR顯示",
};

const TITLE_DEFAULTS = {
  "Shopee 蝦皮": { brand: "Soundcore", model: "Liberty 4 NC", specs: "ANC, IP68", promo: "限時", sellingPoints: "搭載業界頂尖主動降噪，單次續航 10 小時。", audience: "通勤族", seo: "降噪耳機, 平替AirPods" },
  "Momo 購物網": { brand: "Apple",     model: "iPhone 16",    specs: "5G, 128GB",  promo: "",     sellingPoints: "A18 晶片強勁，台灣公司貨。", audience: "果粉升級", seo: "iPhone 16, 原廠保固" },
  "Yahoo 奇摩":  { brand: "Samsung",   model: "S25",          specs: "120Hz, 5G", promo: "9折",  sellingPoints: "Galaxy AI 全面進化，夜拍業界頂尖。", audience: "安卓忠實用戶", seo: "三星手機, 5G手機推薦" },
};

// ============================================================
// 主應用程式
// ============================================================
export default function App() {
  const [activeApp, setActiveApp]         = useState('title');
  const [isModernLayout, setIsModernLayout] = useState(true);
  const [copiedState, setCopiedState]     = useState({});

  // --- BFF API 代理呼叫 ---
  const callGeminiAPI = async (promptText, systemInstruction, responseSchema, maxRetries = 3) => {
    const internalToken = import.meta.env.VITE_INTERNAL_TOKEN;
    if (!internalToken) {
      console.error('🚨 找不到 VITE_INTERNAL_TOKEN，請確認 .env.local 設定');
    }
    const delays = [1000, 2000, 4000];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${internalToken}`
          },
          body: JSON.stringify({ promptText, systemInstruction, responseSchema })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 404) throw new Error('無法連線至後端，請確認 /api/ai.js 已部署至 Vercel');
          throw new Error(`系統提示 (${response.status}): ${errData.error || errData.details || '連線失敗'}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('無效的系統回應格式（內容為空）');
        return JSON.parse(text);
      } catch (err) {
        if (attempt === maxRetries - 1) throw new Error(err.message);
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  };

  // --- 複製（優先 clipboard API，降級 execCommand）---
  const handleCopy = (text, id) => {
    if (!text) return;
    const onSuccess = () => {
      setCopiedState(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedState(prev => ({ ...prev, [id]: false })), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => legacyCopy(text, onSuccess));
    } else {
      legacyCopy(text, onSuccess);
    }
  };

  const legacyCopy = (text, cb) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) {}
    document.body.removeChild(ta);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] pb-12" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif' }}>
      <nav className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ShoppingCart size={22} className="text-[#ea580c]" />
            <span className="font-bold text-[16px] hidden sm:inline">Money Engine 電商工具箱</span>
          </div>
          <div className="flex items-center gap-2 sm:ml-4 sm:border-l border-[#e2e8f0] sm:pl-4">
            <button onClick={() => setActiveApp('title')}
              className={`px-3 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${activeApp === 'title' ? 'text-[#ea580c] bg-[#fff7ed]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'}`}>
              🎯 雙軌標題引擎
            </button>
            <button onClick={() => setActiveApp('copywriter')}
              className={`px-3 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${activeApp === 'copywriter' ? 'text-[#ea580c] bg-[#fff7ed]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'}`}>
              ✍️ AI 文案產生器
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-[#f1f5f9] p-1 rounded-[8px] border border-[#e2e8f0]">
            <button onClick={() => setIsModernLayout(false)}
              className={`px-3 py-1 text-[12px] font-bold rounded-[6px] transition-all flex items-center gap-1.5 ${!isModernLayout ? 'bg-white text-[#ea580c] shadow-sm' : 'text-[#64748b]'}`}>
              <LayoutPanelLeft size={14} /> 傳統雙欄
            </button>
            <button onClick={() => setIsModernLayout(true)}
              className={`px-3 py-1 text-[12px] font-bold rounded-[6px] transition-all flex items-center gap-1.5 ${isModernLayout ? 'bg-white text-[#ea580c] shadow-sm' : 'text-[#64748b]'}`}>
              <LayoutTemplate size={14} /> 全域頂部
            </button>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#f8bc94] text-[#a03600] flex items-center justify-center font-bold shadow-sm">M</div>
        </div>
      </nav>

      {activeApp === 'title'
        ? <TitleEngineApp handleCopy={handleCopy} copiedState={copiedState} callGeminiAPI={callGeminiAPI} isModernLayout={isModernLayout} />
        : <CopywriterApp  handleCopy={handleCopy} copiedState={copiedState} callGeminiAPI={callGeminiAPI} isModernLayout={isModernLayout} />
      }
    </div>
  );
}

// ============================================================
// 雙軌標題引擎
// ============================================================
function TitleEngineApp({ handleCopy, copiedState, callGeminiAPI, isModernLayout }) {
  const [platform, setPlatform]       = useState(TITLE_PLATFORMS[0].id);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [error, setError]             = useState('');
  const [showAiFields, setShowAiFields]   = useState(true);
  const [formData, setFormData]       = useState({ brand: '', model: '', specs: '', promo: '', sellingPoints: '', audience: '', seo: '' });
  const [results, setResults]         = useState({ ruleBased: null, aiBased: null, aiSkipped: false });
  const [rawPaste, setRawPaste]       = useState('');
  const [isParsing, setIsParsing]     = useState(false);

  useEffect(() => {
    const def = TITLE_DEFAULTS[platform] || TITLE_DEFAULTS['Shopee 蝦皮'];
    setFormData(prev => ({ ...prev, ...def }));
  }, []);

  const activePlatConfig = TITLE_PLATFORMS.find(p => p.id === platform);

  // --- Smart Paste ---
  const handleSmartParse = async () => {
    if (!rawPaste.trim()) return;
    setError(''); setIsParsing(true);
    const schema = {
      type: "OBJECT",
      properties: {
        brand: { type: "STRING" }, model: { type: "STRING" }, specs: { type: "STRING" },
        promo: { type: "STRING" }, sellingPoints: { type: "STRING" },
        audience: { type: "STRING" }, seo: { type: "STRING" }
      },
      required: ["brand", "model", "sellingPoints", "audience", "seo"]
    };
    try {
      const res = await callGeminiAPI(rawPaste, '你是頂尖電商助理，從商品描述中提取結構化資訊。', schema);
      if (res) {
        setFormData(prev => ({
          ...prev,
          brand: res.brand || prev.brand, model: res.model || prev.model,
          specs: res.specs || prev.specs, promo: res.promo || prev.promo,
          sellingPoints: res.sellingPoints || prev.sellingPoints,
          audience: res.audience || prev.audience, seo: res.seo || prev.seo
        }));
        setRawPaste('');
      }
    } catch (err) { setError(`<b>AI 解析失敗</b><br/>${err.message}`); }
    finally { setIsParsing(false); }
  };

  // --- 合規檢查 ---
  const checkCompliance = (text) => {
    for (const pattern of TITLE_BLACKLIST) {
      if (pattern.test(text)) return { ok: false, word: pattern.source };
    }
    return { ok: true };
  };

  const checkMomoCompliance = (text) => {
    const hit = MOMO_TITLE_BLACKLIST.find(w => text.includes(w));
    return hit ? { ok: false, word: hit } : { ok: true };
  };

  // --- 規格翻譯 ---
  const translateSpecs = (specsStr) =>
    specsStr.split(',').map(s => SPEC_TRANSLATION[s.trim()] || s.trim()).filter(Boolean);

  const cleanParts = (parts, sep = ' | ') =>
    parts.filter(p => p && p.trim()).join(sep);

  // --- 規則引擎（依官方規範）---
  const generateRuleBasedTitles = () => {
    const { brand, model, specs, promo } = formData;
    const ts  = translateSpecs(specs);
    const ss  = cleanParts(ts, ' ');
    const top = ts[0] || '';

    if (platform === 'Shopee 蝦皮') {
      // 蝦皮：120字，前30字放最重要關鍵字，促銷標籤可用
      const tag = promo ? `[${promo.substring(0, 5)}]` : '';
      return [
        { strategy: '🛡️ 標準公版', title: cleanParts([tag, brand, model, ss, '馬尼通訊']).substring(0, 120) },
        { strategy: '💡 痛點先決', title: cleanParts([tag, ss, `${brand} ${model}`, '馬尼通訊']).substring(0, 120) },
        { strategy: '✨ 焦點主打', title: cleanParts([tag, brand, model, top, '馬尼通訊']).substring(0, 120) },
      ];
    }

    if (platform === 'Momo 購物網') {
      // Momo：60字，格式：品牌＋品名＋特色關鍵字，嚴禁促銷用語
      return [
        { strategy: '🛡️ 標準公版', title: cleanParts([brand, model, ss]).substring(0, 60) },
        { strategy: '👑 旗艦質感', title: cleanParts([`${brand} 官方旗艦`, model, '原廠公司貨', ss]).substring(0, 60) },
        { strategy: '🔄 規格倒裝', title: cleanParts([model, ss, brand]).substring(0, 60) },
      ];
    }

    // Yahoo 奇摩：60字，可含促銷標籤，格式清晰
    const promoTag = promo ? `[${promo}]` : '';
    return [
      { strategy: '🔥 促銷帶量', title: cleanParts([promoTag, brand, model, top]).substring(0, 60) },
      { strategy: '🏢 品牌本位', title: cleanParts([brand, model, ss]).substring(0, 60) },
      { strategy: '⚙️ 規格直擊', title: cleanParts([brand, model, ts[0] || '', ts[1] || '']).substring(0, 60) },
    ];
  };

  // --- 主執行 ---
  const handleGenerate = async () => {
    const allInput = `${formData.brand} ${formData.model} ${formData.specs} ${formData.promo} ${formData.sellingPoints}`;
    const compliance = checkCompliance(allInput);
    if (!compliance.ok) { setError(`🚨 通用違規詞彙：「${compliance.word}」`); return; }
    if (platform === 'Momo 購物網') {
      const momoCheck = checkMomoCompliance(allInput);
      if (!momoCheck.ok) { setError(`⚠️ Momo 禁用詞：「${momoCheck.word}」，Momo 標題禁止任何促銷用語`); return; }
    }
    if (!formData.brand || !formData.model) { setError('請填寫品牌與型號'); return; }

    setError('');
    setIsGenerating(true);
    const ruleBased = generateRuleBasedTitles();
    setResults({ ruleBased, aiBased: null, aiSkipped: false });
    setIsGenerating(false);

    const shouldRunAi = !!(formData.sellingPoints.trim() || formData.audience.trim() || formData.seo.trim());
    if (!shouldRunAi) {
      setResults(prev => ({ ...prev, aiSkipped: true }));
      return;
    }

    setIsAiGenerating(true);
    try {
      const platformRules = {
        'Shopee 蝦皮': `蝦皮標題上限120字，前30字放最重要關鍵字，可用促銷標籤，加入「馬尼通訊」店家名稱`,
        'Momo 購物網': `Momo標題上限60字，格式：品牌+品名+特色關鍵字，嚴禁使用任何促銷/活動/贈品/熱銷/代言等字眼`,
        'Yahoo 奇摩':  `Yahoo拍賣標題上限60字，可含促銷標籤放前段，格式：[促銷] 品牌 型號 規格`
      };
      const sysPrompt = `你是頂尖電商文案專家。${platformRules[platform]}。產出3個高轉換標題，每個附一句簡短策略說明。`;
      const userPrompt = `品牌:${formData.brand} 型號:${formData.model} 規格:${formData.specs} 賣點:${formData.sellingPoints} 目標族群:${formData.audience} SEO關鍵字:${formData.seo}`;
      const schema = {
        type: "OBJECT",
        properties: {
          options: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { title: { type: "STRING" }, reason: { type: "STRING" } }
            }
          }
        },
        required: ["options"]
      };
      const aiData = await callGeminiAPI(userPrompt, sysPrompt, schema);
      setResults(prev => ({ ...prev, aiBased: aiData.options }));
    } catch (err) {
      setError(`<b>AI 生成失敗</b><br/>${err.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // --- 字元徽章 ---
  const getCharBadge = (title, limit) => {
    const len = title.length;
    if (!limit) return <span className="text-[12px] px-2 py-0.5 rounded-[4px] font-mono bg-slate-100 text-slate-500">{len} 字元</span>;
    const ratio = len / limit;
    const cls = ratio > 1 ? 'bg-red-100 text-red-700' : ratio > 0.85 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
    return <span className={`text-[12px] px-2 py-0.5 rounded-[4px] font-mono ${cls}`}>{len} / {limit} 字元</span>;
  };

  // --- Smart Paste 區塊 ---
  const SmartPasteSection = () => (
    <div className={`bg-[#f0fdf4] rounded-[12px] border border-[#bbf7d0] shadow-sm p-4 ${isModernLayout ? 'mb-6' : ''}`}>
      <label className="text-[13px] font-bold text-[#166534] flex items-center gap-2 mb-1.5">
        <Sparkles size={16} className="text-[#22c55e]" /> 🪄 AI 解析器（Smart Paste）
      </label>
      <div className="relative">
        <textarea value={rawPaste} onChange={e => setRawPaste(e.target.value)}
          placeholder="貼上任何商品原始資料，AI 自動拆解填入欄位..."
          rows={isModernLayout ? 4 : 3}
          className="w-full px-3 py-2.5 bg-white border border-[#86efac] rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#22c55e]/50 pb-12 resize-none" />
        <button onClick={handleSmartParse} disabled={!rawPaste.trim() || isParsing}
          className="absolute right-2 bottom-2 bg-[#22c55e] text-white text-[12px] font-bold px-3 py-1.5 rounded-[6px] disabled:opacity-50 flex items-center gap-1.5">
          {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} AI 解析
        </button>
      </div>
    </div>
  );

  // --- 表單區塊 ---
  const FormSection = () => (
    <div className="space-y-5">
      {/* 平台選擇 */}
      <div className="grid grid-cols-3 gap-3">
        {TITLE_PLATFORMS.map(p => (
          <button key={p.id} onClick={() => setPlatform(p.id)}
            className={`flex flex-col items-center p-3 rounded-[10px] border-2 transition-all ${platform === p.id ? 'border-[#ea580c] bg-white shadow-md' : 'border-[#e2e8f0] bg-white hover:border-gray-300'}`}>
            <p.icon size={20} className={p.color} />
            <span className="font-bold text-[13px] mt-1">{p.short}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{p.desc}</span>
          </button>
        ))}
      </div>

      {/* 平台規範提示 */}
      {activePlatConfig && (
        <div className={`text-[12px] px-3 py-2 rounded-[8px] border ${platform === 'Momo 購物網' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
          📋 {activePlatConfig.tip}
        </div>
      )}

      {/* 基本資料 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">基本資訊（必填）</p>
        <div className="grid grid-cols-2 gap-4">
          <input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
            placeholder="品牌" className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20" />
          <input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}
            placeholder="型號" className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20" />
        </div>
        <input value={formData.specs} onChange={e => setFormData({ ...formData, specs: e.target.value })}
          placeholder="規格（逗號分隔，例：ANC, IP68, 5G）"
          className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20" />
        <div className="relative">
          <input value={formData.promo} onChange={e => setFormData({ ...formData, promo: e.target.value })}
            placeholder={platform === 'Momo 購物網' ? '促銷活動（Momo 禁止填寫）' : '促銷活動（例：限時、9折）'}
            disabled={platform === 'Momo 購物網'}
            className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" />
          {platform === 'Momo 購物網' && (
            <span className="absolute right-3 top-2.5 text-[11px] text-red-500 font-bold">禁止</span>
          )}
        </div>
      </div>

      {/* AI 賦能參數 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm overflow-hidden">
        <button onClick={() => setShowAiFields(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
          <span className="text-[13px] font-bold text-[#334155] flex items-center gap-2">
            <Sparkles size={14} className="text-[#8b5cf6]" /> AI 賦能參數
            <span className="text-[11px] font-normal text-gray-400">（選填，越完整 AI 標題越準）</span>
          </span>
          {showAiFields ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showAiFields && (
          <div className="px-5 pb-5 space-y-3 border-t border-[#f1f5f9]">
            <textarea value={formData.sellingPoints}
              onChange={e => setFormData({ ...formData, sellingPoints: e.target.value })}
              placeholder="產品賣點 / 痛點 / 使用情境（例：通勤族必備，秒降噪，單次10小時續航）"
              rows={2}
              className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 resize-none mt-3" />
            <div className="grid grid-cols-2 gap-3">
              <input value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })}
                placeholder="目標族群（例：通勤族、學生）"
                className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#8b5cf6]/30" />
              <input value={formData.seo} onChange={e => setFormData({ ...formData, seo: e.target.value })}
                placeholder="SEO 關鍵字（逗號分隔）"
                className="w-full px-3 py-2 bg-[#f8fafc] border rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#8b5cf6]/30" />
            </div>
          </div>
        )}
      </div>

      {/* 執行按鈕 */}
      <button onClick={handleGenerate} disabled={isGenerating || isAiGenerating}
        className={`w-full flex items-center justify-center gap-2 bg-[#ea580c] text-white py-4 rounded-[10px] font-bold shadow-lg hover:bg-[#c2410c] disabled:opacity-60 transition-colors ${isModernLayout ? 'sticky bottom-4 z-10' : ''}`}>
        {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
        🚀 產出雙軌標題
      </button>
    </div>
  );

  // --- 結果區塊 ---
  const ResultSection = () => (
    <div className="flex flex-col gap-6">
      {/* 規則引擎結果 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold mb-4">🛡️ 規則引擎</h3>
        {!results.ruleBased
          ? <div className="text-[14px] text-gray-400 py-8 text-center bg-gray-50 rounded-[8px]">等待指派任務...</div>
          : (
            <div className="space-y-4">
              {results.ruleBased.map((res, i) => (
                <div key={i} className="border-l-4 border-[#ea580c] bg-white border border-[#f1f5f9] p-4 relative shadow-sm rounded-r-[6px]">
                  <div className="flex justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-500">{res.strategy}</span>
                    {getCharBadge(res.title, activePlatConfig.limit)}
                  </div>
                  <div className="text-[15px] font-bold text-[#0f172a] pr-12 leading-snug">{res.title}</div>
                  <button onClick={() => handleCopy(res.title, `rule_${i}`)}
                    className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 rounded transition-colors">
                    {copiedState[`rule_${i}`] ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* AI 創意提案 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold mb-4">🔮 AI 創意提案</h3>
        {!results.ruleBased
          ? <div className="text-[14px] text-gray-400 py-8 text-center bg-gray-50 rounded-[8px]">等待指派任務...</div>
          : isAiGenerating
          ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border border-[#e9d5ff] bg-[#faf5ff] p-4 rounded-[8px] animate-pulse">
                  <div className="h-3 bg-purple-100 rounded w-1/4 mb-3"></div>
                  <div className="h-5 bg-purple-100 rounded w-3/4"></div>
                </div>
              ))}
              <p className="text-[12px] text-purple-500 text-center mt-1 flex items-center justify-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> AI 正依 {activePlatConfig.short} 演算法生成創意標題...
              </p>
            </div>
          )
          : results.aiSkipped
          ? <div className="text-[13px] text-orange-600 p-4 bg-orange-50 rounded-[8px] border border-orange-100">💡 請填寫「AI 賦能參數」（賣點/族群/SEO 其中一項）即可觸發 AI 引擎。</div>
          : (
            <div className="space-y-4">
              {results.aiBased?.map((res, i) => (
                <div key={i} className="border-l-4 border-[#8b5cf6] bg-white border border-[#f1f5f9] p-4 relative shadow-sm rounded-r-[6px]">
                  <div className="flex justify-between mb-2">
                    <span className="text-[12px] font-bold text-purple-500">提案 {i + 1}</span>
                    {getCharBadge(res.title, activePlatConfig.limit)}
                  </div>
                  <div className="text-[15px] font-bold text-[#0f172a] pr-12 leading-snug">{res.title}</div>
                  {res.reason && (
                    <p className="text-[12px] text-purple-400 mt-2 border-l-2 border-purple-200 pl-2">{res.reason}</p>
                  )}
                  <button onClick={() => handleCopy(res.title, `ai_${i}`)}
                    className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 rounded transition-colors">
                    {copiedState[`ai_${i}`] ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 relative">
      {/* 錯誤訊息 */}
      {error && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-5 py-3.5 rounded-[12px] shadow-2xl max-w-[90vw] md:max-w-[520px]">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-[14px] font-medium flex-1" dangerouslySetInnerHTML={{ __html: error }} />
          <button onClick={() => setError('')} className="text-[#fca5a5] hover:text-[#dc2626]"><X size={18} /></button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-[26px] font-bold">🎯 雙軌標題引擎</h1>
        <p className="text-gray-500 text-[14px]">規則保底 ✕ AI 創意，蝦皮／Momo／Yahoo 平台規範已內建。</p>
      </div>

      <div className={isModernLayout ? 'animate-in fade-in duration-500' : 'animate-in fade-in duration-300'}>
        {isModernLayout && <SmartPasteSection />}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-5 relative">
            {!isModernLayout && <SmartPasteSection />}
            <FormSection />
          </div>
          <div className="md:col-span-7"><ResultSection /></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AI 文案產生器
// ============================================================
function CopywriterApp({ handleCopy, copiedState, callGeminiAPI, isModernLayout }) {
  const [formData, setFormData]         = useState({ productName: '', features: '', seoTags: '', tone: 'professional' });
  const [generationMode, setGenerationMode] = useState('template');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [templates, setTemplates]       = useState(COPY_DEFAULT_TEMPLATES);
  const [selectedPlatform, setSelectedPlatform] = useState('shopee');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults]           = useState(null);
  const [error, setError]               = useState('');
  const resultRef                       = useRef(null);
  const [rawPaste, setRawPaste]         = useState('');
  const [isParsing, setIsParsing]       = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('money_copywriter_templates');
    if (saved) { try { setTemplates(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const saveTemplates = () => {
    localStorage.setItem('money_copywriter_templates', JSON.stringify(templates));
    setIsSettingsOpen(false);
  };

  const handleInput = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSmartParse = async () => {
    if (!rawPaste.trim()) return;
    setError(''); setIsParsing(true);
    const schema = {
      type: "OBJECT",
      properties: { productName: { type: "STRING" }, features: { type: "STRING" }, seoTags: { type: "STRING" } },
      required: ["productName", "features", "seoTags"]
    };
    try {
      const res = await callGeminiAPI(rawPaste, '提取商品名稱、核心特色與 SEO 標籤。', schema);
      if (res) {
        setFormData(prev => ({
          ...prev,
          productName: res.productName || prev.productName,
          features: res.features || prev.features,
          seoTags: res.seoTags || prev.seoTags
        }));
        setRawPaste('');
      }
    } catch (err) { setError(`<b>AI 解析失敗</b><br/>${err.message}`); }
    finally { setIsParsing(false); }
  };

  const handleGenerate = async () => {
    if (!formData.productName.trim() || !formData.features.trim()) {
      setError('「商品名稱」與「特色」為必填。'); return;
    }
    setError(''); setIsGenerating(true);

    if (generationMode === 'template') {
      setTimeout(() => {
        const baseTags = formData.seoTags
          ? formData.seoTags.split(',').map(t => t.trim())
          : [formData.productName.split(' ')[0], '熱銷推薦'];
        const newResults = {};
        COPY_PLATFORMS.forEach(p => {
          const body = templates[p.id]
            .replace(/{{productName}}/g, formData.productName)
            .replace(/{{features}}/g, formData.features)
            .replace(/{{seoTags}}/g, formData.seoTags || '');
          newResults[p.id] = { title: formData.productName, body, tags: baseTags };
        });
        setResults(newResults);
        setIsGenerating(false);
        if (window.innerWidth < 768) resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
      return;
    }

    try {
      const toneLabel = TONES.find(t => t.id === formData.tone)?.label || '專業';
      const platformSchema = {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" }, body: { type: "STRING" },
          tags: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["title", "body", "tags"]
      };
      const responseSchema = {
        type: "OBJECT",
        properties: { shopee: platformSchema, momo: platformSchema, pchome: platformSchema, yahoo: platformSchema },
        required: ["shopee", "momo", "pchome", "yahoo"]
      };
      const generatedJson = await callGeminiAPI(
        `商品：${formData.productName}\n特色：${formData.features}\nSEO標籤：${formData.seoTags}\n文案風格：${toneLabel}`,
        '你是頂尖電商文案專家。依各平台特性（蝦皮可活潑促銷、Momo需正式無促銷字眼、PChome專業規格導向、Yahoo可強調價格）一次產出4平台文案。',
        responseSchema
      );
      setResults(generatedJson);
      if (window.innerWidth < 768) resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(`<b>AI 生成失敗</b><br/>${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFullText = k => results?.[k]
    ? `【${results[k].title}】\n\n${results[k].body}\n\n${results[k].tags?.map(t => `#${t}`).join(' ') || ''}`
    : '';

  const SmartPasteArea = () => (
    <div className={`bg-[#fff7ed] rounded-[12px] border border-[#fed7aa] shadow-sm p-4 ${isModernLayout ? 'mb-6' : ''}`}>
      <label className="text-[13px] font-bold text-orange-800 flex items-center gap-2 mb-1.5">
        <Sparkles size={16} className="text-[#ea580c]" /> 🪄 AI 解析器（Smart Paste）
      </label>
      <div className="relative">
        <textarea value={rawPaste} onChange={e => setRawPaste(e.target.value)}
          placeholder="貼上商品資訊或對話，AI 自動拆解填入..."
          rows={isModernLayout ? 4 : 3}
          className="w-full px-3 py-2.5 bg-white border border-[#fdba74] rounded-[8px] text-[13px] outline-none focus:ring-2 focus:ring-[#ea580c]/50 pb-12 resize-none shadow-inner" />
        <button onClick={handleSmartParse} disabled={!rawPaste.trim() || isParsing}
          className="absolute right-2 bottom-2 bg-[#ea580c] text-white text-[12px] font-bold px-3 py-1.5 rounded-[6px] disabled:opacity-50 flex items-center gap-1.5">
          {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} AI 解析
        </button>
      </div>
    </div>
  );

  const FormSection = () => (
    <div className="space-y-5">
      {/* 模式切換 */}
      <div className="bg-white p-1.5 rounded-[10px] border border-[#e2e8f0] shadow-sm flex items-center">
        <button onClick={() => setGenerationMode('template')}
          className={`flex-1 py-2.5 text-[14px] font-bold rounded-[6px] transition-colors ${generationMode === 'template' ? 'bg-white text-[#0f172a] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>
          📄 模組文案
        </button>
        <button onClick={() => setGenerationMode('ai')}
          className={`flex-1 py-2.5 text-[14px] font-bold rounded-[6px] transition-colors ${generationMode === 'ai' ? 'bg-white text-[#ea580c] shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:text-gray-700'}`}>
          🤖 AI 智能生成
        </button>
      </div>

      {/* 表單欄位 */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm p-5 space-y-4">
        <input name="productName" value={formData.productName} onChange={handleInput}
          placeholder="商品名稱 *"
          className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 shadow-sm" />
        <textarea name="features" value={formData.features} onChange={handleInput}
          rows={4} placeholder="核心規格與賣點描述 *"
          className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 resize-none shadow-sm" />
        <input name="seoTags" value={formData.seoTags} onChange={handleInput}
          placeholder="SEO 標籤池（選填，逗號分隔）"
          className="w-full px-3 py-2.5 bg-[#f8fafc] border rounded-[8px] text-[14px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 shadow-sm" />

        {/* 語氣選擇（AI 模式才顯示）*/}
        {generationMode === 'ai' && (
          <div>
            <p className="text-[12px] font-bold text-gray-500 mb-2">文案風格</p>
            <div className="grid grid-cols-4 gap-2">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setFormData(prev => ({ ...prev, tone: t.id }))}
                  className={`flex flex-col items-center py-2 px-1 rounded-[8px] border-2 text-[12px] font-bold transition-all ${formData.tone === t.id ? 'border-[#ea580c] bg-[#fff7ed] text-[#ea580c]' : 'border-[#e2e8f0] text-gray-500 hover:border-gray-300'}`}>
                  <span className="text-[18px] mb-0.5">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 執行按鈕 */}
      <button onClick={handleGenerate} disabled={isGenerating}
        className={`w-full flex items-center justify-center gap-2 text-white py-4 rounded-[10px] font-bold shadow-lg disabled:opacity-60 transition-colors ${generationMode === 'ai' ? 'bg-[#ea580c] hover:bg-[#c2410c]' : 'bg-[#0f172a] hover:bg-[#1e293b]'} ${isModernLayout ? 'sticky bottom-4 z-10' : ''}`}>
        {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
        {generationMode === 'ai' ? '一鍵生成跨平台文案' : '產出模組文案'}
      </button>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 relative">
      {error && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-5 py-3.5 rounded-[12px] shadow-2xl max-w-[90vw] md:max-w-[520px]">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-[14px] font-medium flex-1" dangerouslySetInnerHTML={{ __html: error }} />
          <button onClick={() => setError('')} className="text-[#fca5a5] hover:text-[#dc2626]"><X size={18} /></button>
        </div>
      )}

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-[26px] font-bold">✍️ AI 文案產生器</h1>
          <p className="text-gray-500 text-[14px]">蝦皮／momo／PChome／Yahoo 四平台文案同步生成。</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1.5 text-[13px] border px-3 py-1.5 rounded-[8px] bg-white hover:bg-gray-50 transition-colors">
          <Settings size={16} /> 模組設定
        </button>
      </div>

      <div className={isModernLayout ? 'animate-in fade-in duration-500' : 'animate-in fade-in duration-300'}>
        {isModernLayout && <SmartPasteArea />}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-5 relative">
            {!isModernLayout && <SmartPasteArea />}
            <FormSection />
          </div>
          <div className="md:col-span-7" ref={resultRef}>
            {/* 主要文案預覽 */}
            <div className="bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm flex flex-col min-h-[450px]">
              {results ? (() => {
                const res = results[selectedPlatform];
                const platName = COPY_PLATFORMS.find(p => p.id === selectedPlatform)?.name;
                return (
                  <>
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-[12px]">
                      <h2 className="text-[18px] font-bold">{platName} 文案</h2>
                      <button onClick={() => handleCopy(getFullText(selectedPlatform), 'main')}
                        className="bg-[#0f172a] text-white px-4 py-2 rounded-[8px] text-[14px] font-bold hover:bg-[#1e293b] transition-colors flex items-center gap-2">
                        {copiedState['main'] ? <Check size={14} /> : <Copy size={14} />}
                        {copiedState['main'] ? '已複製' : '一鍵複製'}
                      </button>
                    </div>
                    <div className="p-6 flex-1 space-y-5">
                      <div className="text-[16px] font-bold bg-[#f8fafc] p-3 rounded-[8px] border shadow-inner">{res?.title}</div>
                      <div className="text-[14px] leading-relaxed bg-[#f8fafc] p-4 rounded-[8px] border whitespace-pre-wrap shadow-inner min-h-[200px]">{res?.body}</div>
                      {res?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {res.tags.map((tag, i) => (
                            <span key={i} className="text-[12px] bg-[#f1f5f9] text-[#64748b] px-2 py-1 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
                  <RefreshCw size={40} className="mb-4 opacity-20" />
                  <p className="font-bold">等待指派任務...</p>
                </div>
              )}
            </div>

            {/* 平台切換卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              {COPY_PLATFORMS.map(p => (
                <div key={p.id} onClick={() => setSelectedPlatform(p.id)}
                  className={`p-4 border rounded-[10px] cursor-pointer bg-white transition-all ${selectedPlatform === p.id ? 'border-[#ea580c] ring-2 ring-orange-50 shadow-md' : 'hover:border-gray-300 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-[13px]">{p.name}</span>
                    <button onClick={e => { e.stopPropagation(); handleCopy(getFullText(p.id), p.id); }}
                      className="text-[11px] text-orange-600 font-bold underline hover:no-underline">
                      {copiedState[p.id] ? '✓' : '複製'}
                    </button>
                  </div>
                  <div className="text-[11px] text-gray-500 line-clamp-2 h-[32px]">
                    {results?.[p.id]?.body || '尚未生成...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 模組設定 Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-bold text-[18px]">產出模組設定</h3>
              <button onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 bg-white">
              <p className="text-[12px] text-gray-500">可用變數：<code className="bg-gray-100 px-1 rounded">{'{{productName}}'}</code>、<code className="bg-gray-100 px-1 rounded">{'{{features}}'}</code>、<code className="bg-gray-100 px-1 rounded">{'{{seoTags}}'}</code></p>
              {COPY_PLATFORMS.map(p => (
                <div key={p.id} className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#334155]">{p.name}</label>
                  <textarea value={templates[p.id]} onChange={e => setTemplates(prev => ({ ...prev, [p.id]: e.target.value }))}
                    rows={4} className="w-full p-3 border rounded-[10px] font-mono text-[12px] outline-none focus:ring-2 focus:ring-[#ea580c]/20 shadow-inner resize-none" />
                </div>
              ))}
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2.5 border rounded-[10px] text-[14px] text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={saveTemplates} className="px-6 py-2.5 bg-[#0f172a] text-white rounded-[10px] text-[14px] font-bold hover:bg-[#1e293b]">儲存變更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
