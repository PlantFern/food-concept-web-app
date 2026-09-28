import {NavigateBackButton} from "@/components/ui/NavigateBackButton";


export type ErrorPageProps = {
    code: 403 | 404 | 500;
    message?: string;
}

export function ErrorPage({
    code
}: ErrorPageProps) {

    const content = {
        403: { title: 'Доступ запрещен', text: 'У вас нет прав доступа для просмотра этой страницы' },
        404: { title: 'Страница не найдена', text: 'Возможна страница была удалена' },
        500: { title: 'Ошибка сервера', text: 'Попробуйте позже' }
    }[code]

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto
                        p-2">
            <div className="d-flex flex-column gap-2 p-4
                            align-items-center justify-content-center
                            text-center
                            rounded-5
                            shadow-lg">
                <h1 className="display-1 fw-bold">{code}</h1>
                <div className="d-flex flex-column gap-1
                                ">
                    <h2 className="h1">{content.title}</h2>
                    <p>
                        {content.text}
                    </p>
                </div >
                <div className="pt-1">
                    <NavigateBackButton label="Вернуться на прошлую" />
                </div>
            </div>
        </div>
    )
}