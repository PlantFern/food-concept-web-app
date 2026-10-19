import { Link } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
import { BottomNav } from '@/components/diary'

type Props = {
    title: string
    description: string
}

export function DiarySettingsStubPage({ title, description }: Props) {
    return (
        <div className="diary-shell">
            <div className="diary-content p-3">
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link
                        to="/diary/settings"
                        className="small text-decoration-none d-inline-flex align-items-center gap-1 bg-text-on-brand"
                    >
                        <HiChevronLeft size={18} /> Назад
                    </Link>
                    <h1 className="h5 mt-2 bg-text-on-brand">{title}</h1>
                    <p className="text-muted mb-0">{description}</p>
                </div>
            </div>
            <BottomNav />
        </div>
    )
}
