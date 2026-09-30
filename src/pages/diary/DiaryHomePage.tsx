import { useMemo, useState } from 'react'
import {
    BottomNav,
    DayStrip,
    KcalGauge,
    MealCard,
    NutrientBars,
    type DayItem,
} from '@/components/diary'

function buildWeekDays(anchor = new Date()): DayItem[] {
    const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    const start = new Date(anchor)
    const day = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - day)

    return labels.map((label, i) => {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const id = d.toISOString().slice(0, 10)
        const dateLabel = d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
        })
        return { id, label, dateLabel }
    })
}

const MOCK_MEALS = [
    {
        title: 'Breakfast',
        totalKcal: 420,
        items: [
            { name: 'Oatmeal with berries', kcal: 280 },
            { name: 'Green tea', kcal: 0 },
            { name: 'Yogurt', kcal: 140 },
        ],
    },
    {
        title: 'Lunch',
        totalKcal: 560,
        items: [
            { name: 'Grilled chicken salad', kcal: 380 },
            { name: 'Buckwheat', kcal: 180 },
        ],
    },
    {
        title: 'Snack',
        totalKcal: 270,
        items: [{ name: 'Apple & peanut butter', kcal: 270 }],
    },
]

export function DiaryHomePage() {
    const days = useMemo(() => buildWeekDays(), [])
    const todayId = new Date().toISOString().slice(0, 10)
    const initial =
        days.find((d) => d.id === todayId)?.id ?? days[Math.min(days.length - 1, 3)]?.id ?? ''
    const [activeDay, setActiveDay] = useState(initial)

    const kcalCurrent = 1250
    const kcalGoal = 1600

    return (
        <div className="diary-shell">
            <header className="diary-header">
                <h1 className="diary-header-title">Your stats</h1>
                <p className="diary-header-sub">Nutrients for the selected day</p>
            </header>

            <section className="stats-card" aria-label="Дневная статистика">
                <DayStrip days={days} activeId={activeDay} onSelect={setActiveDay} />

                <KcalGauge current={kcalCurrent} goal={kcalGoal} />

                <NutrientBars
                    items={[
                        { key: 'protein', label: 'Protein', current: 72, goal: 110 },
                        { key: 'fat', label: 'Fat', current: 48, goal: 55 },
                        { key: 'carbs', label: 'Carbs', current: 140, goal: 180 },
                    ]}
                />
            </section>

            <section className="section-block" aria-label="Приёмы пищи">
                <div className="section-head">
                    <h2 className="section-title">Meals</h2>
                    <a className="section-link" href="#">
                        See all
                    </a>
                </div>

                {MOCK_MEALS.map((meal) => (
                    <MealCard
                        key={meal.title}
                        title={meal.title}
                        totalKcal={meal.totalKcal}
                        items={meal.items}
                    />
                ))}
            </section>

            <BottomNav />
        </div>
    )
}
