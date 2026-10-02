import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'

type Props = {
    title: string
    description: string
}

export function DiarySettingsStubPage({ title, description }: Props) {
    return (
        <div className="diary-shell">
            <div className="diary-content p-3">
                <Link to="/diary/settings" className="small text-decoration-none">
                    ← Назад
                </Link>
                <h1 className="h5 mt-2">{title}</h1>
                <p className="text-muted">{description}</p>
            </div>
            <BottomNav />
        </div>
    )
}
