import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    HiOutlineInformationCircle,
    HiOutlineSun,
    HiOutlinePlus,
    HiOutlineArrowRightOnRectangle,
    HiOutlineClipboardDocumentList,
    HiOutlineUserGroup,
} from 'react-icons/hi2'
import { SpecialistBottomNav } from '@/components/specialist/SpecialistBottomNav'
import { logoutLocal } from '@/api/auth'
import {
    checkDiaryProfileExists,
    checkSpecialistExists,
    getMyUserProfile,
    type UserProfileDto,
} from '@/api/profiles'
import styles from '@/pages/diary/SettingsPage.module.css'

type RowProps = {
    icon: ReactNode
    label: string
    value?: string
    to?: string
    onClick?: () => void
}

function SettingsRow({ icon, label, value, to, onClick }: RowProps) {
    const content = (
        <>
            <span className={styles.rowIcon}>{icon}</span>
            <span className={styles.rowLabel}>{label}</span>
            {value && <span className={styles.rowValue}>{value}</span>}
            <span className={styles.rowChevron}>→</span>
        </>
    )
    if (to) {
        return (
            <Link to={to} className={styles.row}>
                {content}
            </Link>
        )
    }
    return (
        <button type="button" className={styles.row} onClick={onClick}>
            {content}
        </button>
    )
}

export function SpecialistSettingsPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserProfileDto | null>(null)
    const [hasDiary, setHasDiary] = useState(false)
    const [hasSpecialist, setHasSpecialist] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [u, diary, specialist] = await Promise.all([
                getMyUserProfile(),
                checkDiaryProfileExists(),
                checkSpecialistExists(),
            ])
            if (cancelled) return
            setUser(u)
            setHasDiary(diary)
            setHasSpecialist(specialist)
            setLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [])

    function onLogout() {
        logoutLocal()
        navigate('/login', { replace: true })
    }

    return (
        <div className="diary-shell">
            <div className={`diary-content ${styles.page}`}>
                <div className='bg-brand text-invert p-2 rounded-bottom-4'>
                    <h2 className="page-title text-center p-2 bg-text-on-brand">Профиль</h2>
                </div>

                <section className={styles.card}>
                    <div className={styles.avatar}>
                        {(user?.email ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <div className={styles.name}>
                            {user?.login || user?.email || (loading ? '…' : 'Пользователь')}
                        </div>
                        <div className={styles.email}>{user?.email ?? ''}</div>
                    </div>
                </section>

                <div className={styles.rolePills}>
                    {hasDiary ? (
                        <Link to="/diary" className={styles.pill}>
                            <HiOutlineClipboardDocumentList /> Дневник питания
                        </Link>
                    ) : (
                        <Link to="/onboarding/role" className={`${styles.pill} ${styles.pillMuted}`}>
                            <HiOutlinePlus /> Дневник питания
                        </Link>
                    )}
                    {hasSpecialist ? (
                        <Link
                            to="/specialist/clients"
                            className={`${styles.pill} ${styles.pillActive}`}
                        >
                            <HiOutlineUserGroup /> Специалист
                        </Link>
                    ) : (
                        <Link to="/onboarding/role" className={`${styles.pill} ${styles.pillMuted}`}>
                            <HiOutlinePlus /> Специалист
                        </Link>
                    )}
                </div>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Preferences</div>
                    <div className={styles.group}>
                        <SettingsRow icon={<HiOutlineInformationCircle />} label="About Us" />
                        <SettingsRow icon={<HiOutlineSun />} label="Theme" value="Light" />
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.group}>
                        <SettingsRow
                            icon={<HiOutlineArrowRightOnRectangle />}
                            label="Выйти"
                            onClick={onLogout}
                        />
                    </div>
                </section>
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
