import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { useAlert } from '@/components/ui/Alert'
import {
    GoalNutrientForm,
    emptyGoalForm,
    formValuesFromGoal,
    toNutrientGoals,
    type GoalNutrientFormValues,
} from '@/components/goals'
import {
    completeGoal,
    createGoal,
    fetchActiveGoal,
    updateGoal,
    type GoalDto,
} from '@/api/goals'
import { NUTRIENT_BY_ID, unitLabel } from '@/data/nutrients'
import { getErrorMessage } from '@/lib/errors'

export function GoalsPage() {
    const { showAlert } = useAlert()
    const [goal, setGoal] = useState<GoalDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState<GoalNutrientFormValues>(() => emptyGoalForm(true))

    async function reload() {
        setLoading(true)
        const active = await fetchActiveGoal()
        setGoal(active)
        setForm(formValuesFromGoal(active))
        setLoading(false)
    }

    useEffect(() => {
        void reload()
    }, [])

    async function onSave() {
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
            const saved = goal?.id
                ? await updateGoal(goal.id, payload)
                : await createGoal(payload)
            setGoal(saved)
            setForm(formValuesFromGoal(saved))
            showAlert(goal?.id ? 'Цель обновлена' : 'Цель добавлена', 'success')
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить цель'))
        } finally {
            setSaving(false)
        }
    }

    async function onComplete() {
        if (!goal?.id) return
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

    return (
        <div className="diary-shell">
            <div className="diary-content p-3" style={{ paddingBottom: '7.5rem' }}>
                <Link to="/diary/settings" className="small text-decoration-none">
                    ← Назад
                </Link>
                <h1 className="page-title mt-2">Цели</h1>

                {loading && <p className="text-muted">Загрузка…</p>}

                {!loading && goal && (
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <h2 className="h6 mb-0">Текущая цель</h2>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={completing}
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
                                {(goal.nutrientSet ?? []).map((n) => {
                                    const def = NUTRIENT_BY_ID[n.nutrientId]
                                    return (
                                        <li key={n.nutrientId}>
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
                            <h2 className="h6 mb-3">{goal ? 'Изменить цель' : 'Новая цель'}</h2>
                            {error && <p className="text-danger small">{error}</p>}
                            <GoalNutrientForm
                                values={form}
                                onChange={setForm}
                                showMetaFields
                                showAllNutrients
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
                    disabled={loading || saving}
                    onClick={() => void onSave()}
                >
                    {saving ? 'Сохранение…' : goal ? 'Обновить' : 'Добавить'}
                </button>
            </div>

            <BottomNav />
        </div>
    )
}
