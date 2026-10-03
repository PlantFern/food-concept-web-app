export type NutrientUnit = 'kcal' | 'g' | 'mg' | 'mcg' | 'IU'

export type NutrientDef = {
    id: number
    code: string
    name: string
    unit: NutrientUnit
    group: NutrientGroupId
}

export type NutrientGroupId = 'macro' | 'mineral' | 'bioactive'

export type NutrientGroup = {
    id: NutrientGroupId
    title: string
}

export const NUTRIENT_GROUPS: NutrientGroup[] = [
    { id: 'macro', title: 'Макронутриенты' },
    { id: 'mineral', title: 'Минералы' },
    { id: 'bioactive', title: 'Биологически активные соединения' },
]

export const NUTRIENTS: NutrientDef[] = [
    { id: 1, code: 'ENERGY_KCAL', name: 'Энергия', unit: 'kcal', group: 'macro' },
    { id: 2, code: 'PROTEIN', name: 'Белки', unit: 'g', group: 'macro' },
    { id: 3, code: 'FAT', name: 'Жиры', unit: 'g', group: 'macro' },
    { id: 4, code: 'CARBS', name: 'Углеводы', unit: 'g', group: 'macro' },
    { id: 5, code: 'FIBER', name: 'Клетчатка', unit: 'g', group: 'macro' },
    { id: 6, code: 'SUGAR', name: 'Сахара', unit: 'g', group: 'macro' },
    { id: 7, code: 'STARCH', name: 'Крахмал', unit: 'g', group: 'macro' },
    { id: 8, code: 'SATURATED_FAT', name: 'Насыщенные жиры', unit: 'g', group: 'macro' },
    { id: 9, code: 'MONOUNSAT_FAT', name: 'Мононенасыщенные жиры', unit: 'g', group: 'macro' },
    { id: 10, code: 'POLYUNSAT_FAT', name: 'Полиненасыщенные жиры', unit: 'g', group: 'macro' },
    { id: 11, code: 'TRANS_FAT', name: 'Трансжиры', unit: 'g', group: 'macro' },
    { id: 12, code: 'CHOLESTEROL', name: 'Холестерин', unit: 'mg', group: 'macro' },
    { id: 36, code: 'WATER', name: 'Вода', unit: 'g', group: 'macro' },
    { id: 37, code: 'ALCOHOL', name: 'Алкоголь', unit: 'g', group: 'macro' },

    { id: 13, code: 'SODIUM', name: 'Натрий', unit: 'mg', group: 'mineral' },
    { id: 14, code: 'POTASSIUM', name: 'Калий', unit: 'mg', group: 'mineral' },
    { id: 15, code: 'CALCIUM', name: 'Кальций', unit: 'mg', group: 'mineral' },
    { id: 16, code: 'MAGNESIUM', name: 'Магний', unit: 'mg', group: 'mineral' },
    { id: 17, code: 'PHOSPHORUS', name: 'Фосфор', unit: 'mg', group: 'mineral' },
    { id: 18, code: 'IRON', name: 'Железо', unit: 'mg', group: 'mineral' },
    { id: 19, code: 'ZINC', name: 'Цинк', unit: 'mg', group: 'mineral' },
    { id: 20, code: 'COPPER', name: 'Медь', unit: 'mg', group: 'mineral' },
    { id: 21, code: 'MANGANESE', name: 'Марганец', unit: 'mg', group: 'mineral' },
    { id: 22, code: 'SELENIUM', name: 'Селен', unit: 'mcg', group: 'mineral' },

    { id: 23, code: 'VITAMIN_A', name: 'Витамин A', unit: 'mcg', group: 'bioactive' },
    { id: 24, code: 'VITAMIN_C', name: 'Витамин C', unit: 'mg', group: 'bioactive' },
    { id: 25, code: 'VITAMIN_D', name: 'Витамин D', unit: 'IU', group: 'bioactive' },
    { id: 26, code: 'VITAMIN_E', name: 'Витамин E', unit: 'mg', group: 'bioactive' },
    { id: 27, code: 'VITAMIN_K', name: 'Витамин K', unit: 'mcg', group: 'bioactive' },
    { id: 28, code: 'THIAMIN_B1', name: 'Витамин B1 (тиамин)', unit: 'mcg', group: 'bioactive' },
    { id: 29, code: 'RIBOFLAVIN_B2', name: 'Витамин B2 (рибофлавин)', unit: 'mcg', group: 'bioactive' },
    { id: 30, code: 'NIACIN_B3', name: 'Витамин B3 (ниацин)', unit: 'mcg', group: 'bioactive' },
    { id: 31, code: 'VITAMIN_B5', name: 'Витамин B5', unit: 'mcg', group: 'bioactive' },
    { id: 32, code: 'VITAMIN_B6', name: 'Витамин B6', unit: 'mcg', group: 'bioactive' },
    { id: 33, code: 'BIOTIN_B7', name: 'Биотин (B7)', unit: 'mcg', group: 'bioactive' },
    { id: 34, code: 'FOLATE_B9', name: 'Фолат (B9)', unit: 'mcg', group: 'bioactive' },
    { id: 35, code: 'VITAMIN_B12', name: 'Витамин B12', unit: 'mcg', group: 'bioactive' },
]

export const NUTRIENT_BY_ID = Object.fromEntries(
    NUTRIENTS.map((n) => [n.id, n]),
) as Record<number, NutrientDef>

export const CORE_GOAL_NUTRIENT_IDS = [1, 2, 3, 4] as const

export function unitLabel(unit: NutrientUnit): string {
    switch (unit) {
        case 'kcal':
            return 'ккал'
        case 'g':
            return 'г'
        case 'mg':
            return 'мг'
        case 'mcg':
            return 'мкг'
        case 'IU':
            return 'МЕ'
        default:
            return ''
    }
}

export function nutrientsByGroup(groupId: NutrientGroupId): NutrientDef[] {
    return NUTRIENTS.filter((n) => n.group === groupId)
}
