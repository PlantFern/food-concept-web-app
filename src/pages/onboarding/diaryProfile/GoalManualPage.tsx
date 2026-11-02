import { type SyntheticEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDiaryWithGoal, readOnboardingProfile } from '@/api/onboarding'
import {
    GoalNutrientForm,
    emptyGoalForm,
    toNutrientGoals,
    type GoalNutrientFormValues,
} from '@/components/goals'
import { NavigateBackButton } from '@/components/ui/NavigateBackButton'

export function GoalManualPage() {
    const navigate = useNavigate()
    const profile = readOnboardingProfile()

    const [weight, setWeight] = useState('')
    const [form, setForm] = useState<GoalNutrientFormValues>(() => emptyGoalForm(true))
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        if (!profile) {
            setError('Нет данных профиля')
            navigate('/onboarding/profile-setup', { replace: true })
            return
        }

        const nutrientGoals = toNutrientGoals(form.amounts)
        if (nutrientGoals.length === 0) {
            setError('Укажите хотя бы один нутриент')
            return
        }

        const goalNutrientMap: Record<number, number> = {}
        for (const item of nutrientGoals) {
            goalNutrientMap[item.nutrientId] = item.amount
        }

        setLoading(true)
        try {
            await createDiaryWithGoal({
                height: profile.height,
                birthDate: profile.birthDate,
                genderId: profile.genderId,
                weight: weight ? Number(weight) : null,
                plannedWeight: form.plannedWeight ? Number(form.plannedWeight) : null,
                plannedEndDate: form.plannedEndDate || null,
                goalNutrientMap,
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
                            bg-brand p-2
                            vh-100
                            overflow-y-auto">
                <div className="d-flex w-100 flex-column align-items-start flex-grow-0">
                    <NavigateBackButton label="Назад" className="btn-tertiary-invert" />
                </div>
                
                <div className="surface-card surface-card-column w-100">
                    <div className="d-flex flex-column align-items-center text-center">
                        <h1 className="h3 mb-0">Введите данные</h1>
                    </div>

                    <form onSubmit={onSubmit} 
                            className="form-layout mx-auto">
                        <div className="mb-2">
                            <label className="form-label label" htmlFor="man-weight">
                                Текущий вес (кг)
                            </label>
                            <input
                                id="man-weight"
                                type="number"
                                className="form-control input"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>

                        <GoalNutrientForm
                            values={form}
                            onChange={setForm}
                            showMetaFields
                            showAllNutrients
                            openGroupsByDefault
                        />

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
