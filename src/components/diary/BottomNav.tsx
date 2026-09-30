import { NavLink } from 'react-router-dom'
import { HiOutlineUserGroup, HiOutlineChartBar, HiOutlineUser, HiOutlineCog6Tooth } from 'react-icons/hi2'

const items = [
    { to: '/diary/relations', label: 'Relations', icon: HiOutlineUserGroup },
    { to: '/diary/stats', label: 'Statistic', icon: HiOutlineChartBar },
    { to: '/diary/profile', label: 'Account', icon: HiOutlineUser },
    { to: '/diary/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
] as const

export function BottomNav() {
    return (
        <nav className="bottom-nav" aria-label="Основное меню">
            {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `bottom-nav-item ${isActive ? 'is-active' : ''}`
                    }
                >
                    <Icon />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
