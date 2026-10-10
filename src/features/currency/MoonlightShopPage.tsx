import { sitePath } from '../../shared/lib/sitePaths';

type DiamondCurrency = 'red' | 'blue';

type MoonlightShopItem = {
  name: string;
  symbol: string;
  limit: string;
  moonlightPrice: number;
  diamondCurrency: DiamondCurrency;
  diamondPrice: number;
  originalDiamondPrice?: number;
};

const moonlightShopItems: MoonlightShopItem[] = [
  {
    name: '混沌升品硬币自选礼盒',
    symbol: '盒',
    limit: '账号每周 24',
    moonlightPrice: 4,
    diamondCurrency: 'blue',
    diamondPrice: 200,
  },
  {
    name: '无瑕级道具结晶',
    symbol: '晶',
    limit: '账号每月 10',
    moonlightPrice: 32,
    diamondCurrency: 'red',
    diamondPrice: 1500,
    originalDiamondPrice: 4500,
  },
  {
    name: '铭文增幅石',
    symbol: '铭',
    limit: '账号每日 4',
    moonlightPrice: 4,
    diamondCurrency: 'blue',
    diamondPrice: 800,
  },
  {
    name: '月曜圣物超越之息',
    symbol: '月',
    limit: '账号限购 5',
    moonlightPrice: 38,
    diamondCurrency: 'red',
    diamondPrice: 1200,
    originalDiamondPrice: 4000,
  },
];

const integer = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);

const decimal = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);

const currencyName = (currency: DiamondCurrency) => (currency === 'red' ? '红钻' : '蓝钻');

export default function MoonlightShopPage() {
  const redItems = moonlightShopItems.filter((item) => item.diamondCurrency === 'red');
  const blueItems = moonlightShopItems.filter((item) => item.diamondCurrency === 'blue');
  const bestRedItem = redItems.reduce((best, item) =>
    item.diamondPrice / item.moonlightPrice > best.diamondPrice / best.moonlightPrice
      ? item
      : best,
  );
  const bestBlueItem = blueItems.reduce((best, item) =>
    item.diamondPrice / item.moonlightPrice > best.diamondPrice / best.moonlightPrice
      ? item
      : best,
  );

  return (
    <main className="currency-shell moonlight-shell">
      <header className="currency-header">
        <div>
          <a className="currency-brand" href={sitePath('/')}>
            Maple<span>Lab</span>
          </a>
          <span className="currency-divider">/</span>
          <span>月华商店</span>
        </div>
        <a href={sitePath('/equipment-upgrade')}>装备养成</a>
      </header>

      <section className="currency-hero moonlight-hero">
        <div>
          <p className="currency-eyebrow">MOONLIGHT SHOP</p>
          <h1>
            月华商品
            <br />
            <span>价值对照</span>
          </h1>
          <p>汇总月华商店限购物品，并与红钻、蓝钻商店的当前价格进行同物品对照。</p>
        </div>
        <div className="moonlight-orb" aria-label="已收录商品数量">
          <span className="moonlight-mark">☾</span>
          <strong>{moonlightShopItems.length}</strong>
          <small>件已确认商品</small>
        </div>
      </section>

      <section className="moonlight-summary" aria-label="月华商店摘要">
        <article>
          <small>红钻商品最佳价值</small>
          <strong>{bestRedItem.name}</strong>
          <span>{decimal(bestRedItem.diamondPrice / bestRedItem.moonlightPrice)} 红钻 / 月华</span>
        </article>
        <article>
          <small>蓝钻商品最佳价值</small>
          <strong>{bestBlueItem.name}</strong>
          <span>
            {decimal(bestBlueItem.diamondPrice / bestBlueItem.moonlightPrice)} 蓝钻 / 月华
          </span>
        </article>
        <article>
          <small>数据口径</small>
          <strong>按每件商品</strong>
          <span>红钻与蓝钻分别排名，不混合换算</span>
        </article>
      </section>

      <section className="currency-shop moonlight-shop">
        <div className="currency-kicker">MOONLIGHT ITEMS · {moonlightShopItems.length}</div>
        <div className="shop-heading">
          <div>
            <h2>月华商品清单</h2>
            <p>价格来自已提供的商店截图；钻石价格采用截图中的当前价或折后价。</p>
          </div>
          <span className="shop-note">后续截图可继续追加</span>
        </div>

        <div className="moonlight-list-wrap">
          <div className="moonlight-list" role="table" aria-label="月华商品价格列表">
            <div className="moonlight-list-row moonlight-list-head" role="row">
              <span role="columnheader">物品</span>
              <span role="columnheader">限购</span>
              <span role="columnheader">红钻价格</span>
              <span role="columnheader">蓝钻价格</span>
              <span role="columnheader">月华价格</span>
              <span role="columnheader">每月华价值</span>
            </div>
          {moonlightShopItems.map((item) => {
            const diamondPerMoonlight = item.diamondPrice / item.moonlightPrice;
            const discount = item.originalDiamondPrice
              ? 1 - item.diamondPrice / item.originalDiamondPrice
              : null;
            return (
              <div className="moonlight-list-row" role="row" key={item.name}>
                <span className="moonlight-list-item" role="cell">
                  <span className="moonlight-item-icon" aria-hidden="true">
                    {item.symbol}
                  </span>
                  <div>
                    <h3>{item.name}</h3>
                    {discount !== null && <small>折后节省 {decimal(discount * 100)}%</small>}
                  </div>
                </span>
                <span className="moonlight-limit-cell" role="cell">
                  {item.limit}
                </span>
                <span className="moonlight-diamond-cell red" role="cell">
                  {item.diamondCurrency === 'red' ? (
                    <>
                      <strong>{integer(item.diamondPrice)}</strong>
                      {item.originalDiamondPrice && <del>{integer(item.originalDiamondPrice)}</del>}
                    </>
                  ) : (
                    '—'
                  )}
                </span>
                <span className="moonlight-diamond-cell blue" role="cell">
                  {item.diamondCurrency === 'blue' ? (
                    <>
                      <strong>{integer(item.diamondPrice)}</strong>
                      {item.originalDiamondPrice && <del>{integer(item.originalDiamondPrice)}</del>}
                    </>
                  ) : (
                    '—'
                  )}
                </span>
                <strong className="moonlight-price-cell" role="cell">
                  <i className="moonlight-token">☾</i>
                  {integer(item.moonlightPrice)}
                </strong>
                <span className="moonlight-value-cell" role="cell">
                  <strong>{decimal(diamondPerMoonlight)}</strong>
                  <small>{currencyName(item.diamondCurrency)} / 月华</small>
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </section>
    </main>
  );
}
