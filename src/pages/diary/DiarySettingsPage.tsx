import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { useAlert } from '@/components/ui/Alert'
import {
    fetchLatestSettings,
    saveSettings,
    type ProfileFeatureSettingsDto,
} from '@/api/diaryProfile/settings'
import { hasActiveSpecialistControl } from '@/api/specialist'
import { getDiaryProfileId } from '@/api/onboarding'
import { NUTRIENT_GROUPS, NUTRIENTS, nutrientsByGroup } from '@/data/nutrients'
import { getErrorMessage } from '@/lib/errors'

export function DiarySettingsPage() {
    const { showAlert } = useAlert()
    const [current, setCurrent] = useState<ProfileFeatureSettingsDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [lockedBySpecialist, setLockedBySpecialist] = useState(false)

    const [showSleep, setShowSleep] = useState(false)
    const [showSleepLogs, setShowSleepLogs] = useState(false)
    const [showWeight, setShowWeight] = useState(false)
    const [showWeightLogs, setShowWeightLogs] = useState(false)
    const [visibleIds, setVisibleIds] = useState<Set<number>>(() => new Set(NUTRIENTS.map((n) => n.id)))

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true)
            const profileId = getDiaryProfileId()
            const [data, locked] = await Promise.all([
                fetchLatestSettings(),
                profileId != null ? hasActiveSpecialistControl(profileId) : Promise.resolve(false),
            ])

            if (cancelled) return
            setCurrent(data)
            setLockedBySpecialist(locked)

            if (data) {
                setShowSleep(Boolean(data.showSleep))
                setShowSleepLogs(Boolean(data.showSleepLogs))
                setShowWeight(Boolean(data.showWeight))
                setShowWeightLogs(Boolean(data.showWeightLogs))
                const hidden = new Set(data.hiddenNutrientIds ?? [])
                setVisibleIds(new Set(NUTRIENTS.filter((n) => !hidden.has(n.id)).map((n) => n.id)))
            }
            setLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [])

    function toggleNutrient(id: number) {
        if (lockedBySpecialist) return
        setVisibleIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    async function onSave() {
        if (lockedBySpecialist) return
        setError('')
        setSaving(true)
        try {
            const hiddenNutrients = NUTRIENTS.filter((n) => !visibleIds.has(n.id)).map((n) => n.id)
            const saved = await saveSettings(current, {
                showSleep,
                showSleepLogs,
                showWeight,
                showWeightLogs,
                showAllergensWarning: Boolean(current?.showAllergensWarning),
                hiddenNutrients,
            })
            setCurrent(saved)
            showAlert('Настройки обновлены', 'success')
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить настройки'))
        } finally {
            setSaving(false)
        }
    }

    const disabled = loading || lockedBySpecialist

    return (
        <div className="diary-shell">
            <div className="diary-content" style={{ paddingBottom: '7.5rem' }}>
                <div className='bg-brand text-invert p-2 rounded-bottom-4'>
                    <Link to="/diary/settings" className="small text-decoration-none">
                        ← Назад
                    </Link>
                    <h1 className="page-title mt-2">Настройки</h1>
                </div>

                {loading && <p className="text-muted">Загрузка…</p>}

                {!loading && lockedBySpecialist && (
                    <div className="alert alert-warning small" role="status">
                        У вас активная связь со специалистом (тип «специалист»). Настройки
                        управляются специалистом и недоступны для изменения.
                    </div>
                )}

                {!loading && (
                    <>
                        {error && <p className="text-danger small">{error}</p>}

                        <div className="card border-0 shadow-sm mb-3">
                            <div className="card-body">
                                <div className="form-check form-switch mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="show-sleep"
                                        checked={showSleep}
                                        disabled={disabled}
                                        onChange={(e) => setShowSleep(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="show-sleep">
                                        Отображение логов сна
                                    </label>
                                </div>
                                <div className="form-check form-switch mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="show-sleep-logs"
                                        checked={showSleepLogs}
                                        disabled={disabled}
                                        onChange={(e) => setShowSleepLogs(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="show-sleep-logs">
                                        Добавление сна
                                    </label>
                                </div>
                                <div className="form-check form-switch mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="show-weight"
                                        checked={showWeight}
                                        disabled={disabled}
                                        onChange={(e) => setShowWeight(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="show-weight">
                                        Отображение веса
                                    </label>
                                </div>
                                <div className="form-check form-switch mb-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="show-weight-logs"
                                        checked={showWeightLogs}
                                        disabled={disabled}
                                        onChange={(e) => setShowWeightLogs(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="show-weight-logs">
                                        Добавление веса
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm mb-3">
                            <div className="card-body">
                                <h2 className="h6 mb-3">Нутриенты</h2>
                                <p className="text-muted small">Отметьте, что показывать в дневнике</p>
                                {NUTRIENT_GROUPS.map((group) => (
                                    <details key={group.id} className="mb-2" open={group.id === 'macro'}>
                                        <summary className="fw-semibold" style={{ cursor: 'pointer' }}>
                                            {group.title}
                                        </summary>
                                        <div className="pt-2 ps-1">
                                            {nutrientsByGroup(group.id).map((n) => (
                                                <div className="form-check mb-1" key={n.id}>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`vis-${n.id}`}
                                                        checked={visibleIds.has(n.id)}
                                                        disabled={disabled}
                                                        onChange={() => toggleNutrient(n.id)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`vis-${n.id}`}>
                                                        {n.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </>
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
                    {saving ? 'Сохранение…' : 'Обновить'}
                </button>
            </div>

            <BottomNav />
        </div>
    )
}
