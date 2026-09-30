import {NavigateBackButton} from "@/components/ui/NavigateBackButton";


export function ChooseScenarioPage() {

    const handleGoalManual = () => {

    }

    const handleGoalAuto = () => {

    }

    const handleSkipGoal = () => {

    }


    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-start align-items-start
                            align-content-start
                            rounded-md-5
                            vh-100 overflow-y-auto">
                <div className="form-card-body
                                d-flex flex-column gap-4
                                bg-primary-color
                                rounded-3">
                    <div className="d-flex w-100
                                    flex-column gap-2
                                    align-items-start justify-content-center
                                    align-content-stretch
                                    flex-grow-0">
                        <div className="text-start">
                            <NavigateBackButton label="Назад" className="btn-tertiary"/>
                        </div>
                    </div>

                    <div className="d-flex
                                    flex-column
                                    align-items-center
                                    justify-content-center
                                    text-center">
                        <h3>Желаете задать цель?</h3>
                    </div>

                    <div className="d-flex gap-2 flex-column
                                        justify-content-center align-items-stretch">
                        <button className="btn btn-primary w-100"
                                onClick={handleGoalAuto}
                        >
                            Рассчитать цель
                        </button>

                        <button className="btn btn-primary w-100"
                                onClick={handleGoalManual}
                        >
                            Создать цель
                        </button>

                        <button className="btn btn-tertiary"
                                onClick={handleSkipGoal}>
                            Пропустить создание цели
                        </button>
                    </div>


                </div>
            </div>
        </div>
    )
}