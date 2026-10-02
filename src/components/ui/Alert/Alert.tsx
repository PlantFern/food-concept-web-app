import { useEffect, useState } from 'react'
import styles from './Alert.module.css'
import { FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi'
import { MdOutlineDangerous, MdClose } from 'react-icons/md'

const ICONS = {
    info: FiInfo,
    danger: MdOutlineDangerous,
    warning: FiAlertTriangle,
    success: FiCheckCircle,
}

export type AlertType = 'info' | 'danger' | 'warning' | 'success'

interface AlertProps {
    type?: AlertType
    message: string
    duration?: number
    onClose?: () => void
}

export default function Alert({
    type = 'info',
    message,
    duration = 4000,
    onClose,
}: AlertProps) {
    const [visible, setVisible] = useState(true)
    const [leaving, setLeaving] = useState(false)
    const Icon = ICONS[type]

    useEffect(() => {
        const timer = setTimeout(() => handleClose(), duration)
        return () => clearTimeout(timer)
    }, [duration])

    function handleClose() {
        setLeaving(true)
        setTimeout(() => {
            setVisible(false)
            onClose?.()
        }, 300)
    }

    if (!visible) return null

    return (
        <div
            className={[styles.alert, styles[type], leaving ? styles.leave : '']
                .filter(Boolean)
                .join(' ')}
            role="status"
        >
            <div className={`d-flex flex-row align-items-center gap-3 flex-grow-1`}>
                <div className={styles.icon}>
                    <Icon size={20} />
                </div>
                <div className={styles.message}>{message}</div>
            </div>
            <button type="button" className={styles.close} onClick={handleClose} aria-label="Закрыть">
                <MdClose />
            </button>
        </div>
    )
}
