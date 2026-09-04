import { LEVEL_EXPERIENCE_VERSION, levelExperienceTable } from './levelExperienceData';

interface LevelExperienceTableProps {
  requirements: Record<string, number>;
  onChange: (level: number, value: string) => void;
  onUseReference: () => void;
}

const formatYi = (experience: number) =>
  `${(experience / 100_000_000).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 亿`;

export default function LevelExperienceTable({
  requirements,
  onChange,
  onUseReference,
}: LevelExperienceTableProps) {
  return (
    <details className="level-experience-reference">
      <summary>等级升级经验表 · 199–250 级 · {levelExperienceTable.length} 项</summary>
      <div className="level-experience-toolbar">
        <p>
          参考版本：{LEVEL_EXPERIENCE_VERSION}。原图注明部分等级经验存在小误差。
          每行表示自然升级一级所需经验，活动额外等级仍按顶部设置计算。
          输入使用原始数值，修改后立即重算；251→252 及以后暂无数据。
        </p>
        <button type="button" onClick={onUseReference}>
          采用全部参考值
        </button>
      </div>
      <div className="level-experience-scroll" tabIndex={0} aria-label="等级经验表，可滚动查看">
        <table>
          <thead>
            <tr>
              <th scope="col">自然升级</th>
              <th scope="col">图片参考经验</th>
              <th scope="col">使用经验（原始数值）</th>
              <th scope="col">亿单位预览 / 状态</th>
            </tr>
          </thead>
          <tbody>
            {levelExperienceTable.map(({ level, nextLevel, experience }) => {
              const value = requirements[String(level)] ?? experience;
              return (
                <tr key={level}>
                  <th scope="row">
                    {level} → {nextLevel}
                  </th>
                  <td>{formatYi(experience)}</td>
                  <td>
                    <input
                      aria-label={`${level}级升级经验表数值`}
                      type="number"
                      min="1"
                      step="1"
                      value={value}
                      onChange={(event) => onChange(level, event.target.value)}
                    />
                  </td>
                  <td>
                    {formatYi(value)} · {value === experience ? '参考值' : '自定义'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
