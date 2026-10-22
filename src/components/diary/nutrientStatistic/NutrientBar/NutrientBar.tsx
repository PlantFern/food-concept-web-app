import styles from './NutrientBar.module.css';

import { formatNutrientValue } from '@/lib/formatNutrientValue';


export type NutrientBarItem = {
    key: string
    label: string
    value: number
    goal: number
    unit?: string
    code: string
    color: string
};

export type NutrientBarProps = {
    item: NutrientBarItem
};


export function NutrientBar({ item }: NutrientBarProps) {

    const value = Math.max(0, item.value);
    const goal = item.goal;
    const percent =
        goal > 0 ? Math.min((value / goal) * 100, 100) : 0;

    return (
        <div className={styles.nutrientBar}>
            <div className={styles.nutrientBarHeader}>
                <div className={styles.nutrientBarInfo}>
                    <span className={styles.nutrientBarLabel}>
                        {item.label}
                    </span>

                    <span className={styles.nutrientBarAmount}>
                        {' - '}
                        {formatNutrientValue(value, item.code)}{item.unit}
                        {' / '}
                        {formatNutrientValue(goal, item.code)}{item.unit}
                    </span>
                </div>

                <span className={styles.nutrientBarGoal}>
                    {formatNutrientValue(goal, item.code)}{item.unit}
                </span>
            </div>

            <div
                className={styles.nutrientBarTrack}
                role="progressbar"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={goal > 0 ? goal : 0}
                aria-valuenow={Math.min(value, goal > 0 ? goal : 0)}
            >
                <div
                    className={styles.nutrientBarFill}
                    style={{
                        width: `${percent}%`,
                        backgroundColor: item.color,
                    }}
                />
            </div>
        </div>
    );
}
