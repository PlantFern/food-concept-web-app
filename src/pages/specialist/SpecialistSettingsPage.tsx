import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    HiOutlineUserCircle,
    HiOutlineLockClosed,
    HiOutlineBell,
    HiOutlineLanguage,
    HiOutlineInformationCircle,
    HiOutlineSun,
    HiOutlineQuestionMarkCircle,
    HiOutlinePlus,
    HiOutlineClipboardDocumentList,
    HiOutlineArrowRightOnRectangle,
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
    icon: React.ReactNode
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
        let cancelled = false
        ;(async () => {
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
                <h1 className={styles.title}>Profile</h1>

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

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Роли</div>
                    <div className={styles.group}>
                        {hasDiary ? (
                            <SettingsRow
                                icon={<HiOutlineClipboardDocumentList />}
                                label="Дневник питания"
                                to="/diary"
                            />
                        ) : (
                            <SettingsRow
                                icon={<HiOutlinePlus />}
                                label="+ Дневник питания"
                                to="/onboarding/role"
                            />
                        )}
                        {hasSpecialist ? (
                            <SettingsRow
                                icon={<HiOutlineUserCircle />}
                                label="Аккаунт специалиста"
                                to="/specialist/clients"
                            />
                        ) : (
                            <SettingsRow
                                icon={<HiOutlinePlus />}
                                label="+ Специалист"
                                to="/onboarding/role"
                            />
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Account</div>
                    <div className={styles.group}>
                        <SettingsRow icon={<HiOutlineUserCircle />} label="Manage Profile" />
                        <SettingsRow icon={<HiOutlineLockClosed />} label="Password & Security" />
                        <SettingsRow icon={<HiOutlineBell />} label="Notifications" />
                        <SettingsRow
                            icon={<HiOutlineLanguage />}
                            label="Language"
                            value="Русский"
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Preferences</div>
                    <div className={styles.group}>
                        <SettingsRow icon={<HiOutlineInformationCircle />} label="About Us" />
                        <SettingsRow icon={<HiOutlineSun />} label="Theme" value="Light" />
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Support</div>
                    <div className={styles.group}>
                        <SettingsRow icon={<HiOutlineQuestionMarkCircle />} label="Help Center" />
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
