import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
// @ts-ignore
import styles from './PrimaryNutrientGauge.module.css'

ChartJS.register(ArcElement, Tooltip)

export type PrimaryNutrientGaugeProps = {
    current: number
    goal: number
}

export function PrimaryNutrientGauge({ current, goal }: PrimaryNutrientGaugeProps) {
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
                cutout: '74%',
                borderRadius: 12,
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
        <div className={`${styles.kcalGaugeWrap}`}>
            <Doughnut data={data} options={options} />
            <div className={`${styles.kcalGaugeCenter}`}>
                <div className={`${styles.kcalGaugeValue}`}>{Math.round(current)}</div>
                <div className={`${styles.kcalGaugeLabel}`}>/ {Math.round(goal)} kcal</div>
            </div>
        </div>
    )
}
