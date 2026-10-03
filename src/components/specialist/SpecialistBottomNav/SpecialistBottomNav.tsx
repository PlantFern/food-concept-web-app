import { NavLink } from 'react-router-dom'
import { HiOutlineUserGroup, HiOutlineCog6Tooth } from 'react-icons/hi2'
import styles from './SpecialistBottomNav.module.css'

const items = [
    { to: '/specialist/clients', label: 'Клиенты', icon: HiOutlineUserGroup, end: false },
    { to: '/specialist/settings', label: 'Настройки', icon: HiOutlineCog6Tooth, end: false },
] as const

export function SpecialistBottomNav() {
    return (
        <nav className={styles.bottomNav} aria-label="Меню специалиста">
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
