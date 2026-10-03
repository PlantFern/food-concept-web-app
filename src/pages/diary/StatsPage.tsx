import { BottomNav } from '@/components/diary'

export function StatsPage() {
    return (
        <div className="diary-shell">
            <div className="diary-content p-3">
                <div className='bg-brand text-invert p-2 rounded-bottom-4'>
                    <h2 className="page-title text-center p-2 bg-text-on-brand">Статистика</h2>
                </div>
                <p className="text-muted mb-0">Когда-нибудь, возможно, тут что-то будет. Пока нет</p>
            </div>
            <BottomNav />
        </div>
    )
}
