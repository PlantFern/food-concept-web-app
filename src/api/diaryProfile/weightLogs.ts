import {http} from '@/api/http';
import type {WeightLogDto} from '@/api/diaryProfile/diary.ts';


export async function createWeightLog(
    diaryProfileId: number,
    weight: number
): Promise<WeightLogDto> {

    const {data} = await http.post<WeightLogDto>(
        `/api/diary-profile/weight-log/${diaryProfileId}`,
        null,
        {params: {weight}}
    );

    return data;
}

export async function updateWeightLog(
    weightLogId: number,
    weight: number
): Promise<WeightLogDto> {

    const {data} = await http.put<WeightLogDto>(
        `/api/diary-profile/weight-log/weight-logs/${weightLogId}`,
        null,
        { params: { weight } },
    )
    return data
}

export async function deleteWeightLog(weightLogId: number): Promise<void> {
    await http.delete(`/api/diary-profile/weight-log/weight-logs/${weightLogId}`)
}

export async function getWeightLogById(weightLogId: number): Promise<WeightLogDto> {
    const { data } = await http.get<WeightLogDto>(
        `/api/diary-profile/weight-log/weight-logs/${weightLogId}`,
    )
    return data
}

export async function fetchLatestWeight(
    diaryProfileId: number,
): Promise<WeightLogDto | null> {
    try {
        const {data} = await http.get<WeightLogDto>(
            `/api/diary-profile/weight-log/diary-profile/${diaryProfileId}/get-latest`,
        )
        return data
    } catch {
        return null
    }
}

export async function fetchWeightByPeriod(
    diaryProfileId: number,
    startPeriod: string,
    endPeriod: string,
): Promise<WeightLogDto[]> {

    const {data} = await http.get<WeightLogDto[]>(
        `/api/diary-profile/weight-log/diary-profile/${diaryProfileId}/get-by-period`,
        {params: {startPeriod, endPeriod}},
    )

export async function fetchAllWeights(diaryProfileId: number): Promise<WeightLogDto[]> {
    const { data } = await http.get<WeightLogDto[]>(
        `/api/diary-profile/weight-log/diary-profile/${diaryProfileId}/get-all`,
    )
    return Array.isArray(data) ? data : []
}
