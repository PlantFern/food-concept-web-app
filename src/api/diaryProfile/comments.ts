import { http } from '@/api/http'

export type CommentType = 'MEAL' | 'SLEEP_LOG' | 'WEIGHT_LOG'

export type DiaryCommentDto = {
    id: number
    diaryProfileId?: number
    commentableType: CommentType | string
    commentableId: number
    body: string
    createdAt?: string
}

export type CommentPayload = {
    commentableType: CommentType | string
    commentableId: number
    body: string
}

export async function createComment(
    diaryProfileId: number,
    payload: CommentPayload,
): Promise<DiaryCommentDto> {
    const { data } = await http.post<DiaryCommentDto>(
        `/api/diary-profile/comment/${diaryProfileId}`,
        null,
        { params: payload },
    )
    return data
}

export async function updateComment(
    commentId: number,
    payload: CommentPayload,
): Promise<DiaryCommentDto> {
    const { data } = await http.put<DiaryCommentDto>(
        `/api/diary-profile/comment/comments/${commentId}`,
        null,
        { params: payload },
    )
    return data
}

export async function deleteComment(commentId: number): Promise<void> {
    await http.delete(`/api/diary-profile/comment/comments/${commentId}`)
}

export async function getCommentById(commentId: number): Promise<DiaryCommentDto> {
    const { data } = await http.get<DiaryCommentDto>(
        `/api/diary-profile/comment/comments/${commentId}`,
    )
    return data
}
