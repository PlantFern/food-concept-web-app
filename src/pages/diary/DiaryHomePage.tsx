import { useState } from 'react'
import {
    BottomNav,
    DateNav,
    KcalGauge,
    MacroRing,
    MealSection,
    SleepCard,
    TemplateBlock,
    WeightCard,
} from '@/components/diary'

const MOCK = {
    kcal: { current: 0, goal: 2000 },
    macros: [
        { key: 'protein' as const, label: 'protein', value: 45, color: '#3498db' },
        { key: 'carbs' as const, label: 'carbs', value: 120, color: '#2ecc71' },
        { key: 'fat' as const, label: 'fat', value: 35, color: '#f39c12' },
    ],
    breakfast: [
        { id: 'b1', name: 'Какое-то название продукта', amount: '100гр.', kcal: 84 },
        { id: 'b2', name: 'Ну я не знаю', amount: '2 x 50гр.', kcal: 84 },
        { id: 'b3', name: 'Тилапия', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 'b4', name: 'Да', amount: '1 x 2 x 100гр.', kcal: 84 },
    ],
    lunch: [
        { id: 'l1', name: 'Ну вот что-то поела да', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 'l2', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 'l3', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
    ],
    lunchNote: 'Допустим я что-то тут да и пишу мммм… Допустим да, а как это выглядит то',
    snack: [
        { id: 's1', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 's2', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 's3', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 's4', name: 'Да', amount: '1 x 2 x 100гр.', kcal: 84 },
    ],
    template: {
        title: 'Допустим тут написано, что это за шаблон',
        totalKcal: 354.05,
        items: [
            { id: 't1', name: 'Да', amount: '100гр.', kcal: 84 },
            { id: 't2', name: 'Нет', amount: '2 x 100гр.', kcal: 120 },
            { id: 't3', name: 'Не знаю', amount: '100гр.', kcal: 150.05 },
        ],
    },
    dinner: [
        { id: 'd1', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 'd2', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 'd3', name: 'Какое-то название продукта', amount: '1 x 2 x 100гр.', kcal: 84 },
        { id: 'd4', name: 'Да', amount: '1 x 2 x 100гр.', kcal: 84 },
    ],
    weight: { kg: 64, updatedAt: '20.09.2026' },
    sleep: [
        { id: 'sl1', start: '22:00', end: '08:30' },
        { id: 'sl2', start: '18:30', end: '—' },
        { id: 'sl3', start: '23:00', end: '—' },
    ],
}

export function DiaryHomePage() {
    const [date, setDate] = useState(() => new Date(2026, 8, 2))
    const [statsPage, setStatsPage] = useState(0)

    function shiftDay(delta: number) {
        setDate((prev) => {
            const next = new Date(prev)
            next.setDate(prev.getDate() + delta)
            return next
        })
    }

    return (
        <div className="diary-shell">
            <header className="stats-header">
                <DateNav date={date} onPrev={() => shiftDay(-1)} onNext={() => shiftDay(1)} />

                <div className="stats-body">
                    <KcalGauge current={MOCK.kcal.current} goal={MOCK.kcal.goal} />
                    <MacroRing slices={MOCK.macros} />
                </div>

                <div className="stats-dots" role="tablist" aria-label="Страницы статистики">
                    {[0, 1, 2, 3].map((i) => (
                        <button
                            key={i}
                            type="button"
                            role="tab"
                            aria-selected={statsPage === i}
                            className={`stats-dot ${statsPage === i ? 'is-active' : ''}`}
                            onClick={() => setStatsPage(i)}
                        />
                    ))}
                </div>
            </header>

            <div className="diary-content">
                <MealSection title="Завтрак" items={MOCK.breakfast} />
                <MealSection title="Обед" items={MOCK.lunch} note={MOCK.lunchNote} />
                <MealSection title="Полдник" items={MOCK.snack} />

                <TemplateBlock
                    title={MOCK.template.title}
                    totalKcal={MOCK.template.totalKcal}
                    items={MOCK.template.items}
                />

                <MealSection title="Ужин" items={MOCK.dinner} />

                <WeightCard weightKg={MOCK.weight.kg} updatedAt={MOCK.weight.updatedAt} />
                <SleepCard entries={MOCK.sleep} />
            </div>

            <BottomNav />
        </div>
    )
}
