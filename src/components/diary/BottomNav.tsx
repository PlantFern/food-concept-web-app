import { NavLink } from 'react-router-dom'
import { HiHome, HiChartBar, HiUser } from 'react-icons/hi2'
import { IoAdd } from 'react-icons/io5'

export function BottomNav() {
    return (
        <nav className="bottom-nav" aria-label="Основное меню">
            <NavLink
                to="/diary"
                end
                className={({ isActive }) =>
                    `bottom-nav-item ${isActive ? 'is-active' : ''}`
                }
            >
                <HiHome />
                <span>Home</span>
            </NavLink>

            <NavLink
                to="/diary/stats"
                className={({ isActive }) =>
                    `bottom-nav-item ${isActive ? 'is-active' : ''}`
                }
            >
                <HiChartBar />
                <span>Stats</span>
            </NavLink>

            <button type="button" className="bottom-nav-fab" aria-label="Добавить приём">
                <IoAdd size={26} />
            </button>

            <NavLink
                to="/diary/profile"
                className={({ isActive }) =>
                    `bottom-nav-item ${isActive ? 'is-active' : ''}`
                }
            >
                <HiUser />
                <span>Profile</span>
            </NavLink>
        </nav>
    )
}
