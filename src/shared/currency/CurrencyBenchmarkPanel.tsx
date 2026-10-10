import type {
  CrystalPackage,
  CurrencyBenchmarkInput,
  CurrencyBenchmarkMetrics,
} from './currencyBenchmark';
import './currency-benchmark.css';

type CurrencyBenchmarkPanelProps = {
  value: CurrencyBenchmarkInput;
  metrics: CurrencyBenchmarkMetrics;
  crystalPackage: CrystalPackage;
  onChange: (value: CurrencyBenchmarkInput) => void;
  onCrystalPackageChange: (value: CrystalPackage) => void;
};

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);

export default function CurrencyBenchmarkPanel({
  value,
  metrics,
  crystalPackage,
  onChange,
  onCrystalPackageChange,
}: CurrencyBenchmarkPanelProps) {
  const updateValue = (key: 'rmbAmount' | 'mesoAmount', rawValue: string) => {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    onChange({ ...value, [key]: nextValue });
  };

  const updatePackage = (key: 'priceRmb' | 'blueCrystals' | 'redCrystals', rawValue: string) => {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    onCrystalPackageChange({ ...crystalPackage, [key]: nextValue });
  };

  const updateBlueCrystalMesoValue = (rawValue: string) => {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue) || nextValue < 0 || crystalPackage.blueCrystals <= 0) return;
    onCrystalPackageChange({
      ...crystalPackage,
      mesoPerBlueCrystal: nextValue / crystalPackage.blueCrystals,
    });
  };

  return (
    <section className="currency-benchmark">
      <div className="benchmark-inputs">
        <p>通用换算基准</p>
        <h2>RMB 与枫币汇率</h2>
        <div>
          <label>
            <span>人民币</span>
            <input
              type="number"
              min="0.01"
              value={value.rmbAmount}
              onChange={(event) => updateValue('rmbAmount', event.target.value)}
            />
            <em>RMB</em>
          </label>
          <b>=</b>
          <label>
            <span>获得枫币</span>
            <input
              type="number"
              min="0.01"
              value={value.mesoAmount}
              onChange={(event) => updateValue('mesoAmount', event.target.value)}
            />
            <em>枫币</em>
          </label>
        </div>
        <label className="benchmark-fee-toggle">
          <input
            type="checkbox"
            checked={value.includeTransactionFee}
            onChange={(event) =>
              onChange({ ...value, includeTransactionFee: event.target.checked })
            }
          />
          <span>按成交档位扣除交易手续费</span>
        </label>
        <small className="benchmark-net-meso">
          手续费 {formatNumber(metrics.mesoTransactionFee, 0)} 枫币，净到手{' '}
          {formatNumber(metrics.netMesoAmount, 0)} 枫币
        </small>
      </div>
      <div className="benchmark-package">
        <div className="benchmark-package-heading">
          <div>
            <small>当前最优礼包</small>
            <strong>{crystalPackage.name}</strong>
          </div>
          <span>统一用于材料人民币估价</span>
        </div>
        <div className="benchmark-package-inputs">
          <label>
            <span>礼包价格</span>
            <input
              type="number"
              min="0.01"
              value={crystalPackage.priceRmb}
              onChange={(event) => updatePackage('priceRmb', event.target.value)}
            />
            <em>元</em>
          </label>
          <label>
            <span>蓝水晶</span>
            <input
              type="number"
              min="1"
              value={crystalPackage.blueCrystals}
              onChange={(event) => updatePackage('blueCrystals', event.target.value)}
            />
            <em>枚</em>
          </label>
          <label>
            <span>蓝水晶折算</span>
            <input
              type="number"
              min="0"
              value={metrics.blueCrystalMesoValue}
              onChange={(event) => updateBlueCrystalMesoValue(event.target.value)}
            />
            <em>枫币</em>
          </label>
          <label>
            <span>红水晶</span>
            <input
              type="number"
              min="1"
              value={crystalPackage.redCrystals}
              onChange={(event) => updatePackage('redCrystals', event.target.value)}
            />
            <em>枚</em>
          </label>
        </div>
      </div>
      <div className="benchmark-results">
        <div>
          <small>市场枫币汇率</small>
          <strong>1 元 ≈ {formatNumber(metrics.mesoPerRmb)} 枫币</strong>
        </div>
        <div>
          <small>{crystalPackage.name} · 蓝水晶保底</small>
          <strong>
            {formatNumber(metrics.blueCrystalMesoValue, 0)} 枫币 ≈{' '}
            {formatNumber(metrics.blueCrystalRmbValue)} 元
          </strong>
        </div>
        <div>
          <small>扣除蓝水晶价值后的红水晶效率</small>
          <strong>1 元 ≈ {formatNumber(metrics.redCrystalsPerRmb)} 红水晶</strong>
        </div>
      </div>
    </section>
  );
}
