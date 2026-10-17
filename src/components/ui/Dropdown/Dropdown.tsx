import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Dropdown.module.css'

export type DropdownItem = { divider: true } | { divider?: false; label: string; to: string }

export interface DropdownTrigger {
    label: string
    icon?: ReactNode
}

export interface DropdownProps {
    trigger: DropdownTrigger
    items: DropdownItem[]
}

export default function Dropdown({ trigger, items }: DropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return

        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
        <div ref={ref} className={styles['dropdown']}>
            <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className={`${styles['dropdown-trigger']} btn btn-secondary`}
            >
                {trigger.icon && <span className="mb-1">{trigger.icon}</span>}
                {trigger.label && <span className="pe-2">{trigger.label}</span>}
            </button>

            {isOpen && (
                <ul role="menu" className={styles['dropdown-list']}>
                    {items.map((item, i) =>
                        item.divider ? (
                            <li key={i} className={styles.divider} />
                        ) : (
                            <li key={i} className={styles['dropdown-list-item']}>
                                <Link
                                    to={item.to}
                                    onClick={() => setIsOpen(false)}
                                    className={`${styles.link} btn-link btn-tertiary`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ),
                    )}
                </ul>
            )}
        </div>
    )
}
