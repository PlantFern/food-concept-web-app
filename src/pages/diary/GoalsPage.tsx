import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { useAlert } from '@/components/ui/Alert'
import {
    GoalNutrientForm,
    emptyGoalForm,
    toNutrientGoals,
    type GoalNutrientFormValues,
} from '@/components/goals'
import {
    completeGoal,
    createGoal,
    fetchActiveGoal,
    type GoalDto,
    type GoalNutrientDto,
} from '@/api/diaryProfile/goals'
import { hasActiveSpecialistControl } from '@/api/specialist'
import { getDiaryProfileId } from '@/api/onboarding'
import { NUTRIENT_BY_ID, unitLabel } from '@/data/nutrients'
import { getErrorMessage } from '@/lib/errors'

function sortedNutrients(list: GoalNutrientDto[] | null | undefined): GoalNutrientDto[] {
    return [...(list ?? [])].sort((a, b) => Number(a.nutrientId) - Number(b.nutrientId))
}

export function GoalsPage() {
    const { showAlert } = useAlert()
    const [goal, setGoal] = useState<GoalDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [error, setError] = useState('')
    const [lockedBySpecialist, setLockedBySpecialist] = useState(false)
    const [form, setForm] = useState<GoalNutrientFormValues>(() => emptyGoalForm(true))

    async function reload() {
        setLoading(true)
        const profileId = getDiaryProfileId()
        const [active, locked] = await Promise.all([
            fetchActiveGoal(),
            profileId != null ? hasActiveSpecialistControl(profileId) : Promise.resolve(false),
        ])
        setGoal(active)
        setLockedBySpecialist(locked)
        setForm(emptyGoalForm(true))
        setLoading(false)
    }

    useEffect(() => {
        void reload()
    }, [])

    async function onSave() {
        if (lockedBySpecialist) return
        setError('')
        const nutrients = toNutrientGoals(form.amounts)
        if (nutrients.length === 0) {
            setError('Укажите хотя бы один нутриент')
            return
        }
        if (!form.startDate) {
            setError('Укажите дату начала')
            return
        }

        setSaving(true)
        try {
            const payload = {
                plannedWeight: form.plannedWeight ? Number(form.plannedWeight) : null,
                startDate: form.startDate,
                plannedEndDate: form.plannedEndDate || null,
                nutrientGoals: nutrients,
            }
            if (goal?.id) {
                await completeGoal(goal.id).catch(() => undefined)
            }
            const saved = await createGoal(payload)
            setGoal(saved)
            setForm(emptyGoalForm(true))
            showAlert('Новая цель создана', 'success')
            await reload()
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить цель'))
        } finally {
            setSaving(false)
        }
    }

    async function onComplete() {
        if (!goal?.id || lockedBySpecialist) return
        setCompleting(true)
        setError('')
        try {
            await completeGoal(goal.id)
            setGoal(null)
            setForm(emptyGoalForm(true))
            showAlert('Цель завершена', 'success')
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось завершить цель'))
        } finally {
            setCompleting(false)
        }
    }

    const disabled = loading || lockedBySpecialist

    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="diary-content p-3" style={{ paddingBottom: '7.5rem' }}>
                <Link to="/diary/settings" className="small text-decoration-none">
                    ← Назад
                </Link>
                <h1 className="page-title mt-2">Цели</h1>

                {loading && <p className="text-muted">Загрузка…</p>}

                {!loading && lockedBySpecialist && (
                    <div className="alert alert-warning small" role="status">
                        У вас активная связь со специалистом (тип «специалист»). Цели управляются
                        специалистом и недоступны для изменения.
                    </div>
                )}

                {!loading && goal && (
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <h2 className="h6 mb-0">Текущая цель</h2>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={completing || lockedBySpecialist}
                                    onClick={() => void onComplete()}
                                >
                                    {completing ? '…' : 'Завершить'}
                                </button>
                            </div>
                            {goal.plannedWeight != null && (
                                <p className="mb-1 small">
                                    Целевой вес: <strong>{goal.plannedWeight} кг</strong>
                                </p>
                            )}
                            <p className="mb-1 small text-muted">
                                {goal.startDate ?? '—'} → {goal.plannedEndDate ?? 'без срока'}
                            </p>
                            <ul className="list-unstyled mb-0 small">
                                {sortedNutrients(goal.nutrientSet).map((n) => {
                                    const def = NUTRIENT_BY_ID[n.nutrientId]
                                    return (
                                        <li key={`${n.nutrientId}-${n.id ?? n.amount}`}>
                                            {def?.name ?? `Nutrient #${n.nutrientId}`}: {n.amount}
                                            {def ? ` ${unitLabel(def.unit)}` : ''}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                {!loading && (
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body">
                            <h2 className="h6 mb-3">Новая цель</h2>
                            {error && <p className="text-danger small">{error}</p>}
                            <GoalNutrientForm
                                values={form}
                                onChange={setForm}
                                showMetaFields
                                showAllNutrients
                                disabled={disabled}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div
                className="position-fixed start-50 translate-middle-x w-100 px-3"
                style={{
                    bottom: '4.5rem',
                    maxWidth: '540px',
                    zIndex: 1020,
                }}
            >
                <button
                    type="button"
                    className="btn btn-success w-100 shadow"
                    disabled={disabled || saving}
                    onClick={() => void onSave()}
                >
                    {saving ? 'Сохранение…' : 'Создать цель'}
                </button>
            </div>

            <BottomNav />
        </div>
    )
}
