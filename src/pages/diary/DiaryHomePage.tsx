import { useEffect, useState } from 'react';
import {
    applyMealTemplate,
    fetchDayMeals,
    type DayMealsDto,
    type MealSectionDto,
    type MealTemplateListItemDto,
} from '@/api/diaryProfile/diary';

import { 
    fetchLatestSettings, 
    type ProfileFeatureSettingsDto 
} from '../../api/diaryProfile/settings';

import {
    fetchActiveGoal,
    type GoalDto,
} from '@/api/diaryProfile/goals';

import { fetchCommentsByType, type DiaryCommentDto } from '@/api/diaryProfile/comments';

import { getDiaryProfileId } from '@/api/onboarding';

import { getErrorMessage } from '@/lib/errors';

import { NUTRIENTS } from '@/data/nutrients';

import { useAlert } from '@/components/ui/Alert';

import {
    BottomNav,
    DateNav,
    PrimaryNutrientGauge,
    NutrientBar,
    MealSection,
    SleepCard,
    WeightCard,
} from '@/components/diary';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'OTHERS'];

const DEFAULT_SECTIONS: MealSectionDto[] = MEAL_TYPES.map((code, i) => ({

    mealId: -(i + 1),
    mealTypeCode: code,
    mealTypeId: i + 1,
    generatedFromTemplateId: null,
    records: [],
    totalPrimaryNutrient: null,
    photoPath: null,
}));

const NUTRIENT_PALETTE = ['#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#e74c3c', '#1abc9c'];

function toIsoDate(d: Date): string {

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
}

function normalizeSectionCode(code: string | null | undefined): string {

    const c = (code ?? '').toUpperCase()
    if (MEAL_TYPES.includes(c as (typeof MEAL_TYPES)[number])) 
        return c;
    if (c.includes('SNACK') || c === 'BRUNCH') 
        return 'SNACK';
    if (c === 'OTHER' || c === 'OTHERS') 
        return 'OTHERS';
    return 'OTHERS';
}

function normalizeSections(raw: MealSectionDto[] | null | undefined): MealSectionDto[] {

    if (!raw?.length) return DEFAULT_SECTIONS;

    const byCode = new Map<string, MealSectionDto>();
    for (const code of MEAL_TYPES) {

        const found = raw.find((s) => (s.mealTypeCode ?? '').toUpperCase() === code);

        byCode.set(
            code,
            found
                ? { ...found, mealTypeCode: code }
                : {
                    mealId: -(MEAL_TYPES.indexOf(code) + 1),
                    mealTypeCode: code,
                    mealTypeId: MEAL_TYPES.indexOf(code) + 1,
                    generatedFromTemplateId: null,
                    records: [],
                    totalPrimaryNutrient: null,
                    photoPath: null,
                },
        );
    }

    for (const s of raw) {

        const code = normalizeSectionCode(s.mealTypeCode);

        if (MEAL_TYPES.includes((s.mealTypeCode ?? '').toUpperCase() as (typeof MEAL_TYPES)[number])) {
            continue;
        }

        const target = byCode.get(code)!;
        const mergedRecords = [...(target.records ?? []), ...(s.records ?? [])];

        byCode.set(code, {

            ...target,
            mealId: target.mealId > 0 ? target.mealId : s.mealId,
            records: mergedRecords,
            photoPath: target.photoPath || s.photoPath || null,
            totalPrimaryNutrient:
                (target.totalPrimaryNutrient ?? 0) + (s.totalPrimaryNutrient ?? 0) || null,
        });
    }

    return MEAL_TYPES.map((code) => byCode.get(code)!);
}

function pickTemplatesForSection(
    templates: MealTemplateListItemDto[],
    mealTypeCode: string,
): MealTemplateListItemDto[] {

    if (!templates.length) 
        return [];

    const code = mealTypeCode.toUpperCase();
    const hourHints: Record<string, [number, number]> = {
        BREAKFAST: [5, 11],
        LUNCH: [11, 16],
        SNACK: [9, 18],
        DINNER: [17, 23],
    };

    const range = hourHints[code];
    if (range) {

        const matched = templates.filter((template) => {

            if (!template.scheduledTime) return false

            const hour = Number(String(template.scheduledTime).slice(0, 2));
            return Number.isFinite(hour) && hour >= range[0] && hour < range[1];
        })
        
        if (matched.length) return matched;
    }

    if (code === 'OTHERS' || code === 'OTHER') {
        return templates.filter((t) => !t.scheduledTime);
    }

    return [];
}

export function DiaryHomePage() {

    const { showAlert } = useAlert();
    const [date, setDate] = useState(() => new Date());
    const [day, setDay] = useState<DayMealsDto | null>(null);
    const [mealComments, setMealComments] = useState<DiaryCommentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [applyingTemplateId, setApplyingTemplateId] = useState<number | null>(null);
    const [settings, setSettings] = useState<ProfileFeatureSettingsDto|null>(null);
    const [activeGoal, setActiveGoal] = useState<GoalDto|null>(null);

    const iso = toIsoDate(date);
    const profileId = getDiaryProfileId();


    async function load() {
        if (profileId == null) {
            setDay(null);
            setMealComments([]);
            setLoading(false);
            showAlert('Нет профиля дневника. Пройдите онбординг.', 'warning');
            return;
        }
        setLoading(true);

        try {

            const [data, comments, goal, settings] = await Promise.all([
                fetchDayMeals(iso, profileId),
                fetchCommentsByType(profileId, 'MEAL'),
                fetchActiveGoal(),
                fetchLatestSettings()
            ]);
            setDay(data);
            setMealComments(comments);
            setActiveGoal(goal);
            setSettings(settings)
        } catch (err: unknown) {

            setDay(null);
            setMealComments([]);
            setSettings(null);
            setActiveGoal(null);
            showAlert(
                getErrorMessage(
                    err, 
                    'Не удалось загрузить день'
                ), 'danger'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {

        void load();
    }, [iso, profileId]);

    function shiftDay(delta: number) {

        setDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + delta);
            return next;
        })
    }

    async function onApplyTemplate(templateId: number, mealTypeId: number) {

        setApplyingTemplateId(templateId);

        try {
            await applyMealTemplate(templateId, mealTypeId, iso)
            await load()
            showAlert('Шаблон отмечен', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось отметить шаблон'), 'danger')
        } finally {
            setApplyingTemplateId(null)
        }
    }

    const hiddenNutrientIds = new Set(
        settings?.hiddenNutrientIds ?? []
    );

    const visibleNutrients = NUTRIENTS.filter((nutrient) => !hiddenNutrientIds.has(nutrient.id));

    const visibleNutrientIds = new Set(visibleNutrients.map(nutrient => nutrient.id));


    const goalNutrients = activeGoal?.nutrientSet ?? [];

    const availableGoalNutrients = goalNutrients.filter(
        goalNutrient => visibleNutrientIds.has(goalNutrient.nutrientId)
    );


    const targetById = new Map(
        (day?.targets ?? []).map(target => [target.nutrientId, target])
    );

    const goalByNutrientId = new Map(
        goalNutrients.map(goalNutrient => [goalNutrient.nutrientId, goalNutrient])
    );

    const prioritizeNutrients = availableGoalNutrients
        .slice(0,4)
        .map(
            goalNutrient => {

                const stat = targetById.get(goalNutrient.nutrientId);
                const nutrient = NUTRIENTS.find(item => item.id === goalNutrient.nutrientId);
                
                return {
                    nutrientId: goalNutrient.nutrientId,
                    nutrientCode: stat?.nutrientCode ?? nutrient?.code ?? '',
                    nutrientName: nutrient?.name ?? stat?.nutrientName ?? '',
                    unit: nutrient?.unit ?? stat?.unit ?? '',
                    targetAmount: stat?.targetAmount ?? goalNutrient.amount,
                    factAmount: stat?.factAmount ?? 0
                };
            }
        );

    const selectedNutrientIds = new Set(
        prioritizeNutrients.map(nutrient => nutrient.nutrientId)
    );

    const additionalNutrients = visibleNutrients
        .filter(nutrient => !selectedNutrientIds.has(nutrient.id))
        .map(nutrient => {

            const stat = targetById.get(nutrient.id);
            const goalNutrient = goalByNutrientId.get(nutrient.id);

            return {
                nutrientId: nutrient.id,
                nutrientCode: stat?.nutrientCode ?? nutrient?.code ?? '',
                nutrientName: nutrient.name,
                unit: nutrient.unit,
                targetAmount: stat?.targetAmount ?? goalNutrient?.amount ?? 0,
                factAmount: stat?.factAmount ?? 0
            };
        });

    const selectedNutrients = [
        ...prioritizeNutrients,
        ...additionalNutrients.slice(
            0, 
            Math.max(0, 4 - prioritizeNutrients.length)
        )
    ];

    const primary = selectedNutrients.find(
        (target) => target.nutrientId === day?.primaryNutrient
    ) 
    ?? prioritizeNutrients[0] 
    ?? null;

    const primaryName = primary?.nutrientName ?? '';
    const primaryUnit = primary?.unit ?? '';

    const secondaryItems = selectedNutrients
        .filter(
            (target) => target.nutrientId !== primary?.nutrientId
        )
        .map((target, index) => ({
            key: String(target.nutrientId),
            label: target.nutrientName,
            value: Math.max(target.factAmount ?? 0, 0),
            goal: target.targetAmount ?? 0,
            unit: target.unit,
            nutrientCode: target.nutrientCode,
            color: NUTRIENT_PALETTE[index % NUTRIENT_PALETTE.length],
    }));


    const sections = normalizeSections(day?.sections);

    const showWeight = day?.weightEnabled !== false;
    const showSleep = day?.sleepEnabled !== false;


    return (
        <div className="diary-shell 
                        col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <header className="bg-brand 
                                p-4 pt-2 
                                rounded-bottom-5">
                <div className="stats-header 
                                d-flex g-2 flex-column
                                justify-content-center justify-item-stretch
                                item-align-center
                                w-100">
                    <DateNav date={date} onPrev={() => shiftDay(-1)} onNext={() => shiftDay(1)} />

                    <div className="stats-body 
                                    d-flex gap-2 flex-column
                                    justify-content-center justify-item-stretch
                                    item-align-center
                                    w-100">

                        {selectedNutrients.length > 0 && (
                            <>
                                {primary && (
                                    <PrimaryNutrientGauge
                                        current={primary?.factAmount ?? 0}
                                        goal={primary?.targetAmount ?? 0}
                                        name={primaryName}
                                        unit={primaryUnit}
                                        nutrientCode={primary?.nutrientCode ?? day?.primaryNutrientCode}
/>
                                )}

                                {secondaryItems.map((item) => (
                                    <NutrientBar
                                        key={item.key}
                                        item={item}
                                    />
                                ))}
                            </>
                        )}

                    </div>
                </div>
            </header>

            <div className="diary-content 
                            container 
                            mt-2">
                {loading && <p className="meal-empty">Загрузка…</p>}

                <div>
                    <div className="">
                        {!loading &&
                            sections.map((section) => (
                                <div className="" key={section.mealTypeCode}>
                                    <MealSection
                                        mealTypeCode={section.mealTypeCode}
                                        mealTypeId={section.mealTypeId}
                                        mealId={section.mealId}
                                        date={iso}
                                        records={section.records ?? []}
                                        totalPrimaryNutrient={section.totalPrimaryNutrient}
                                        mealPhotoPath={section.photoPath}
                                        comments={mealComments}
                                        primaryUnit={primaryUnit}
                                        templates={pickTemplatesForSection(
                                            day?.pendingTemplates ?? [],
                                            section.mealTypeCode,
                                        )}
                                        applyingTemplateId={applyingTemplateId}
                                        onApplyTemplate={onApplyTemplate}
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {!loading && (showWeight || showSleep) && (
                    <div className="border-top pt-2">
                        <h4 className="mb-3">Логи</h4>

                        <div className="">
                            {showWeight && (
                                <div className="">
                                    <WeightCard weightKg={day?.latestWeight?.weight ?? null} />
                                </div>
                            )}

                            {showSleep && (
                                <div className="">
                                    <SleepCard
                                        entries={(day?.sleepForDay ?? []).map((s) => ({
                                            id: s.id,
                                            start: s.beganAt,
                                            end: s.endedAt ?? '',
                                        }))}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
