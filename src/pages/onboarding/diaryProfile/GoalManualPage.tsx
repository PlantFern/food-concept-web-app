import { type SyntheticEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    createDiaryWithGoal,
    NUTRIENT_IDS,
    readOnboardingProfile,
} from '@/api/onboarding'
import {NavigateBackButton} from "@/components/ui/NavigateBackButton";

export function GoalManualPage() {
    const navigate = useNavigate()
    const profile = useMemo(() => readOnboardingProfile(), [])

    const [weight, setWeight] = useState('')
    const [plannedWeight, setPlannedWeight] = useState('')
    const [plannedEndDate, setPlannedEndDate] = useState('')
    const [kcal, setKcal] = useState('')
    const [protein, setProtein] = useState('')
    const [fat, setFat] = useState('')
    const [carbs, setCarbs] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)


    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        if (!profile) {
            setError('Нет данных профиля')
            navigate('/onboarding/diary/profile', { replace: true })
            return
        }

        const kcalN = Number(kcal)
        const proteinN = Number(protein)
        const fatN = Number(fat)
        const carbsN = Number(carbs)
        if (![kcalN, proteinN, fatN, carbsN].every((n) => Number.isFinite(n) && n >= 0)) {
            setError('Заполните все данные по КБЖУ')
            return
        }

        setLoading(true)
        try {
            await createDiaryWithGoal({
                height: profile.height,
                birthDate: profile.birthDate,
                genderId: profile.genderId,
                weight: weight ? Number(weight) : null,
                plannedWeight: plannedWeight ? Number(plannedWeight) : null,
                plannedEndDate: plannedEndDate || null,
                goalNutrientMap: {
                    [NUTRIENT_IDS.kcal]: kcalN,
                    [NUTRIENT_IDS.protein]: proteinN,
                    [NUTRIENT_IDS.fat]: fatN,
                    [NUTRIENT_IDS.carbs]: carbsN,
                },
            })
            navigate('/diary', { replace: true })
        } catch {
            setError('Не удалось создать профиль с целью')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-start align-items-start
                            align-content-start
                            rounded-md-5
                            bg-brand
                            form-card
                            vh-100 overflow-y-auto">
                <div className="d-flex w-100
                                    flex-column gap-2
                                    align-items-start justify-content-center
                                    align-content-stretch
                                    flex-grow-0">
                    <div className="text-start">
                        <NavigateBackButton label="Назад" className="btn-tertiary"/>
                    </div>
                </div>
                <div className="form-card-body
                                    d-flex flex-column gap-4
                                    bg-surface
                                    rounded-3">
                    <div className="d-flex
                                        flex-column
                                        align-items-center
                                        justify-content-center
                                        text-center">
                        <h1>Введите данные</h1>
                    </div>
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    <form onSubmit={onSubmit}
                          className="d-flex gap-3 w-100 flex-column
                                    justify-content-between align-items-stretch
                                    align-content-stretch
                                    ">
                        <div className="mb-3">
                            <label className="form-label label" htmlFor="man-weight">
                                Текущий вес (кг) *
                            </label>
                            <input
                                id="man-weight"
                                type="number"
                                className="form-control input"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label label" htmlFor="man-planned">
                                Целевой вес (кг) *
                            </label>
                            <input
                                id="man-planned"
                                type="number"
                                className="form-control input"
                                value={plannedWeight}
                                onChange={(e) => setPlannedWeight(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label label" htmlFor="man-end">
                                Дата конца цели *
                            </label>
                            <input
                                id="man-end"
                                type="date"
                                className="form-control input"
                                value={plannedEndDate}
                                onChange={(e) => setPlannedEndDate(e.target.value)}
                            />
                        </div>
                        <div className="">
                            <div>
                                <label className="form-label label" htmlFor="man-kcal">
                                    Ккал
                                </label>
                                <input
                                    id="man-kcal"
                                    type="number"
                                    min={0}
                                    className="form-control input"
                                    value={kcal}
                                    onChange={(e) => setKcal(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label label" htmlFor="man-protein">
                                    Белки
                                </label>
                                <input
                                    id="man-protein"
                                    type="number"
                                    min={0}
                                    className="form-control input"
                                    value={protein}
                                    onChange={(e) => setProtein(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label label" htmlFor="man-fat">
                                    Жиры
                                </label>
                                <input
                                    id="man-fat"
                                    type="number"
                                    min={0}
                                    className="form-control input"
                                    value={fat}
                                    onChange={(e) => setFat(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label label" htmlFor="man-carbs">
                                    Углеводы
                                </label>
                                <input
                                    id="man-carbs"
                                    type="number"
                                    min={0}
                                    className="form-control input"
                                    value={carbs}
                                    onChange={(e) => setCarbs(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !profile}
                        >
                            {loading ? 'Создание…' : 'Создать профиль и цель'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}