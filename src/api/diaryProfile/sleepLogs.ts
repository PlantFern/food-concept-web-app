import {http} from '@/api/http';
import type {SleepLogDto} from '@/api/diaryProfile/diary';


export type SleepPeriodPayload = {
    startPeriod: string
    endPeriod: string
}

export async function createSleepLog(
    diaryProfileId: number,
    payload: SleepPeriodPayload
): Promise<SleepLogDto> {

    const {data} = await http.post<SleepLogDto>(
        `/api/diary-profile/sleep-log/${diaryProfileId}`,
        null,
        {params: payload}
    );

    return data;
}

export async function updateSleepLog(
    sleepLogId: number,
    payload: SleepPeriodPayload
): Promise<SleepLogDto> {

    const {data} = await http.put<SleepLogDto>(
        `/api/diary-profile/sleep-log/${sleepLogId}`,
        null,
        {params: payload}
    );

    return data;
}

export async function deleteSleepLog(sleepLogId: number): Promise<void> {

    await http.delete(`/api/diary-profile/sleep-log/${sleepLogId}`);
}

export async function fetchSleepByDay(
    diaryProfileId: number,
    date: string
): Promise<SleepLogDto[]> {

    const {data} = await http.get<SleepLogDto[]>(
        `/api/diary-profile/sleep-log/diary-profile/${diaryProfileId}/${date}`,
    );

    return data;
}

export async function fetchSleepByPeriod(
    diaryProfileId: number,
    startPeriod: string,
    endPeriod: string
): Promise<SleepLogDto[]> {

    const {data} = await http.get<SleepLogDto[]>(
        `/api/diary-profile/sleep-log/diary-profile/${diaryProfileId}/for-a-period`,
        {params: {startPeriod, endPeriod}}
    );

    return data;
}