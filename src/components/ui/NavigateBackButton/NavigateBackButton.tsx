import {FaRegArrowAltCircleLeft} from "react-icons/fa";
import {useNavigate} from "react-router-dom";
// @ts-ignore
import styles from './NavigateBackButton.module.css'


export type NavigateBackButtonProps = {
    label?: string;
    className?: string;
};

export function NavigateBackButton({
    label,
    className
} : NavigateBackButtonProps) {

    const navigate = useNavigate();

    return (
        <button onClick={() => navigate(-1) }
                className={`${styles.backButton} ${className} btn-link btn-sm btn-tertiary`}
        >
            <FaRegArrowAltCircleLeft className={styles.icon} />
            <span>{label}</span>
        </button>
    );
}