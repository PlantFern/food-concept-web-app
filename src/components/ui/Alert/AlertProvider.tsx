import React, {createContext, useCallback, useContext, useState} from 'react'
import Alert, {type AlertType} from './Alert';
// @ts-ignore
import styles from './Alert.module.css';


interface AlertItem {
    id: number;
    message: string;
    type: AlertType;
    duration: number;
}

interface AlertContextValue {
    showAlert: (message: string, type?: AlertType, duration?: number) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({children}: {children: React.ReactNode}) {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    const showAlert = useCallback<AlertContextValue['showAlert']>(
        (message, type='info', duration = 4000) => {
        const id = Date.now() + Math.random();

        setAlerts(prev => [...prev, {id, message, type, duration}]);
        },
        []
    );

    const remove = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id));


    return (
        <AlertContext.Provider value ={{showAlert}}>
            {children}
            <div className={styles.container}>
                {alerts.map(alert => (
                    <Alert
                    key={alert.id}
                    type={alert.type}
                    message={alert.message}
                    duration={alert.duration}
                    onClose={() => remove(alert.id)}
                    />
                ))}
            </div>
        </AlertContext.Provider>
    )
}

export function useAlert() {
    const ctx = useContext(AlertContext);
    if(!ctx) throw new Error('useAlert must be user within AlertProvider');
    return ctx;
}