import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '@/components/diary';
import {
    endRelationFromClient,
    fetchDiarySpecialistRelations,
    getMySpecialist,
    isActiveRelation,
    isPendingRelation,
    type UserRelationDto,
} from '@/api/specialist';
import { getDiaryProfileId } from '@/api/onboarding';
import { useAlert } from '@/components/ui/Alert';
import { getErrorMessage } from '@/lib/errors';

function RelationCard(props: {
    r: UserRelationDto;
    busyId: number | null;
    onEnd: (id: number) => void;
}) {
    const { r, busyId, onEnd } = props;

    return (
        <div className="card mb-2 shadow-sm border-0">
            <div className="card-body py-2 px-3">
                <div className="fw-semibold">Специалист #{r.specialistId}</div>
                <div className="small text-muted mb-2">
                    Тип: {r.relationType} · Статус: {r.relationStatusCode}
                </div>

                {isActiveRelation(r) && (
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => onEnd(r.id)}
                    >
                        Завершить
                    </button>
                )}

                {isPendingRelation(r) && (
                    <span className="small text-muted">Ожидает ответа специалиста</span>
                )}
            </div>
        </div>
    );
}

export function MySpecialistRelationsPage() {
    const { showAlert } = useAlert();

    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [relations, setRelations] = useState<UserRelationDto[]>([]);
    const [error, setError] = useState('');

    async function load() {
        const profileId = getDiaryProfileId();

        if (profileId == null) {
            setError('Нет профиля дневника');
            setRelations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const list = await fetchDiarySpecialistRelations(profileId);
            const mySpecialist = await getMySpecialist();

            const filtered = list.filter((r) => {
                if (mySpecialist == null) return true;
                return r.specialistId !== mySpecialist.id;
            });

            setRelations(filtered);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось загрузить связи'));
            setRelations([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    const pending = relations.filter(isPendingRelation);
    const active = relations.filter(isActiveRelation);
    const other = relations.filter((r) => !isPendingRelation(r) && !isActiveRelation(r));

    async function onEnd(relationId: number) {
        const profileId = getDiaryProfileId();

        if (profileId == null) return;
        if (!window.confirm('Завершить связь со специалистом?')) return;

        setBusyId(relationId);

        try {
            await endRelationFromClient(profileId, relationId);
            showAlert('Связь завершена', 'success');
            await load();
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось завершить'), 'danger');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/settings" className="btn-tertiary bg-text-on-brand text-decoration-none">
                    ← Настройки
                </Link>
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Мои специалисты</h2>
            </div>

            <div className="diary-content p-3 pb-5">
                <div className="mb-3 d-flex justify-content-end">
                    <Link to="/diary/specialists/search" className="btn btn-sm btn-primary">
                        Найти специалиста
                    </Link>
                </div>

                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && (
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <h6 className="mb-2 text-secondary">Ожидают ({pending.length})</h6>
                            {pending.length === 0 && (
                                <p className="text-muted small mb-0">Нет ожидающих заявок</p>
                            )}
                            {pending.map((r) => (
                                <RelationCard
                                    key={r.id}
                                    r={r}
                                    busyId={busyId}
                                    onEnd={(id) => void onEnd(id)}
                                />
                            ))}
                        </div>

                        <div className="col-12 col-md-6">
                            <h6 className="mb-2 text-secondary">Действующие ({active.length})</h6>
                            {active.length === 0 && (
                                <p className="text-muted small mb-0">Нет действующих связей</p>
                            )}
                            {active.map((r) => (
                                <RelationCard
                                    key={r.id}
                                    r={r}
                                    busyId={busyId}
                                    onEnd={(id) => void onEnd(id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && other.length > 0 && (
                    <div className="mt-3">
                        <h6 className="mb-2 text-secondary">Прочие ({other.length})</h6>
                        {other.map((r) => (
                            <div key={r.id} className="card mb-2 shadow-sm border-0">
                                <div className="card-body py-2 px-3">
                                    <div className="fw-semibold">Специалист #{r.specialistId}</div>
                                    <div className="small text-muted">
                                        Тип: {r.relationType} · Статус: {String(r.relationStatusCode)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
