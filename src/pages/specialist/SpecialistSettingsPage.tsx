import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
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
        logoutLocal();
        navigate('/login', { replace: true });
    }


    return (
        <div className="diary-shell
                        col-lg-4 col-md-8 col-sm-10 col-12
                        m-auto">
            <header className="bg-brand 
                                p-4 pt-2 mb-4
                                rounded-bottom-5">
                <div className="stats-header 
                                d-flex g-2 flex-column
                                justify-content-center justify-item-stretch
                                item-align-center
                                w-100">
                    <h2 className={styles.title}>Профиль специалиста</h2>

                    <section className="card
                                        d-flex gap-3 flex-row
                                        justify-content-start justify-items-center
                                        align-item-center
                                        rounded-3">
                        <div className={styles.avatar}>
                            {(user?.email ?? '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <div className={styles.name}>
                                {loading ? '…' : (user?.email ?? 'User')}
                            </div>
                            <div className={styles.email}>
                                {hasDiary && hasSpecialist
                                    ? 'Дневник · Специалист'
                                    : hasDiary
                                    ? 'Дневник'
                                    : hasSpecialist
                                        ? 'Специалист'
                                        : 'Профиль'}
                            </div>
                        </div>
                    </section>
                </div>
            </header>
            <div className='diary-content
                            d-flex gap-3 flex-column
                            justify-content-start justify-itens-stretch
                            aling-items-stretch'>

                <div className='d-flex gap-2 flex-column
                                justify-content-center justify-items-center
                                aling-items-center w-100 mx-auto'>
                    {hasDiary ? (
                        <Link to="/diary" 
                        className={`btn btn-primary rounded-pill btn-icon-start fit-content mx-auto`}>
                            <span><HiOutlineClipboardDocumentList size="20"/> </span>
                            <span>Дневник питания</span>
                        </Link>
                    ) : (
                        <Link to="/onboarding/scenario" 
                        className={`btn btn-secondary rounded-pill btn-icon-start fit-content mx-auto`}>
                            <span><HiOutlinePlus size="20"/> </span>
                            <span>Дневник питания</span>
                        </Link>
                    )}
                    {hasSpecialist ? (
                        <Link to="/specialist/clients" 
                                className={`btn btn-primary rounded-pill btn-icon-start fit-content mx-auto`}>
                            <span><HiOutlineUserGroup size="20"/> </span>
                            <span>Специалист</span>
                        </Link>
                    ) : (
                        <Link to="/onboarding/role" 
                                className={`btn btn-secondary rounded-pill btn-icon-start fit-content mx-auto`}>
                            <span><HiOutlinePlus size="20"/> </span>
                            <span>Специалист</span>
                        </Link>
                    )}
                </div>

                <section>
                    <div className={styles.group}>
                        <button onClick={onLogout}  className={`btn btn-start btn-tertiary btn-icon-start
                                                                            ${styles["group-btn"]}`}>
                            <span><HiOutlineArrowRightOnRectangle size="20" /></span>
                            <span>Выход</span>
                        </button>
                    </div>
                </section>
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
