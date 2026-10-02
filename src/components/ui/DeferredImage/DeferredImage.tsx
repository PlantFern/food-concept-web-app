import { useEffect, useState } from 'react'
import styles from './DeferredImage.module.css'

export type DeferredImageProps = {
    src?: string | null
    alt: string
    className?: string
    placeholder?: string
}

export function DeferredImage({
    src,
    alt,
    className = '',
    placeholder,
}: DeferredImageProps) {
    const [ready, setReady] = useState(false)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        setReady(false)
        setFailed(false)
        if (!src) return

        const id = window.setTimeout(() => setReady(true), 0)
        return () => window.clearTimeout(id)
    }, [src])

    if (!src || failed) {
        return (
            <div className={`${styles.placeholder} ${className}`} aria-hidden>
                {placeholder ?? alt.slice(0, 1).toUpperCase()}
            </div>
        )
    }

    if (!ready) {
        return <div className={`${styles.skeleton} ${className}`} aria-hidden />
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={`${styles.image} ${className}`}
            onError={() => setFailed(true)}
        />
    )
}
