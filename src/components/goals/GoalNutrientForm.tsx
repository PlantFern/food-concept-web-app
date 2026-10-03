import {
    CORE_GOAL_NUTRIENT_IDS,
    NUTRIENT_GROUPS,
    NUTRIENTS,
    nutrientsByGroup,
    unitLabel,
    type NutrientDef,
} from '@/data/nutrients'

export type GoalNutrientFormValues = {
    plannedWeight: string
    startDate: string
    plannedEndDate: string
    amounts: Record<number, string>
}

type Props = {
    values: GoalNutrientFormValues
    onChange: (next: GoalNutrientFormValues) => void
    showMetaFields?: boolean
    showAllNutrients?: boolean
    openGroupsByDefault?: boolean
}

function todayIso(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

export function emptyGoalForm(showAll = false): GoalNutrientFormValues {
    const amounts: Record<number, string> = {}
    const list = showAll ? NUTRIENTS : NUTRIENTS.filter((n) => CORE_GOAL_NUTRIENT_IDS.includes(n.id as 1 | 2 | 3 | 4))
    for (const n of list) amounts[n.id] = ''
    return {
        plannedWeight: '',
        startDate: todayIso(),
        plannedEndDate: '',
        amounts,
    }
}

export function formValuesFromGoal(goal: {
    plannedWeight?: number | null
    startDate?: string | null
    plannedEndDate?: string | null
    nutrientSet?: Array<{ nutrientId: number; amount: number }> | null
} | null): GoalNutrientFormValues {
    const base = emptyGoalForm(true)
    if (!goal) return base
    base.plannedWeight = goal.plannedWeight != null ? String(goal.plannedWeight) : ''
    base.startDate = goal.startDate ?? todayIso()
    base.plannedEndDate = goal.plannedEndDate ?? ''
    for (const item of goal.nutrientSet ?? []) {
        if (item.nutrientId != null && item.amount != null) {
            base.amounts[item.nutrientId] = String(item.amount)
        }
    }
    return base
}

export function toNutrientGoals(
    amounts: Record<number, string>,
): Array<{ nutrientId: number; amount: number }> {
    const out: Array<{ nutrientId: number; amount: number }> = []
    for (const [idStr, raw] of Object.entries(amounts)) {
        const id = Number(idStr)
        if (!raw || !raw.trim()) continue
        const amount = Number(raw)
        if (!Number.isFinite(amount) || amount < 0) continue
        out.push({ nutrientId: id, amount })
    }
    return out
}

function NutrientInput({
    nutrient,
    value,
    onChange,
}: {
    nutrient: NutrientDef
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div className="mb-2">
            <label className="form-label small mb-1" htmlFor={`nut-${nutrient.id}`}>
                {nutrient.name} ({unitLabel(nutrient.unit)})
            </label>
            <input
                id={`nut-${nutrient.id}`}
                type="number"
                min={0}
                step="any"
                className="form-control form-control-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0"
            />
        </div>
    )
}

export function GoalNutrientForm({
    values,
    onChange,
    showMetaFields = true,
    showAllNutrients = true,
    openGroupsByDefault = false,
}: Props) {
    function setField<K extends keyof GoalNutrientFormValues>(key: K, value: GoalNutrientFormValues[K]) {
        onChange({ ...values, [key]: value })
    }

    function setAmount(id: number, value: string) {
        onChange({
            ...values,
            amounts: { ...values.amounts, [id]: value },
        })
    }

    const coreList = NUTRIENTS.filter((n) => CORE_GOAL_NUTRIENT_IDS.includes(n.id as 1 | 2 | 3 | 4))

    return (
        <div className="d-flex flex-column gap-2">
            {showMetaFields && (
                <>
                    <div className="mb-2">
                        <label className="form-label" htmlFor="goal-weight">
                            Целевой вес (кг)
                        </label>
                        <input
                            id="goal-weight"
                            type="number"
                            min={0}
                            step="any"
                            className="form-control"
                            value={values.plannedWeight}
                            onChange={(e) => setField('plannedWeight', e.target.value)}
                        />
                    </div>
                    <div className="row g-2 mb-2">
                        <div className="col-6">
                            <label className="form-label" htmlFor="goal-start">
                                Дата начала
                            </label>
                            <input
                                id="goal-start"
                                type="date"
                                className="form-control"
                                value={values.startDate}
                                onChange={(e) => setField('startDate', e.target.value)}
                            />
                        </div>
                        <div className="col-6">
                            <label className="form-label" htmlFor="goal-end">
                                Дата конца
                            </label>
                            <input
                                id="goal-end"
                                type="date"
                                className="form-control"
                                value={values.plannedEndDate}
                                onChange={(e) => setField('plannedEndDate', e.target.value)}
                            />
                        </div>
                    </div>
                </>
            )}

            {!showAllNutrients &&
                coreList.map((n) => (
                    <NutrientInput
                        key={n.id}
                        nutrient={n}
                        value={values.amounts[n.id] ?? ''}
                        onChange={(v) => setAmount(n.id, v)}
                    />
                ))}

            {showAllNutrients &&
                NUTRIENT_GROUPS.map((group) => (
                    <details key={group.id} className="mb-2" open={openGroupsByDefault && group.id === 'macro'}>
                        <summary className="fw-semibold user-select-none" style={{ cursor: 'pointer' }}>
                            {group.title}
                        </summary>
                        <div className="ps-1 pt-2">
                            {nutrientsByGroup(group.id).map((n) => (
                                <NutrientInput
                                    key={n.id}
                                    nutrient={n}
                                    value={values.amounts[n.id] ?? ''}
                                    onChange={(v) => setAmount(n.id, v)}
                                />
                            ))}
                        </div>
                    </details>
                ))}
        </div>
    )
}
