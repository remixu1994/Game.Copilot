import { useEffect, useMemo, useState } from 'react';
import { sitePath } from '../../shared/lib/sitePaths';
import CurrencyBenchmarkPanel from '../../shared/currency/CurrencyBenchmarkPanel';
import { calculateCurrencyBenchmark } from '../../shared/currency/currencyBenchmark';
import { useCurrencyPriceSystem } from '../../shared/currency/useCurrencyPriceSystem';
import MoonlightShopPage from './MoonlightShopPage';
import {
  DEFAULT_EVENT_SHOP_RATIO,
  differenceDescription,
  EVENT_SHOP_VERSION,
  eventShopItems,
  prepareShopItems,
  type ShopSortMode,
} from './currencyShop';
import { calculateGameGoldComparisons } from './gameGoldComparison';
import './currency.css';
import './currency-theme.css';

const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
const integer = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
const readRatio = (key: string, fallback: number) => {
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
const EVENT_SHOP_STORAGE_VERSION_KEY = 'maple-event-shop-version';
const readCurrentEventRatio = (key: string, fallback: number) =>
  window.localStorage.getItem(EVENT_SHOP_STORAGE_VERSION_KEY) === EVENT_SHOP_VERSION
    ? readRatio(key, fallback)
    : fallback;

function EventShopPage() {
  const [redDiamonds, setRedDiamonds] = useState(() =>
    readCurrentEventRatio('maple-red-diamonds', DEFAULT_EVENT_SHOP_RATIO.redDiamonds),
  );
  const [eventCoins, setEventCoins] = useState(() =>
    readCurrentEventRatio('maple-event-coins', DEFAULT_EVENT_SHOP_RATIO.eventCoins),
  );
  const [sortMode, setSortMode] = useState<ShopSortMode>('difference-efficiency');
  useEffect(() => {
    window.localStorage.setItem('maple-red-diamonds', String(redDiamonds));
  }, [redDiamonds]);
  useEffect(() => {
    window.localStorage.setItem('maple-event-coins', String(eventCoins));
  }, [eventCoins]);
  useEffect(() => {
    window.localStorage.setItem(EVENT_SHOP_STORAGE_VERSION_KEY, EVENT_SHOP_VERSION);
  }, []);
  const ratio = useMemo(() => redDiamonds / eventCoins, [redDiamonds, eventCoins]);
  const rankedItems = useMemo(
    () => prepareShopItems(eventShopItems, ratio, sortMode),
    [ratio, sortMode],
  );
  const comparableItems = eventShopItems.filter(
    (item) =>
      item.crystalPrice !== undefined &&
      item.crystalComparable !== false &&
      (item.crystalCurrency ?? 'red') === 'red',
  );
  const averageSaving = useMemo(
    () =>
      comparableItems.reduce(
        (sum, item) =>
          sum + item.crystalPrice! / (item.crystalQuantity ?? 1) - item.eventCoins * ratio,
        0,
      ) / comparableItems.length,
    [ratio],
  );
  const updateRatio = (setter: (value: number) => void, raw: string) => {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) setter(value);
  };
  return (
    <main className="currency-shell">
      <header className="currency-header">
        <div>
          <a className="currency-brand" href={sitePath('/')}>
            Maple<span>Lab</span>
          </a>
          <span className="currency-divider">/</span>
          <span>活动币商店</span>
        </div>
        <a href={sitePath('/perfect-core')}>完美核心计算器</a>
      </header>
      <section className="currency-hero">
        <div>
          <p className="currency-eyebrow">EVENT SHOP DESK</p>
          <h1>
            活动币价值
            <br />
            <span>一眼看懂</span>
          </h1>
          <p>上一期活动已结束。当前展示新一期商品，并按最新兑换基准实时换算红钻价值。</p>
        </div>
        <div className="currency-orb">
          <small>1 活动币 ≈</small>
          <strong>{number(ratio, 4)}</strong>
          <small>红钻</small>
        </div>
      </section>
      <section className="currency-workspace">
        <div className="currency-inputs">
          <p className="currency-kicker">兑换基准</p>
          <h2>自定义比例</h2>
          <div className="ratio-inputs">
            <label>
              <span>红钻</span>
              <input
                type="number"
                min="1"
                step="1"
                value={redDiamonds}
                onChange={(event) => updateRatio(setRedDiamonds, event.target.value)}
              />
            </label>
            <b>=</b>
            <label>
              <span>活动币</span>
              <input
                type="number"
                min="1"
                step="1"
                value={eventCoins}
                onChange={(event) => updateRatio(setEventCoins, event.target.value)}
              />
            </label>
          </div>
          <button
            className="reset-ratio"
            type="button"
            onClick={() => {
              setRedDiamonds(DEFAULT_EVENT_SHOP_RATIO.redDiamonds);
              setEventCoins(DEFAULT_EVENT_SHOP_RATIO.eventCoins);
            }}
          >
            恢复默认 450 : 1500
          </button>
        </div>
        <div className="currency-results">
          <div>
            <small>当前换算</small>
            <strong>
              {integer(redDiamonds)} 红钻 = {integer(eventCoins)} 活动币
            </strong>
          </div>
          <div>
            <small>每 1,000 活动币</small>
            <strong>{number(1000 * ratio)} 红钻</strong>
          </div>
          <div>
            <small>表内平均水晶价差</small>
            <strong className={averageSaving >= 0 ? 'positive' : 'negative'}>
              {averageSaving >= 0 ? '+' : ''}
              {number(averageSaving)} 水晶
            </strong>
          </div>
        </div>
      </section>
      <section className="currency-shop">
        <div className="currency-kicker">
          EVENT SHOP ITEMS · {eventShopItems.length} · {EVENT_SHOP_VERSION}
        </div>
        <div className="shop-heading">
          <div>
            <h2>商品价格对照</h2>
            <p>
              水晶商店按“每个”归一化比较；蓝钻、混合货币、不同等级粉末或暂无价格的商品只标注，不参与红钻差额计算。
            </p>
          </div>
          <label className="shop-sort">
            <span>列表排序</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as ShopSortMode)}
            >
              <option value="difference-efficiency">性价比：高 → 低</option>
              <option value="original">原始录入顺序</option>
            </select>
          </label>
        </div>
        <div className="currency-table">
          <div className="currency-row currency-row-head">
            <span>物品</span>
            <span>活动币 / 个</span>
            <span>折算红钻 / 个</span>
            <span>水晶总价 / 数量</span>
            <span>水晶 / 个</span>
            <span>私人商店 / 个</span>
            <span>差额 / 个</span>
          </div>
          {rankedItems.map((metrics, rank) => {
            const {
              item,
              redValue,
              quantity,
              currency,
              crystalUnitPrice,
              privateUnitPrice,
              difference,
              differenceEfficiency,
            } = metrics;
            const comparison = differenceDescription(differenceEfficiency);
            const currencyLabel =
              currency === 'blue' ? '蓝钻' : currency === 'mixed' ? '混合' : '红钻';
            return (
              <div className="currency-row" key={item.name}>
                <span className="item-name">
                  <b className="shop-rank">{String(rank + 1).padStart(2, '0')}</b>
                  <span className="item-image">
                    {item.image ? <img src={item.image} alt="" /> : <b>{item.icon}</b>}
                  </span>
                  <span>{item.name}</span>
                </span>
                <span>
                  <i className="currency-token event" />
                  {integer(item.eventCoins)}
                </span>
                <strong>{number(redValue)} 红钻</strong>
                <span>
                  {item.crystalPrice === undefined ? (
                    '—'
                  ) : (
                    <>
                      <i className={`currency-token ${currency}`} />
                      {integer(item.crystalPrice)} / {quantity} <small>{currencyLabel}</small>
                      {item.crystalNote && <small className="price-note">{item.crystalNote}</small>}
                    </>
                  )}
                </span>
                <span>
                  {crystalUnitPrice === null ? (
                    '—'
                  ) : (
                    <>
                      {number(crystalUnitPrice)} <small>{currencyLabel}</small>
                    </>
                  )}
                </span>
                <span className="private-price">
                  {privateUnitPrice === null ? '—' : `${number(privateUnitPrice)} 红钻`}
                </span>
                <span
                  className={`difference-cell ${
                    difference === null ? 'muted' : difference >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {difference === null ? (
                    '暂不比较'
                  ) : (
                    <>
                      <b>
                        {difference >= 0 ? '+' : ''}
                        {number(difference)}
                      </b>
                      {comparison && (
                        <small>
                          {comparison.label} {number(comparison.percent, 1)}%
                        </small>
                      )}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const mesoReferenceItems = [
  ['自动战斗补充券（1小时）', 'meso', 550, 1],
  ['精灵坠饰 10%', 'meso', 5000, 0],
  ['精灵坠饰 5%', 'meso', 2500, 0],
  ['自动战斗补充券（1小时）×5', 'red', 185, 5],
  ['自动战斗补充券（30分钟）×5', 'red', 100, 2.5],
] as const;

function MesoValuePage() {
  const { benchmark, crystalPackage, setBenchmark, setCrystalPackage } = useCurrencyPriceSystem();
  const metrics = useMemo(
    () => calculateCurrencyBenchmark(benchmark, crystalPackage),
    [benchmark, crystalPackage],
  );
  const gameGoldComparisons = useMemo(() => calculateGameGoldComparisons(metrics), [metrics]);
  return (
    <main className="currency-shell">
      <header className="currency-header">
        <div>
          <a className="currency-brand" href={sitePath('/')}>
            Maple<span>Lab</span>
          </a>
          <span className="currency-divider">/</span>
          <span>枫币估价</span>
        </div>
        <a href={sitePath('/perfect-core')}>完美核心计算器</a>
      </header>
      <section className="currency-hero">
        <div>
          <p className="currency-eyebrow">MESO VALUE REFERENCE</p>
          <h1>枫币与水晶统一估价</h1>
          <p>
            先建立 RMB 与枫币的市场汇率，再结合高性价比水晶礼包，得到后续模块可复用的统一价格基准。
          </p>
        </div>
        <div className="currency-orb">
          <small>1 元 ≈</small>
          <strong>{number(metrics.redCrystalsPerRmb)}</strong>
          <small>红水晶</small>
        </div>
      </section>
      <CurrencyBenchmarkPanel
        value={benchmark}
        metrics={metrics}
        crystalPackage={crystalPackage}
        onChange={setBenchmark}
        onCrystalPackageChange={setCrystalPackage}
      />
      <section className="currency-strip">
        <div>
          <small>{crystalPackage.name}当前内容</small>
          <strong>
            {integer(crystalPackage.blueCrystals)} 蓝 + {integer(crystalPackage.redCrystals)} 红
          </strong>
        </div>
        <div>
          <small>不扣蓝水晶时</small>
          <strong>{number(metrics.rawRedCrystalsPerRmb)} 红 / 元</strong>
        </div>
        <div>
          <small>蓝水晶折枫币后剩余成本</small>
          <strong>{number(metrics.effectiveRedCrystalCost)} 元</strong>
        </div>
        <div>
          <small>红水晶折算单价</small>
          <strong>{number(metrics.rmbPerRedCrystal, 4)} 元 / 红</strong>
        </div>
      </section>
      <section className="currency-shop">
        <div className="currency-kicker">MESO REFERENCE ITEMS</div>
        <h2>常见商店物品 RMB 估价</h2>
        <div className="currency-table meso-reference-table">
          <div className="currency-row currency-row-head">
            <span>物品</span>
            <span>商店价格</span>
            <span>RMB 估价</span>
            <span>单位成本</span>
          </div>
          <div className="currency-row currency-row-group">
            <strong>游戏金币渠道</strong>
            <span>统一按 1 亿游戏币成本升序</span>
          </div>
          {gameGoldComparisons.map((item, index) => (
            <div
              className={`currency-row game-gold-row${index === 0 ? ' best-value' : ''}`}
              key={item.id}
            >
              <span>
                <i className={`currency-token ${item.payment.currency}`} />
                {item.name}
                {index === 0 && <small className="best-value-badge">最低</small>}
              </span>
              <span>
                {integer(item.payment.amount)}{' '}
                {item.payment.currency === 'meso' ? '枫币' : '红水晶'}
                <small className="price-note">换取 {integer(item.gameGold)} 游戏币</small>
              </span>
              <strong>{number(item.totalRmb)} 元</strong>
              <span className="game-gold-unit-cost">
                1 亿 ≈ <b>{number(item.rmbPerHundredMillion)} 元</b>
              </span>
            </div>
          ))}
          <div className="currency-row currency-row-group">
            <strong>常见物品</strong>
            <span>按当前统一价格基准估算</span>
          </div>
          {mesoReferenceItems.map(([name, type, price, hours]) => {
            const value =
              type === 'meso' ? price / metrics.mesoPerRmb : price * metrics.rmbPerRedCrystal;
            return (
              <div className="currency-row" key={name}>
                <span>
                  <i className={`currency-token ${type}`} />
                  {name}
                </span>
                <span>
                  {integer(price)} {type === 'meso' ? '枫币' : '红水晶'}
                </span>
                <strong>{number(value)} 元</strong>
                <span>{hours ? `${number(value / hours)} 元 / 小时` : '—'}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default function CurrencyPage() {
  const [mode, setMode] = useState<'meso' | 'event' | 'moonlight'>('meso');
  return (
    <div className="currency-page-root">
      <nav className="currency-mode-tabs" aria-label="货币工具">
        <button className={mode === 'meso' ? 'active' : ''} onClick={() => setMode('meso')}>
          枫币估价
        </button>
        <button className={mode === 'event' ? 'active' : ''} onClick={() => setMode('event')}>
          活动币商店
        </button>
        <button
          className={mode === 'moonlight' ? 'active' : ''}
          onClick={() => setMode('moonlight')}
        >
          月华商店
        </button>
      </nav>
      {mode === 'meso' ? (
        <MesoValuePage />
      ) : mode === 'event' ? (
        <EventShopPage />
      ) : (
        <MoonlightShopPage />
      )}
    </div>
  );
}
