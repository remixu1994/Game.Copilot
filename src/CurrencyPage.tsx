import { useEffect, useMemo, useState } from 'react';
import { sitePath } from './sitePaths';
import './currency.css';
import './currency-theme.css';

type ShopItem = { name: string; eventCoins: number; crystalPrice?: number; crystalQuantity?: number; crystalCurrency?: 'red' | 'blue' | 'mixed'; crystalNote?: string; crystalComparable?: boolean; privatePrice?: number; privateQuantity?: number; icon: string; image?: string };
const shopItems: ShopItem[] = [
  { name: '幸运百卷轴7%', eventCoins: 1500, crystalPrice: 359, icon: '卷' }, { name: '神话宝石随机礼盒', eventCoins: 20000, crystalPrice: 4273, icon: '宝' },
  { name: '传说宝石自选礼盒', eventCoins: 5500, crystalPrice: 1134, icon: '宝' }, { name: '顶级宝石成长秘药', eventCoins: 800, crystalPrice: 415, crystalQuantity: 2, icon: '药' },
  { name: '高级宝石成长秘药', eventCoins: 300, crystalPrice: 249, crystalQuantity: 3, icon: '药' }, { name: '神话装备图纸', eventCoins: 9000, crystalPrice: 1629, privatePrice: 1955, icon: '图' },
  { name: '闪耀的装备图纸碎片', eventCoins: 2000, crystalPrice: 977, crystalCurrency: 'blue', icon: '碎' }, { name: '混沌升品硬币自选礼盒', eventCoins: 1000, crystalPrice: 200, icon: '盒' },
  { name: '高级道具结晶', eventCoins: 800, crystalPrice: 150, privatePrice: 300, privateQuantity: 2, icon: '晶' }, { name: '无瑕级道具结晶', eventCoins: 4500, crystalPrice: 1500, icon: '晶' },
  { name: '神秘的武器研磨石（神话）', eventCoins: 2000, crystalPrice: 252, crystalQuantity: 3, icon: '武' }, { name: '神秘的防具研磨石（神话）', eventCoins: 1000, crystalPrice: 126, icon: '防' },
  { name: '核心宝石', eventCoins: 800, crystalPrice: 1111, crystalQuantity: 5, crystalCurrency: 'mixed', icon: '核' }, { name: '超越催化剂', eventCoins: 1000, crystalPrice: 483, crystalQuantity: 2, icon: '催' },
  { name: '铭文痕迹', eventCoins: 8000, crystalPrice: 5503, crystalCurrency: 'blue', icon: '铭' }, { name: '通用防具铭文刻印卷轴', eventCoins: 50, crystalPrice: 50, icon: '卷' },
  { name: '魔力之锤', eventCoins: 120, crystalPrice: 40, icon: '锤' }, { name: '可疑的金币袋子', eventCoins: 1000, crystalPrice: 120, icon: '袋' },
  { name: '怪物乐园入场券', eventCoins: 60, crystalPrice: 33, privatePrice: 33, icon: '券' },
  { name: '神秘的武器炼成粉（神话）×10', eventCoins: 130, crystalPrice: 359, crystalQuantity: 30, crystalNote: '传说级粉末；1个传说 = 3个神器', crystalComparable: false, icon: '武' },
  { name: '神秘的防具炼成粉（神话）×10', eventCoins: 65, crystalPrice: 179, crystalQuantity: 30, crystalNote: '传说级粉末；1个传说 = 3个神器', crystalComparable: false, icon: '防' },
];
const number = (value: number, digits = 2) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const integer = (value: number) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
const readRatio = (key: string, fallback: number) => { const value = Number(window.localStorage.getItem(key)); return Number.isFinite(value) && value > 0 ? value : fallback; };

function EventShopPage() {
  const [redDiamonds, setRedDiamonds] = useState(() => readRatio('maple-red-diamonds', 500));
  const [eventCoins, setEventCoins] = useState(() => readRatio('maple-event-coins', 1800));
  useEffect(() => { window.localStorage.setItem('maple-red-diamonds', String(redDiamonds)); }, [redDiamonds]);
  useEffect(() => { window.localStorage.setItem('maple-event-coins', String(eventCoins)); }, [eventCoins]);
  const ratio = useMemo(() => redDiamonds / eventCoins, [redDiamonds, eventCoins]);
  const comparableItems = shopItems.filter((item) => item.crystalPrice !== undefined && item.crystalComparable !== false && (item.crystalCurrency ?? 'red') === 'red');
  const averageSaving = useMemo(() => comparableItems.reduce((sum, item) => sum + item.crystalPrice! / (item.crystalQuantity ?? 1) - item.eventCoins * ratio, 0) / comparableItems.length, [ratio]);
  const updateRatio = (setter: (value: number) => void, raw: string) => { const value = Number(raw); if (Number.isFinite(value) && value > 0) setter(value); };
  return <main className="currency-shell">
    <header className="currency-header"><div><a className="currency-brand" href={sitePath('/')}>Maple<span>Lab</span></a><span className="currency-divider">/</span><span>活动币商店</span></div><a href={sitePath('/perfect-core')}>完美核心计算器</a></header>
    <section className="currency-hero"><div><p className="currency-eyebrow">EVENT SHOP DESK</p><h1>活动币价值<br /><span>一眼看懂</span></h1><p>输入你的兑换基准，商品会实时换算成红钻，并与水晶商店价格并排比较。</p></div><div className="currency-orb"><small>1 活动币 ≈</small><strong>{number(ratio, 4)}</strong><small>红钻</small></div></section>
    <section className="currency-workspace"><div className="currency-inputs"><p className="currency-kicker">兑换基准</p><h2>自定义比例</h2><div className="ratio-inputs"><label><span>红钻</span><input type="number" min="1" step="1" value={redDiamonds} onChange={(event) => updateRatio(setRedDiamonds, event.target.value)} /></label><b>=</b><label><span>活动币</span><input type="number" min="1" step="1" value={eventCoins} onChange={(event) => updateRatio(setEventCoins, event.target.value)} /></label></div><button className="reset-ratio" type="button" onClick={() => { setRedDiamonds(500); setEventCoins(1800); }}>恢复默认 500 : 1800</button></div><div className="currency-results"><div><small>当前换算</small><strong>{integer(redDiamonds)} 红钻 = {integer(eventCoins)} 活动币</strong></div><div><small>每 1,000 活动币</small><strong>{number(1000 * ratio)} 红钻</strong></div><div><small>表内平均水晶价差</small><strong className={averageSaving >= 0 ? 'positive' : 'negative'}>{averageSaving >= 0 ? '+' : ''}{number(averageSaving)} 水晶</strong></div></div></section>
    <section className="currency-shop"><div className="currency-kicker">EVENT SHOP ITEMS · {shopItems.length}</div><div className="shop-heading"><div><h2>商品价格对照</h2><p>水晶商店按“每个”归一化比较；蓝钻、混合货币、不同等级粉末或暂无价格的商品只标注，不参与红钻差额计算。</p></div><span className="shop-note">红钻价值按当前比例实时更新</span></div><div className="currency-table"><div className="currency-row currency-row-head"><span>物品</span><span>活动币 / 个</span><span>折算红钻 / 个</span><span>水晶总价 / 数量</span><span>水晶 / 个</span><span>私人商店 / 个</span><span>差额 / 个</span></div>{shopItems.map((item) => { const redValue = item.eventCoins * ratio; const quantity = item.crystalQuantity ?? 1; const currency = item.crystalCurrency ?? 'red'; const crystalUnitPrice = item.crystalPrice === undefined ? null : item.crystalPrice / quantity; const difference = crystalUnitPrice !== null && item.crystalComparable !== false && currency === 'red' ? crystalUnitPrice - redValue : null; const privateUnitPrice = item.privatePrice === undefined ? null : item.privatePrice / (item.privateQuantity ?? 1); const currencyLabel = currency === 'blue' ? '蓝钻' : currency === 'mixed' ? '混合' : '红钻'; return <div className="currency-row" key={item.name}><span className="item-name"><span className="item-image">{item.image ? <img src={item.image} alt="" /> : <b>{item.icon}</b>}</span><span>{item.name}</span></span><span><i className="currency-token event" />{integer(item.eventCoins)}</span><strong>{number(redValue)} 红钻</strong><span>{item.crystalPrice === undefined ? '—' : <><i className={`currency-token ${currency}`} />{integer(item.crystalPrice)} / {quantity} <small>{currencyLabel}</small>{item.crystalNote && <small className="price-note">{item.crystalNote}</small>}</>}</span><span>{crystalUnitPrice === null ? '—' : <>{number(crystalUnitPrice)} <small>{currencyLabel}</small></>}</span><span className="private-price">{privateUnitPrice === null ? '—' : `${number(privateUnitPrice)} 红钻`}</span><span className={difference === null ? 'muted' : difference >= 0 ? 'positive' : 'negative'}>{difference === null ? '暂不比较' : `${difference >= 0 ? '+' : ''}${number(difference)}`}</span></div>; })}</div></section>
  </main>;
}

const legacyShopItems = [
  ['自动战斗补充券（1小时）', 'meso', 550, 1], ['精灵坠饰 10%', 'meso', 5000, 0], ['精灵坠饰 5%', 'meso', 2500, 0],
  ['自动战斗补充券（1小时）×5', 'red', 185, 5], ['自动战斗补充券（30分钟）×5', 'red', 100, 2.5],
] as const;

function LegacyMesoPage() {
  const [rmb, setRmb] = useState(90);
  const [meso, setMeso] = useState(59000);
  const metrics = useMemo(() => {
    const safeRmb = Math.max(1, rmb); const safeMeso = Math.max(1, meso);
    const mesoPerRmb = safeMeso / safeRmb; const rmbPerMeso = safeRmb / safeMeso;
    const blueValue = 1850 * 15 * rmbPerMeso; const redPerRmb = 8550 / Math.max(.01, 185 - blueValue);
    return { mesoPerRmb, blueValue, redPerRmb, redRmb: 1 / redPerRmb, rawRed: 8550 / 185 };
  }, [rmb, meso]);
  return <main className="currency-shell"><header className="currency-header"><div><a className="currency-brand" href={sitePath('/')}>Maple<span>Lab</span></a><span className="currency-divider">/</span><span>枫币计算器</span></div><a href={sitePath('/perfect-core')}>完美核心计算器</a></header><section className="currency-hero"><div><p className="currency-eyebrow">MapleStory M Currency Desk</p><h1>月卡红水晶真实效率估算器</h1><p>输入当前商人枫币价格，将 185 礼包里的蓝水晶按官方兑换枫币折成保底价值，再估算剩余成本能买到多少红水晶。</p></div><div className="currency-orb"><small>1 元 ≈</small><strong>{number(metrics.redPerRmb)}</strong><small>红水晶</small></div></section><section className="currency-workspace"><div className="currency-inputs"><p className="currency-kicker">实时输入</p><h2>当前枫币价格</h2><label>人民币价格<input type="number" value={rmb} onChange={(e) => setRmb(Number(e.target.value))} /><em>RMB</em></label><label>获得枫币<input type="number" value={meso} onChange={(e) => setMeso(Number(e.target.value))} /><em>枫币</em></label></div><div className="currency-results"><div><small>商人枫币汇率</small><strong>1 元 ≈ {number(metrics.mesoPerRmb)} 枫币</strong></div><div><small>185 礼包蓝水晶保底</small><strong>{integer(27750)} 枫币 ≈ {number(metrics.blueValue)} 元</strong></div><div><small>扣除蓝水晶后</small><strong>1 元 ≈ {number(metrics.redPerRmb)} 红水晶</strong></div></div></section><section className="currency-strip"><div><small>185 礼包固定内容</small><strong>1,850 蓝 + 8,550 红</strong></div><div><small>不扣蓝水晶时</small><strong>{number(metrics.rawRed)} 红 / 元</strong></div><div><small>蓝水晶折枫币后剩余成本</small><strong>{number(185 - metrics.blueValue)} 元</strong></div><div><small>红水晶折算单价</small><strong>{number(metrics.redRmb, 4)} 元 / 红</strong></div></section><section className="currency-shop"><div className="currency-kicker">LEGACY MESO ESTIMATOR</div><h2>常见商店物品 RMB 估价</h2><div className="currency-table legacy-currency-table"><div className="currency-row currency-row-head"><span>物品</span><span>商店价格</span><span>RMB 估价</span><span>每小时成本</span></div>{legacyShopItems.map(([name, type, price, hours]) => { const value = type === 'meso' ? price / metrics.mesoPerRmb : price * metrics.redRmb; return <div className="currency-row" key={name}><span><i className={`currency-token ${type}`} />{name}</span><span>{integer(price)} {type === 'meso' ? '枫币' : '红水晶'}</span><strong>{number(value)} 元</strong><span>{hours ? `${number(value / hours)} 元 / 小时` : '—'}</span></div>; })}</div></section></main>;
}

export default function CurrencyPage() {
  const [mode, setMode] = useState<'meso' | 'event'>('event');
  return <div className="currency-page-root"><nav className="currency-mode-tabs" aria-label="货币工具"><button className={mode === 'meso' ? 'active' : ''} onClick={() => setMode('meso')}>枫币估价</button><button className={mode === 'event' ? 'active' : ''} onClick={() => setMode('event')}>活动币商店</button></nav>{mode === 'meso' ? <LegacyMesoPage /> : <EventShopPage />}</div>;
}
