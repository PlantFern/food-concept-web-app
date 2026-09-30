import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

type KcalGaugeProps = {
    current: number
    goal: number
}

export function KcalGauge({ current, goal }: KcalGaugeProps) {
    const safeGoal = goal > 0 ? goal : 1
    const filled = Math.min(Math.max(current, 0), safeGoal)
    const rest = Math.max(safeGoal - filled, 0)

    const data = {
        datasets: [
            {
                data: [filled, rest],
                backgroundColor: ['#f6c2ea', 'rgba(255,255,255,0.28)'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
                cutout: '78%',
                borderRadius: 10,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
    }

    return (
        <div className="kcal-gauge-wrap">
            <Doughnut data={data} options={options} />
            <div className="kcal-gauge-center">
                <div className="kcal-gauge-value">{Math.round(current)}</div>
                <div className="kcal-gauge-label">/ {Math.round(goal)} kcal</div>
            </div>
        </div>
    )
}
