import {useEffect, useState} from "react";
import {useForm}  from "react-hook-form";
import {Link, useParams, useNavigate} from 'react-router-dom';
import { BottomNav } from '@/components/diary';
import {
    getSleepLogById,
    createSleepLog,
    updateSleepLog,
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
                showAlert("Не удалось определить профиль дневника");
                navigate(-1);
                return;
            }

            setDiaryProfileId(profileId);
            setLoading(false);
        }
        else {
            (async () => {
                setLoading(true)
                const data = await getSleepLogById(Number(sleepLogId));
                if (!data) {
                    showAlert("Не удалось найти запись о сне");
                    navigate(-1);
                    return;
                }


                if (cancelled) return;
                else {
                    reset(toFormValues(data));
                    setLoading(false);
                }
            })()
        }

        return () => {
            cancelled = true;
        }
    }, [sleepLogId, isEdit, reset])

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
        }
        catch (error: unknown) {
            if (error instanceof Error)
                setError(getErrorMessage(error));
        }
    }

    return(
        <div className="diary-shell">
            <div className='bg-brand text-invert
                            p-2
                            rounded-bottom-4'>
                <Link to="/diary/settings" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Запись о сне</h2>
            </div>
            {
                loading && <p className="no-content-placeholder">Загрузка…</p>
            }

            <div className="container">
                <div className="row">
                    { !loading &&
                        (
                        <form onSubmit={handleSubmit(onSubmit)}
                                className="form-card col-xl-4 col-lg-6 col-md-8 col-sm-10 col-12
                                            d-flex flex-column gap-3
                                            ">
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
                                {errors.beganAt && <span className="error">{errors.beganAt.message}</span>}
                            </div>

                            <div className="d-flex gap-3
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
                                {errors.endedAt && <span className="error">{errors.endedAt.message}</span>}
                            </div>

                            <button type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary w-100 mt-2">
                                {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
                            </button>
                        </form>
                        )
                    }
                </div>
            </div>

            <BottomNav />
        </div>
    );
}