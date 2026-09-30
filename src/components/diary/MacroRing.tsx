import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

export type MacroSlice = {
    key: 'protein' | 'carbs' | 'fat'
    label: string
    value: number
    color: string
}

type MacroRingProps = {
    slices: MacroSlice[]
}

export function MacroRing({ slices }: MacroRingProps) {
    const total = slices.reduce((s, x) => s + Math.max(x.value, 0), 0) || 1

    const data = {
        labels: slices.map((s) => s.label),
        datasets: [
            {
                data: slices.map((s) => Math.max(s.value, 0)),
                backgroundColor: slices.map((s) => s.color),
                borderWidth: 0,
                cutout: '68%',
                borderRadius: 4,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: { label?: string; raw?: number | string }) => {
                        const v = Number(ctx.raw ?? 0)
                        return `${ctx.label}: ${Math.round(v)}g (${Math.round((v / total) * 100)}%)`
                    },
                },
            },
        },
    }

    return (
        <div className="macro-ring-block">
            <div className="macro-ring-chart">
                <Doughnut data={data} options={options} />
            </div>
            <ul className="macro-legend">
                {slices.map((s) => (
                    <li key={s.key}>
                        <span className="macro-dot" style={{ background: s.color }} />
                        <span>{s.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
