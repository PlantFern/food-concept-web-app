export type NutrientBarItem = {
    key: string
    label: string
    value: number
    color: string
}

export type NutrientBarProps = {
    items: NutrientBarItem[]
}

export function MacroBar({ items }: NutrientBarProps) {
    const total = items.reduce((s, i) => s + Math.max(i.value, 0), 0)
    const hasData = total > 0

    return (
        <div className="macro-bar">
            <div className="macro-bar-legend">
                {items.map((item) => (
                    <div key={item.key} className="macro-bar-legend-row">
                        <span className="macro-bar-amount">
                            {Math.round(item.value)}g
                        </span>
                        <span className="macro-bar-label">
                            <span
                                className="macro-bar-dot"
                                style={{ background: item.color }}
                            />
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="macro-bar-track" role="img" aria-label="Соотношение БЖУ">
                {hasData
                    ? items.map((item) => {
                          const pct = (Math.max(item.value, 0) / total) * 100
                          if (pct <= 0) return null
                          return (
                              <div
                                  key={item.key}
                                  className="macro-bar-seg"
                                  style={{
                                      width: `${pct}%`,
                                      background: item.color,
                                  }}
                                  title={`${item.label}: ${Math.round(item.value)}g`}
                              />
                          )
                      })
                    : (
                          <div className="macro-bar-seg macro-bar-seg-empty" style={{ width: '100%' }} />
                      )}
            </div>
        </div>
    )
}
