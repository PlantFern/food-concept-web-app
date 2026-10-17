import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '@/components/diary';
import {
    initiateSpecialistRelation,
    searchSpecialists,
    type SpecialistSearchItemDto,
} from '@/api/specialist';
import { getDiaryProfileId } from '@/api/onboarding';
import { getMyUserProfile } from '@/api/profiles';
import { useAlert } from '@/components/ui/Alert';
import { getErrorMessage } from '@/lib/errors';

export function SpecialistSearchPage() {
    const { showAlert } = useAlert();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SpecialistSearchItemDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [searched, setSearched] = useState(false);
    const [relationType, setRelationType] = useState<'SPECIALIST' | 'OBSERVER'>('SPECIALIST');

    async function onSearch(e?: React.FormEvent) {
        e?.preventDefault();
        setLoading(true);
        setSearched(true);

        try {
            const me = await getMyUserProfile();
            const list = await searchSpecialists(query.trim());

            const filtered = list.filter((s) => {
                if (me == null) return true;
                return s.userId !== me.id;
            });

            setResults(filtered);
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось выполнить поиск'), 'danger');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    async function onInitiate(specialistId: number) {
        const profileId = getDiaryProfileId();

        if (profileId == null) {
            showAlert('Нет профиля дневника', 'warning');
            return;
        }

        setBusyId(specialistId);

        try {
            await initiateSpecialistRelation(profileId, specialistId, relationType);
            showAlert(`Заявка отправлена. Тип связи: ${relationType === 'SPECIALIST' ? 'Специалист' : 'Наблюдатель'}`, 'success');
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось отправить заявку'), 'danger');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/settings" className="btn-tertiary bg-text-on-brand text-decoration-none">
                    ← Назад
                </Link>
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Поиск специалиста</h2>
            </div>

            <div className="diary-content p-3 pb-5">
                <form onSubmit={(e) => void onSearch(e)} className="mb-3">
                    <label htmlFor="q" className="form-label">
                        Email или логин
                    </label>
                    <div className="d-flex gap-2">
                        <input
                            id="q"
                            className="form-control"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="например name@mail.com"
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '…' : 'Найти'}
                        </button>
                    </div>
                </form>

                <div className="mb-3">
                    <label htmlFor="relationType" className="form-label">Тип связи</label>
                    <select id="relationType" className="form-select" value={relationType} onChange={(e) => setRelationType(e.target.value as 'SPECIALIST' | 'OBSERVER')}>
                        <option value="SPECIALIST">Специалист — работа с дневником и целями</option>
                        <option value="OBSERVER">Наблюдатель — просмотр дневника</option>
                    </select>
                    <div className="form-text">Выбранный тип будет передан вместе с заявкой.</div>
                </div>

                {searched && !loading && results.length === 0 && (
                    <p className="text-muted mb-0">Ничего не найдено</p>
                )}

                {results.map((s) => (
                    <div key={s.id} className="card mb-2 shadow-sm border-0">
                        <div className="card-body d-flex justify-content-between align-items-center gap-2 py-3">
                            <div>
                                <div className="fw-semibold">
                                    {s.login || s.email || `Специалист #${s.id}`}
                                </div>
                                <div className="small text-muted">
                                    {s.email ?? ''}
                                    {s.isActive === false ? ' · неактивен' : ''}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={busyId === s.id || s.isActive === false}
                                onClick={() => void onInitiate(s.id)}
                            >
                                Связаться
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <BottomNav />
        </div>
    );
}
