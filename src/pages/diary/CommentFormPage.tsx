import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { IoTrashOutline } from 'react-icons/io5';
import { BottomNav } from '@/components/diary';
import {
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
    type CommentType,
} from '@/api/diaryProfile';
import { useAlert } from '@/components/ui/Alert';
import { NavigateBackButton } from '@/components/ui/NavigateBackButton';
import { getErrorMessage } from '@/lib/errors';
import { getDiaryProfileId } from '@/api/onboarding.ts';


type CommentFormValues = {
    body: string
};

const TYPE_LABEL: Record<string, string> = {
    MEAL: 'Приём пищи',
    SLEEP_LOG: 'Лог сна',
    WEIGHT_LOG: 'Лог веса',
};


export function CommentFormPage() {
    
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { commentId } = useParams();
    const isEdit = Boolean(commentId);

    const commentableType = (searchParams.get('commentableType') ?? 'MEAL') as CommentType;
    const commentableIdRaw =
        searchParams.get('commentableId') ??
        searchParams.get('mealId') ??
        searchParams.get('sleepLogId') ??
        searchParams.get('weightLogId') ??
        '';
    const commentableId = Number(commentableIdRaw);

    const [diaryProfileId, setDiaryProfileId] = useState<number>(-1);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CommentFormValues>({
        mode: 'onTouched',
        defaultValues: { body: '' },
    });


    useEffect(() => {

        let cancelled = false;
        setLoading(true);
        setError('');

        if (!isEdit) {

            const profileId = getDiaryProfileId();

            if (!profileId) {
                showAlert('Не удалось определить профиль дневника', 'warning');
                navigate(-1);
                return;
            }
            if (!Number.isFinite(commentableId) || commentableId <= 0) {
                showAlert('Сначала создайте приём / лог, затем добавьте комментарий', 'warning');
                navigate(-1);
                return;
            }
            setDiaryProfileId(profileId);
            setLoading(false);
            return;
        }

        ;(async () => {

            try {

                const data = await getCommentById(Number(commentId));
                if (cancelled) return;
                if (!data) {
                    showAlert('Не удалось найти комментарий', 'danger');
                    navigate(-1);
                    return;
                }
                reset({ body: data.body ?? '' });
            } catch (err: unknown) {

                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить комментарий'), 'danger');
                    navigate(-1);
                }
            } finally {
                if (!cancelled) 
                    setLoading(false);
            }
        })()

        return () => {
            cancelled = true;
        }
    }, [commentId, isEdit, reset, navigate, showAlert, commentableId]);

    const onSubmit = async (formData: CommentFormValues) => {

        setError('');

        try {

            if (isEdit) {

                await updateComment(Number(commentId), {
                    commentableType,
                    commentableId,
                    body: formData.body.trim(),
                });
                showAlert('Данные обновлены', 'success');
            } else {

                await createComment(diaryProfileId, {
                    commentableType,
                    commentableId,
                    body: formData.body.trim(),
                });
                showAlert('Комментарий добавлен', 'success');
            }

            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, 'Не удалось сохранить')
            );
        }
    }

    const onDelete = async () => {

        if (!isEdit) 
            return;

        if (!window.confirm('Удалить комментарий?')) 
            return;

        setDeleting(true);
        setError('');
        
        try {

            await deleteComment(Number(commentId));
            showAlert('Комментарий удалён', 'success');
            navigate('/diary', { replace: true });
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'));
        } finally {
            setDeleting(false);
        }
    }


    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className='d-flex gap-3
                            justify-content-start align-items-center
                            bg-brand text-invert 
                            p-4 
                            rounded-bottom-4'>
                <NavigateBackButton label="Назад" className="btn-tertiary-invert" />

                <p className="page-title text-center p-2 bg-text-on-brand">Комментарий</p>
            </div>


            <div className="diary-content p-3" style={{ paddingBottom: '7.5rem' }}>
                {loading && <p className="no-content-placeholder">Загрузка…</p>}

                <div className='surface-card surface-card-column w-100'>
                    {!loading && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="form-layout mx-auto"
                        >
                            {error && <p className="text-danger small mb-0">{error}</p>}

                            {!isEdit && (
                                <p className="small text-muted mb-0">
                                    Для: {TYPE_LABEL[commentableType] ?? commentableType}
                                </p>
                            )}

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="body" className="label text-wrap align-self-center">
                                        Текст
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="body"
                                        type="text"
                                        {...register('body', {
                                            required: 'Укажите текст',
                                            validate: (v) => v.trim().length > 0 || 'Укажите текст',
                                        })}
                                    />
                                </div>
                                {errors.body && (
                                    <span className="input-error-text">{errors.body.message}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || deleting}
                                className="btn btn-primary w-100 mt-2"
                            >
                                {isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
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
                                    {deleting ? 'Удаление...' : null}
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
