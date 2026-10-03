import { NavLink } from 'react-router-dom'
import {
    HiOutlineChartBar,
    HiOutlineBookOpen,
    HiOutlineCog6Tooth,
} from 'react-icons/hi2'
import { GiAppleCore } from 'react-icons/gi'
import styles from './BottomNav.module.css'

const items = [
    { to: '/diary/stats', label: 'Статистика', icon: HiOutlineChartBar, end: false },
    { to: '/diary', label: 'Дневник', icon: HiOutlineBookOpen, end: true },
    { to: '/diary/products', label: 'Продукты', icon: GiAppleCore, end: false },
    { to: '/diary/settings', label: 'Настройки', icon: HiOutlineCog6Tooth, end: false },
] as const

export function BottomNav() {
    return (
        <nav className={styles.bottomNav} aria-label="Основное меню">
            {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
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
