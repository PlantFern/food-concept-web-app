import { Link } from 'react-router-dom';


export function StartPage(){

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-between
                            align-content-start
                            form-card
                            bg-brand p-2
                            vh-100 overflow-y-auto">
                <div className="d-flex flex-column flex-grow-1
                                justify-content-start align-items-center justify-content-start
                                text-center
                                mt-3">
                    <h2>Добро пожаловать в</h2>
                    <h1 className="fs-1 fw-bold h1">Food concept!</h1>
                </div>

                <div className="surface-card surface-card-column
                                w-100 h-50
                                text-center">
                        <div className="d-flex">
                            <Link className="btn btn-primary w-100 shadow-sm" to="/register">
                                Зарегистрироваться
                            </Link>
                        </div>

                        <div>
                            Уже есть аккаунт?
                            <Link className="btn-link btn-tertiary ps-1" to="/login">
                                Войти
                            </Link>
                        </div>
                    </div>
            </div>
        </div>
    );
}
