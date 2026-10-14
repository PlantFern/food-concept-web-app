import {useEffect, useState} from "react";
import {useForm}  from "react-hook-form";
import {Link, useParams, useNavigate} from 'react-router-dom';
import { BottomNav } from '@/components/diary';
import {
    fetchLatestWeight,
    createWeightLog,
    updateWeightLog,
    type WeightLogDto, type SleepLogDto,
} from "@/api/diaryProfile";
import {useAlert} from "@/components/ui/Alert";
import { getErrorMessage } from '@/lib/errors'
import {getDiaryProfileId} from "@/api/onboarding.ts";


type WeightLogFormValues =  {
    weight: string;
}


export function WeightLogFormPage() {

    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const {weightLogId} = useParams();
    const isEdit = Boolean(weightLogId);

    const [diaryProfileId, setDiaryProfileId] = useState<number>(-1);

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isSubmitting}
    } = useForm<WeightLogFormValues>(
        {
            mode: 'onTouched',
            defaultValues: {
                weight: "60",
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
                const data = await fetchLatestWeight(Number(weightLogId));
                if (!data) {
                    showAlert("Не удалось найти запись о сне");
                    navigate(-1);
                    return;
                }


                if (cancelled) return;
                else {
                    reset({weight: data.weight.toString() ?? ''});
                    setLoading(false);
                }
            })()
        }

        return () => {
            cancelled = true;
        }
    }, [weightLogId, isEdit, reset])

    const onSubmit = async (formData: WeightLogFormValues) => {
        try {
            if (isEdit) {
                await updateWeightLog(Number(weightLogId), Number(formData.weight));
                showAlert('Данные обновлены', 'success');
            }
            else {
                await createWeightLog(diaryProfileId, Number(formData.weight));
                showAlert('Запись о весе добавлена', 'success');
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
                                  className="form-card col-xl-3 col-lg-4 col-md-6 col-sm-8 col-10
                                            d-flex flex-column gap-3
                                            mx-auto">

                                <div className="d-flex flex-column gap-1">
                                    <div className="d-flex gap-2
                                                justify-content-between
                                                align-items-center align-items-stretch
                                                w-100">
                                        <label htmlFor="endedAt" className="label text-wrap align-self-center">Окончание сна</label>
                                        <input
                                            className="input rounded-3"
                                            id="weight"
                                            type="number"
                                            min="30"
                                            max="300"
                                            {
                                                ...register(
                                                    'weight',
                                                    {
                                                        deps: ['weight'],
                                                        required: 'Укажите время окончания сна',
                                                        validate: (value) => {
                                                            return (Number(value) > 30 && Number(value) < 300) || "Вес должен быть больше 30 и меньше 300";
                                                        }
                                                    }
                                                )
                                            }
                                        />
                                    </div>
                                    {errors.weight && <span className="input-error-text">{errors.weight.message}</span>}
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