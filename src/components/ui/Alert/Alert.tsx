import {useEffect, useState} from 'react';
// @ts-ignore
import styles from './Alert.module.css';

import {FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi'
import { MdOutlineDangerous, MdClose } from 'react-icons/md';


const ICONS = {
    info: FiInfo,
    danger: MdOutlineDangerous,
    warning: FiAlertTriangle,
    success: FiCheckCircle
}

export type AlertType = 'info'|'danger'|'warning'|'success'

interface AlertProps {
    type?: AlertType;
    message: string;
    duration?: number;
    onClose?: ()=>void;
}

export default function Alert({
    type = 'info',
    message,
    duration = 4000,
    onClose
}: AlertProps) {

    const [visible, setVisibile] = useState<Boolean>(true);
    const [leaving, setLeaving] = useState<Boolean>(false);

    const Icon = ICONS[type];

    useEffect(() => {

        const timer = setTimeout(() => handleClose(), duration);
        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setLeaving(true);
        setTimeout(() => {
            setVisibile(false);
            onClose?.();
        }, 300)
    }

    if(visible) return null;

    return(
        <div className={[styles.alert,
                         styles[type],
                         leaving ? styles.alertLeaving : '',]
                         .join(' ')}>
            <button className={styles.close}>
                <MdClose />
            </button>
            <div className='d-flex flex-row justifu-content-start align-items-center gap-4'>
                <div className={`flex-grow-0 ${styles.icon}`}>
                    <Icon size={20} />
                </div>
                <div className={`flex-grow-1 ${styles.message}`}>
                    {message}
                </div>
            </div>
        </div>
    )
}