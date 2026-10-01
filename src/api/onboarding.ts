import { http } from '@/api/http'

export type ProfileDataPayload = {
    height: number | null
    birthDate: string | null
    genderId: number | null
}

export type ActivityLevel =
    | 'SEDENTARY'
    | 'LIGHT'
    | 'MODERATE'
    | 'HIGH'
    | 'VERY_HIGH'

export type GoalType = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT'

export type ExtendedProfilePayload = {
    height: number
    birthDate: string
    genderId: number
    weight: number
    plannedWeight: number
    activityLevel: ActivityLevel
    goalType: GoalType
}

export type ProfileWithGoalPayload = {
    height: number | null
    birthDate: string | null
    genderId: number | null
    weight: number | null
    plannedWeight: number | null
    plannedEndDate: string | null
    goalNutrientMap: Record<number, number>
}

export type DiaryProfileDto = {
    id: number
    userId: number
    height: number | null
    birthDate: string | null
    genderCode: string | null
}

const DIARY_PROFILE_ID_KEY = 'fd_diary_profile_id'
const ONBOARDING_PROFILE_KEY = 'fd_onboarding_profile'

export const NUTRIENT_IDS = {

    kcal: 1,
    protein: 2,
    fat: 3,
    carbs: 4,
} as const

export type StoredOnboardingProfile = {

    height: number | null
    birthDate: string | null
    genderId: number | null
}

export function saveOnboardingProfile(p: StoredOnboardingProfile) {

    sessionStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(p));
}

export function readOnboardingProfile(): StoredOnboardingProfile | null {

    try {
        const raw = sessionStorage.getItem(ONBOARDING_PROFILE_KEY);
        return raw ? (JSON.parse(raw) as StoredOnboardingProfile) : null;
    } catch {
        return null;
    }
}

export function clearOnboardingProfile() {

    sessionStorage.removeItem(ONBOARDING_PROFILE_KEY);
}

export function saveDiaryProfileId(id: number) {

    if (!Number.isFinite(id) || id <= 0) return
    localStorage.setItem(DIARY_PROFILE_ID_KEY, String(id));
}

export function getDiaryProfileId(): number | null {

    const raw = localStorage.getItem(DIARY_PROFILE_ID_KEY);

    if (!raw) {
        return null;
    }
    const n = Number(raw);

    if (!Number.isFinite(n) || n <= 0)
        return null;

    return n;
}

export function persistProfileId(dto?: DiaryProfileDto | null) {
    if (dto?.id != null && dto.id > 0) saveDiaryProfileId(dto.id);
}

export async function createDiaryOnly(payload: ProfileDataPayload): Promise<DiaryProfileDto> {
    const { data } = await http.post<DiaryProfileDto>(
        '/api/diary-profile/onboarding',
        payload,
    )
    persistProfileId(data);
    clearOnboardingProfile();
    return data;
}

export async function createDiaryWithCalculatedGoal(
    payload: ExtendedProfilePayload,
): Promise<DiaryProfileDto> {
    const { data } = await http.post<DiaryProfileDto>(
        '/api/diary-profile/onboarding/create-and-calculate-goal',
        payload,
    )
    persistProfileId(data);
    clearOnboardingProfile();
    return data;
}

export async function createDiaryWithGoal(
    payload: ProfileWithGoalPayload,
): Promise<DiaryProfileDto> {
    const { data } = await http.post<DiaryProfileDto>(
        '/api/diary-profile/onboarding/create-with-goal',
        payload,
    )
    persistProfileId(data);
    clearOnboardingProfile();
    return data;
}

export async function createSpecialist(): Promise<void> {
    await http.put('/api/specialist/specialists/');
}
