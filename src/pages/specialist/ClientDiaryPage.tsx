import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { SpecialistBottomNav } from '@/components/specialist/SpecialistBottomNav'
import { fetchSpecialistClients, getMySpecialist, isActiveRelation } from '@/api/specialist'
import { fetchDayMeals } from '@/api/meals/queries'
import type { DayMealsDto, WeightLogDto } from '@/api/diaryProfile/diary'
import {
    createClientComment,
    getClientLatestGoal,
    getClientLatestSettings,
    getClientProfile,
    getClientCommentsByType,
    getClientWeights,
    createClientGoal,
    updateClientGoal,
    saveClientSettings,
} from '@/api/specialist/client'
import type { DiaryProfileDto } from '@/api/diaryProfile/diary'
import type { DiaryCommentDto, CommentType } from '@/api/diaryProfile/comments'
import type { GoalDto } from '@/api/diaryProfile/goals'
import type { ProfileFeatureSettingsDto } from '@/api/diaryProfile/settings'
import { NUTRIENTS } from '@/data/nutrients'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type Tab = 'diary' | 'goals' | 'settings'
const MAIN_NUTRIENTS = NUTRIENTS.filter((n) => [1, 2, 3, 4, 5].includes(n.id))

function todayLocal() {
    const d = new Date()
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export function ClientDiaryPage() {
    const { diaryProfileId: rawId } = useParams()
    const profileId = Number(rawId)
    const [searchParams, setSearchParams] = useSearchParams()
    const { showAlert } = useAlert()
    const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'diary')
    const [date, setDate] = useState(searchParams.get('date') || todayLocal())
    const [profile, setProfile] = useState<DiaryProfileDto | null>(null)
    const [day, setDay] = useState<DayMealsDto | null>(null)
    const [weights, setWeights] = useState<WeightLogDto[]>([])
    const [comments, setComments] = useState<DiaryCommentDto[]>([])
    const [goal, setGoal] = useState<GoalDto | null>(null)
    const [settings, setSettings] = useState<ProfileFeatureSettingsDto | null>(null)
    const [relationType, setRelationType] = useState('SPECIALIST')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
    const [busyComment, setBusyComment] = useState<string | null>(null)
    const [goalWeight, setGoalWeight] = useState('')
    const [goalStart, setGoalStart] = useState(todayLocal())
    const [goalEnd, setGoalEnd] = useState('')
    const [goalAmounts, setGoalAmounts] = useState<Record<number, string>>({})
    const [settingsValues, setSettingsValues] = useState({ showSleep: true, showSleepLogs: true, showWeight: true, showWeightLogs: true, showAllergensWarning: true, hiddenNutrients: [] as number[] })
    const isObserver = relationType === 'OBSERVER'

    const load = useCallback(async () => {
        if (!Number.isFinite(profileId) || profileId <= 0) {
            setError('Некорректный ID профиля')
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const specialist = await getMySpecialist()
            if (!specialist) throw new Error('Профиль специалиста не найден')
            const relations = await fetchSpecialistClients(specialist.id)
            const activeRelation = relations.find((r) => r.diaryProfileId === profileId && isActiveRelation(r))
            if (!activeRelation) throw new Error('Нет действующей связи с этим пользователем')
            const currentRelationType = String(activeRelation.relationType || 'SPECIALIST').toUpperCase()
            setRelationType(currentRelationType)
            if (currentRelationType === 'OBSERVER' && tab !== 'diary') {
                setTab('diary')
                const params = new URLSearchParams(searchParams)
                params.set('tab', 'diary')
                setSearchParams(params, { replace: true })
            }
            const [p, d, w, mealComments, sleepComments, weightComments, latestGoal, latestSettings] = await Promise.all([
                getClientProfile(profileId),
                fetchDayMeals(date, profileId),
                getClientWeights(profileId),
                getClientCommentsByType(profileId, 'MEAL'),
                getClientCommentsByType(profileId, 'SLEEP_LOG'),
                getClientCommentsByType(profileId, 'WEIGHT_LOG'),
                getClientLatestGoal(profileId),
                getClientLatestSettings(profileId),
            ])
            setProfile(p)
            setDay(d)
            setWeights(w)
            setComments([...mealComments, ...sleepComments, ...weightComments])
            setGoal(latestGoal)
            setSettings(latestSettings)
            setGoalWeight(latestGoal?.plannedWeight == null ? '' : String(latestGoal.plannedWeight))
            setGoalStart(latestGoal?.startDate || todayLocal())
            setGoalEnd(latestGoal?.plannedEndDate || '')
            const amounts: Record<number, string> = {}
            for (const n of MAIN_NUTRIENTS) {
                const saved = latestGoal?.nutrientSet?.find((x) => x.nutrientId === n.id)
                amounts[n.id] = saved?.amount == null ? '' : String(saved.amount)
            }
            setGoalAmounts(amounts)
            setSettingsValues({
                showSleep: latestSettings?.showSleep ?? true,
                showSleepLogs: latestSettings?.showSleepLogs ?? true,
                showWeight: latestSettings?.showWeight ?? true,
                showWeightLogs: latestSettings?.showWeightLogs ?? true,
                showAllergensWarning: latestSettings?.showAllergensWarning ?? true,
                hiddenNutrients: latestSettings?.hiddenNutrientIds ?? [],
            })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось загрузить профиль пользователя'))
        } finally {
            setLoading(false)
        }
    }, [profileId, date, tab, searchParams, setSearchParams])

    useEffect(() => { void load() }, [load])

    const commentMap = useMemo(() => {
        const map = new Map<string, DiaryCommentDto[]>()
        for (const c of comments) {
            const key = String(c.commentableType).toUpperCase() + ':' + c.commentableId
            map.set(key, [...(map.get(key) ?? []), c])
        }
        return map
    }, [comments])

    function switchTab(next: Tab) {
        setTab(next)
        const params = new URLSearchParams(searchParams)
        params.set('tab', next)
        setSearchParams(params, { replace: true })
    }

    async function submitComment(type: CommentType, id: number) {
        const key = type + ':' + id
        const body = (commentDrafts[key] || '').trim()
        if (!body) return
        setBusyComment(key)
        try {
            const created = await createClientComment(profileId, { commentableType: type, commentableId: id, body })
            setComments((prev) => [...prev, created])
            setCommentDrafts((prev) => ({ ...prev, [key]: '' }))
            showAlert('Комментарий сохранён', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось сохранить комментарий'), 'danger')
        } finally {
            setBusyComment(null)
        }
    }

    async function saveGoal(e: React.FormEvent) {
        e.preventDefault()
        const nutrientGoals = [
            ...(goal?.nutrientSet ?? [])
                .filter((saved) => !MAIN_NUTRIENTS.some((n) => n.id === saved.nutrientId))
                .map((saved) => ({ nutrientId: saved.nutrientId, amount: saved.amount })),
            ...MAIN_NUTRIENTS
                .filter((n) => goalAmounts[n.id].trim() !== '')
                .map((n) => ({ nutrientId: n.id, amount: Number(goalAmounts[n.id]) })),
        ]
        if (nutrientGoals.some((n) => !Number.isFinite(n.amount) || n.amount <= 0)) {
            showAlert('Цели нутриентов должны быть положительными числами', 'warning')
            return
        }
        try {
            const payload = { plannedWeight: goalWeight.trim() ? Number(goalWeight) : null, startDate: goalStart, plannedEndDate: goalEnd || null, nutrientGoals }
            const saved = goal?.id ? await updateClientGoal(goal.id, payload) : await createClientGoal(profileId, payload)
            setGoal(saved)
            showAlert('Цель сохранена', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось сохранить цель'), 'danger')
        }
    }

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault()
        try {
            const saved = await saveClientSettings(profileId, settings, settingsValues)
            setSettings(saved)
            showAlert('Настройки пользователя сохранены', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось сохранить настройки'), 'danger')
        }
    }

    function renderCommentBox(type: CommentType, id: number) {
        const key = type + ':' + id
        const existing = commentMap.get(key) ?? []
        return (
            <div className="mt-2">
                {existing.map((c) => <div key={c.id} className="border-start border-3 ps-2 py-1 small mb-1"><span className="fw-semibold">Комментарий специалиста:</span> {c.body}</div>)}
                {!isObserver && (
                    <form className="d-flex gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); void submitComment(type, id) }}>
                        <input className="form-control form-control-sm" value={commentDrafts[key] ?? ''} onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="Комментарий к записи…" />
                        <button className="btn btn-sm btn-outline-primary" type="submit" disabled={busyComment === key || !(commentDrafts[key] ?? '').trim()}>{busyComment === key ? '…' : 'Отправить'}</button>
                    </form>
                )}
            </div>
        )
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/specialist/clients" className="btn-tertiary bg-text-on-brand text-decoration-none">← К связям</Link>
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Дневник пользователя #{profileId}</h2>
            </div>
            <div className="diary-content p-3 pb-5">
                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}
                {!loading && profile && (
                    <>
                        <div className="card border-0 shadow-sm mb-3"><div className="card-body">
                            <div className="fw-semibold">Профиль #{profile.id}</div>
                            <div className="small text-muted">Пользователь #{profile.userId} · {profile.genderCode || 'Пол не указан'} · {profile.height ? profile.height + ' см' : 'Рост не указан'}{profile.birthDate ? ' · дата рождения ' + profile.birthDate : ''}</div>
                            {isObserver && <div className="alert alert-info mt-2 mb-0">Связь типа «Наблюдатель»: доступен просмотр без изменения данных.</div>}
                        </div></div>
                        <div className="d-flex gap-2 flex-wrap mb-3">
                            <button className={'btn btn-sm ' + (tab === 'diary' ? 'btn-primary' : 'btn-outline-primary')} onClick={() => switchTab('diary')}>Дневник и логи</button>
                            {!isObserver && <button className={'btn btn-sm ' + (tab === 'goals' ? 'btn-primary' : 'btn-outline-primary')} onClick={() => switchTab('goals')}>Цели</button>}
                            {!isObserver && <button className={'btn btn-sm ' + (tab === 'settings' ? 'btn-primary' : 'btn-outline-primary')} onClick={() => switchTab('settings')}>Настройки дневника</button>}
                        </div>
                        {tab === 'diary' && (
                            <>
                                <div className="mb-3"><label className="form-label" htmlFor="client-date">Дата дневника</label><input id="client-date" type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                                {day?.sections?.length ? day.sections.map((section) => (
                                    <section key={section.mealId} className="card border-0 shadow-sm mb-3"><div className="card-body">
                                        <div className="fw-semibold">{section.mealTypeCode || 'Приём пищи'} <span className="text-muted small">· {section.records.length} записей</span></div>
                                        <ul className="list-group list-group-flush mt-2">{section.records.map((record) => <li key={record.recordId} className="list-group-item px-0"><div className="d-flex justify-content-between gap-2"><span>{record.productDescription}</span><span className="text-muted small">{record.gramWeight != null ? record.gramWeight + ' г' : record.amount ?? ''}</span></div></li>)}</ul>
                                        {renderCommentBox('MEAL', section.mealId)}
                                    </div></section>
                                )) : <p className="text-muted">За эту дату нет записей о приёмах пищи.</p>}
                                {day?.sleepForDay?.map((log) => <section key={'sleep-' + log.id} className="card border-0 shadow-sm mb-2"><div className="card-body"><div className="fw-semibold">Сон</div><div className="small text-muted">{log.beganAt} — {log.endedAt || 'не завершён'}</div>{renderCommentBox('SLEEP_LOG', log.id)}</div></section>)}
                                {day?.latestWeight && <section className="card border-0 shadow-sm mb-2"><div className="card-body"><div className="fw-semibold">Вес</div><div>{day.latestWeight.weight} кг</div>{renderCommentBox('WEIGHT_LOG', day.latestWeight.id)}</div></section>}
                                {weights.length > 0 && <section className="card border-0 shadow-sm mt-3"><div className="card-body"><div className="fw-semibold mb-2">История веса</div>{weights.map((w) => <div key={w.id} className="border-bottom py-2"><div className="d-flex justify-content-between"><span>Запись #{w.id}</span><span>{w.weight} кг</span></div>{renderCommentBox('WEIGHT_LOG', w.id)}</div>)}</div></section>}
                            </>
                        )}
                        {tab === 'goals' && !isObserver && (
                            <form className="card border-0 shadow-sm" onSubmit={(e) => void saveGoal(e)}><div className="card-body">
                                <h5>Цель пользователя</h5>
                                <div className="row g-2">
                                    <div className="col-12"><label className="form-label" htmlFor="goal-weight">Плановый вес, кг</label><input id="goal-weight" type="number" min="20" max="300" step="0.1" className="form-control" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} /></div>
                                    <div className="col-6"><label className="form-label" htmlFor="goal-start">Дата начала</label><input id="goal-start" type="date" required className="form-control" value={goalStart} onChange={(e) => setGoalStart(e.target.value)} /></div>
                                    <div className="col-6"><label className="form-label" htmlFor="goal-end">Плановое завершение</label><input id="goal-end" type="date" className="form-control" value={goalEnd} onChange={(e) => setGoalEnd(e.target.value)} /></div>
                                </div>
                                <h6 className="mt-3">Цели нутриентов</h6>
                                {MAIN_NUTRIENTS.map((n) => <div className="row align-items-center g-2 mb-2" key={n.id}><label className="col-7 small" htmlFor={'nutrient-' + n.id}>{n.name} ({n.unit})</label><div className="col-5"><input id={'nutrient-' + n.id} type="number" min="0.01" step="any" className="form-control form-control-sm" value={goalAmounts[n.id] ?? ''} onChange={(e) => setGoalAmounts((prev) => ({ ...prev, [n.id]: e.target.value }))} /></div></div>)}
                                <button className="btn btn-primary w-100 mt-2" type="submit">Сохранить цель</button>
                            </div></form>
                        )}
                        {tab === 'settings' && !isObserver && (
                            <form className="card border-0 shadow-sm" onSubmit={(e) => void saveSettings(e)}><div className="card-body">
                                <h5>Настройки дневника пользователя</h5>
                                {([
                                    ['showSleep', 'Показывать сон'],
                                    ['showSleepLogs', 'Показывать записи сна'],
                                    ['showWeight', 'Показывать вес'],
                                    ['showWeightLogs', 'Показывать записи веса'],
                                    ['showAllergensWarning', 'Предупреждать об аллергенах'],
                                ] as const).map(([key, label]) => <label className="form-check d-flex gap-2 mb-2" key={key}><input className="form-check-input" type="checkbox" checked={settingsValues[key]} onChange={(e) => setSettingsValues((prev) => ({ ...prev, [key]: e.target.checked }))} /><span>{label}</span></label>)}
                                <h6 className="mt-3">Скрыть нутриенты</h6>
                                {MAIN_NUTRIENTS.map((n) => <label className="form-check d-flex gap-2 mb-2" key={n.id}><input className="form-check-input" type="checkbox" checked={settingsValues.hiddenNutrients.includes(n.id)} onChange={(e) => setSettingsValues((prev) => ({ ...prev, hiddenNutrients: e.target.checked ? [...prev.hiddenNutrients, n.id] : prev.hiddenNutrients.filter((id) => id !== n.id) }))} /><span>{n.name}</span></label>)}
                                <button className="btn btn-primary w-100 mt-2" type="submit">Сохранить настройки</button>
                            </div></form>
                        )}
                    </>
                )}
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
