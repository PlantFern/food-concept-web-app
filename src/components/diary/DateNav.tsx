import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import { MdOutlineCalendarMonth } from 'react-icons/md'

type DateNavProps = {
    date: Date
    onPrev: () => void
    onNext: () => void
}

function formatDate(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
}

export function DateNav({ date, onPrev, onNext }: DateNavProps) {
    return (
        <div className="date-nav">
            <button type="button" className="date-nav-btn" onClick={onPrev} aria-label="Предыдущий день">
                <HiChevronLeft size={18} />
            </button>
            <div className="date-nav-center">
                <MdOutlineCalendarMonth size={18} />
                <span>{formatDate(date)}</span>
            </div>
            <button type="button" className="date-nav-btn" onClick={onNext} aria-label="Следующий день">
                <HiChevronRight size={18} />
            </button>
        </div>
    )
}
