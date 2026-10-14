import {useEffect, useState} from "react";
import {useForm}  from "react-hook-form";
import {Link, useParams, useNavigate} from 'react-router-dom';
import { BottomNav } from '@/components/diary';
import {
    fetchLatestWeight,
    createWeightLog,
    updateWeightLog,
} from '@/api/diaryProfile'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import {getDiaryProfileId} from "@/api/onboarding.ts";


type WeightLogFormValues =  {
    weight: string;
}


export function WeightLogFormPage() {

    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const {weightLogId} = useParams();
    const isEdit = Boolean(weightLogId);

    const [diaryProfileId, setDiaryProfileId] = useState<number>(-1);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<WeightLogFormValues>({
        mode: 'onTouched',
        defaultValues: {
            weight: '',
        },
    })

    useEffect(() => {

        let cancelled = false
        setLoading(true)
        setError('')

        if (!isEdit) {
            const profileId = getDiaryProfileId();

            if(!profileId){
                showAlert("Не удалось определить профиль дневника");
                navigate(-1);
                return;
            }
            setDiaryProfileId(profileId)
            setLoading(false)
            return
        }

        (async () => {
            try {
                const data = await getWeightLogById(Number(weightLogId))
                if (cancelled) return
                if (!data) {
                    showAlert('Не удалось найти запись о весе', 'danger')
                    navigate(-1)
                    return
                }
                reset({ weight: data.weight != null ? String(data.weight) : '' })
            } catch (err: unknown) {
                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить запись'), 'danger')
                    navigate(-1)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true;
        }
    }, [weightLogId, isEdit, reset, navigate, showAlert])

    const onSubmit = async (formData: WeightLogFormValues) => {
        setError('')
        const weight = Number(formData.weight)
        try {
            if (isEdit) {
                await updateWeightLog(Number(weightLogId), Number(formData.weight));
                showAlert('Данные обновлены', 'success');
            }
            else {
                await createWeightLog(diaryProfileId, Number(formData.weight));
                showAlert('Запись о весе добавлена', 'success');
            }
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить'))
        }
    }

    return(
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Запись о сне</h2>
            </div>
            {
                loading && <p className="no-content-placeholder">Загрузка…</p>
            }

            <div className="container">
                <div className="row">
                    {!loading && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="form-card col-xl-3 col-lg-4 col-md-6 col-sm-8 col-10
                                            d-flex flex-column gap-3 mx-auto"
                        >
                            {error && <p className="text-danger small mb-0">{error}</p>}

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="weight" className="label text-wrap align-self-center">
                                        Вес (кг)
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="weight"
                                        type="number"
                                        min={30}
                                        max={300}
                                        step="any"
                                        {...register('weight', {
                                            required: 'Укажите вес',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n)) return 'Введите число'
                                                if (n < 30 || n > 300) {
                                                    return 'Вес должен быть от 30 до 300 кг'
                                                }
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.weight && (
                                    <span className="input-error-text">{errors.weight.message}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary w-100 mt-2"
                            >
                                {isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}