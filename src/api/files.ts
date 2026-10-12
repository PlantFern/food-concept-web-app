import { http } from '@/api/http'

export type FileUploadResponse = {
    id: number
    url: string
    originalName: string
    contentType: string
    size: number
}

export async function uploadFile(
    file: File,
    storageFolder: string,
): Promise<FileUploadResponse> {
    const form = new FormData()
    form.append('file', file)
    form.append('storage_folder', storageFolder)
    const { data } = await http.post<FileUploadResponse>('/api/files', form)
    return data
}

export async function getFilesMeta(ids: number[]): Promise<FileUploadResponse[]> {
    const { data } = await http.get<FileUploadResponse[]>('/api/files', {
        params: { ids },
    })
    return Array.isArray(data) ? data : []
}
