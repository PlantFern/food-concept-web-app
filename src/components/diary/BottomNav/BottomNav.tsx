import { NavLink } from 'react-router-dom'
import {
    HiOutlineUserGroup,
    HiOutlineChartBar,
    HiOutlineUser,
    HiOutlineCog6Tooth,
} from 'react-icons/hi2'
import styles from './BottomNav.module.css'

const items = [
    { to: '/diary/relations', label: 'Связи', icon: HiOutlineUserGroup },
    { to: '/diary/stats', label: 'Статистика', icon: HiOutlineChartBar },
    { to: '/diary/profile', label: 'Профиль', icon: HiOutlineUser },
    { to: '/diary/settings', label: 'Настройки', icon: HiOutlineCog6Tooth },
] as const

export function BottomNav() {
    return (
        <nav className={styles.bottomNav} aria-label="Основное меню">
            {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `${styles.bottomNavItem} ${isActive ? styles.isActive : ''}`
                    }
                >
                    <Icon />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
