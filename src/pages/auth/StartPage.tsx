import { Link } from 'react-router-dom'


export function StartPage(){

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-between
                            align-content-start
                            form-card
                            bg-secondary-color
                            rounded-md-5
                            vh-100 overflow-y-auto">
                <div className="d-flex flex-column flex-grow-1
                                justify-content-start align-items-start justify-content-start
                                mt-3">
                    <h2>Welcome to</h2>
                    <h1 className="fs-1 fw-bold h1">Food concept!</h1>
                </div>

                <div className="form-card-body
                                d-flex flex-column
                                align-items-stretch
                                justify-content-end
                                gap-4 flex-grow-1
                                bg-primary-color
                                rounded-3
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
    )
}