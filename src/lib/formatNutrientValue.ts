import {NUTRIENTS} from '@/data/nutrients';


const nutrientByCode = new Map(
    NUTRIENTS.map(nutrient => [
        nutrient.code.toUpperCase(),
        nutrient
    ])
);

export function formatNutrientValue(
    value: number|null|undefined,
    nutrientCode?: string|null
): string {

    if(value == null || !Number.isFinite(value))
        return '—';
    
    const nutrient = nutrientCode
        ? nutrientByCode.get(nutrientCode?.toUpperCase())
        : undefined;
    
    if(nutrient?.code === 'ENERGY_KCAL'
        || nutrient?.code === 'PROTEIN'
        || nutrient?.code === 'FAT'
        || nutrient?.code === 'CARBS'
    ) 
        return new Intl.NumberFormat(
            'ru-RU',
            {
                maximumFractionDigits: 0,
                useGrouping: false
            }
        ).format(value);

    const isGramMacro =
        nutrient?.group === 'macro'
        && nutrient.unit === 'g'
        && nutrient.code !== 'WATER'
        && nutrient.code !== 'ALCOHOL';

    let maxDigits = isGramMacro ? 1 : 3;

    if(value !== 0 && Math.abs(value) < 1/10 ** maxDigits)
        maxDigits = Math.min(
            6,
            Math.max(maxDigits, Math.ceil(-Math.log10(Math.abs(value))) + 1)
        );

    return new Intl.NumberFormat(
        'ru-RU',
        {
            maximumFractionDigits: maxDigits,
            useGrouping: false
        }
    ).format(value);
}