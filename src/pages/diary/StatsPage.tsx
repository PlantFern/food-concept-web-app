import { BottomNav } from '@/components/diary'

export function StatsPage() {
    return (
        <div className="diary-shell">
            <div className="diary-content p-3">
                <h1 className="h5 mb-2">Статистика</h1>
                <p className="text-muted mb-0">Скоро здесь будут графики и отчёты.</p>
            </div>
            <BottomNav />
        </div>
    )
}
