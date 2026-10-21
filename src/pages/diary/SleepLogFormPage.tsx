import {useEffect, useState} from "react";
import {useForm}  from "react-hook-form";
import {Link, useParams, useNavigate} from 'react-router-dom';
import { IoTrashOutline } from 'react-icons/io5';
import { BottomNav } from '@/components/diary';
import {
    getSleepLogById,
    createSleepLog,
    updateSleepLog,
    deleteSleepLog,
    type SleepLogDto, type SleepPeriodPayload,
} from "@/api/diaryProfile";
import {useAlert} from "@/components/ui/Alert";
import { getErrorMessage } from '@/lib/errors'
import {getDiaryProfileId} from "@/api/onboarding.ts";


type SleepLogFormValues =  {
    beganAt: string;
    endedAt: string;
}

function toFormValues(dto: SleepLogDto): SleepLogFormValues {
    return {
        beganAt: dto.beganAt ?? '',
        endedAt: dto.endedAt ?? '',
    }
}

function toPayload(values: SleepLogFormValues): SleepPeriodPayload {
    return {
        startPeriod: values.beganAt,
        endPeriod: values.endedAt,
    }
}

export function SleepLogFormPage() {

    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    const {sleepLogId} = useParams();
    const isEdit = Boolean(sleepLogId);

    const [diaryProfileId, setDiaryProfileId] = useState<number>(-1);

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        trigger,
        formState: {errors, isSubmitting}
    } = useForm<SleepLogFormValues>(
        {
            mode: 'onTouched',
            defaultValues: {
                beganAt: "",
                endedAt: "",
            }
        }
    )

    useEffect(() => {
        setLoading(true);
        let cancelled = false;

        if (!isEdit) {
            const profileId = getDiaryProfileId();

            if(!profileId){
                showAlert("Не удалось определить профиль дневника", 'warning');
                navigate(-1);
                return;
            }

            setDiaryProfileId(profileId);
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await getSleepLogById(Number(sleepLogId));
                if (cancelled) return;
                if (!data) {
                    showAlert("Не удалось найти запись о сне", 'danger');
                    navigate(-1);
                    return;
                }
                reset(toFormValues(data));
            } catch (err: unknown) {
                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить'), 'danger');
                    navigate(-1);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        }
    }, [sleepLogId, isEdit, reset, navigate, showAlert])

    const onSubmit = async (formData: SleepLogFormValues) => {
        try {
            if (isEdit) {
                await updateSleepLog(Number(sleepLogId), toPayload(formData));
                showAlert('Данные обновлены', 'success');
            }
            else {
                await createSleepLog(diaryProfileId, toPayload(formData));
                showAlert('Запись о сне добавлена', 'success');
            }
            navigate('/diary', { replace: true });
        }
        catch (error: unknown) {
            if (error instanceof Error)
                setError(getErrorMessage(error));
        }
    }

    const onDelete = async () => {
        if (!isEdit) return
        if (!window.confirm('Удалить запись о сне?')) return
        setDeleting(true)
        setError('')
        try {
            await deleteSleepLog(Number(sleepLogId))
            showAlert('Запись удалена', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'))
        } finally {
            setDeleting(false)
        }
    }

    return(
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className='bg-brand text-invert
                            p-2
                            rounded-bottom-4'>
                <Link to="/diary" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Запись о сне</h2>
            </div>
            {
                loading && <p className="no-content-placeholder">Загрузка…</p>
            }

            <div className="container">
                <div className="">
                    { !loading &&
                        (
                        <form onSubmit={handleSubmit(onSubmit)}
                                className="form-card
                                            d-flex flex-column gap-3
                                            mx-auto">
                            {error && <p className="text-danger small mb-0">{error}</p>}
                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-3
                                                justify-content-between
                                                align-items-center align-items-stretch
                                                w-100">
                                    <label htmlFor="beganAt" className="label text-wrap align-self-center">Начало сна</label>
                                    <input
                                        className="input rounded-3"
                                        id="beganAt"
                                        type="datetime-local"
                                        {
                                        ...register(
                                            'beganAt',
                                            {
                                                required: 'Укажите время начала сна',
                                                onChange: () => {
                                                    if(getValues('endedAt'))
                                                        trigger('endedAt')
                                                }
                                            }
                                        )
                                        }
                                    />
                                </div>
                                {errors.beganAt && <span className="input-error-text">{errors.beganAt.message}</span>}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2
                                                justify-content-between
                                                align-items-center align-items-stretch
                                                w-100">
                                    <label htmlFor="endedAt" className="label text-wrap align-self-center">Окончание сна</label>
                                    <input
                                        className="input rounded-3"
                                        id="endedAt"
                                        type="datetime-local"
                                        {
                                            ...register(
                                                'endedAt',
                                                {
                                                    deps: ['beganAt'],
                                                    required: 'Укажите время окончания сна',
                                                    validate: (value, formValues) => {

                                                        if(!value || !formValues.beganAt) return true;

                                                        const beganAt = new Date(formValues.beganAt).getTime();
                                                        const endedAt = new Date(value).getTime();

                                                        if(isNaN(beganAt) || isNaN(endedAt)) return true;

                                                        return endedAt > beganAt || "Время окончания должно быть больше даты начала";
                                                    }
                                                }
                                            )
                                        }
                                    />
                                </div>
                                {errors.endedAt && <span className="input-error-text">{errors.endedAt.message}</span>}
                            </div>

                            <button type="submit"
                                    disabled={isSubmitting || deleting}
                                    className="btn btn-primary w-100 mt-2">
                                {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
                            </button>

                            {isEdit && (
                                <button
                                    type="button"
                                    disabled={isSubmitting || deleting}
                                    className="btn btn-outline-danger w-100 d-inline-flex align-items-center justify-content-center gap-2"
                                    onClick={() => void onDelete()}
                                    aria-label="Удалить"
                                    title="Удалить"
                                >
                                    <IoTrashOutline size={18} />
                                    {deleting ? "Удаление..." : null}
                                </button>
                            )}
                        </form>
                        )
                    }
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
