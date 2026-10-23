import {NavigateBackButton} from "@/components/ui/NavigateBackButton";
import {useNavigate} from "react-router-dom";


export function ChooseScenarioPage() {

    const navigate = useNavigate();

    type Scenario = 'auto' | 'manual' | 'skip';

    const SCENARIO_KEY = 'fd_onboarding_scenario';

    function saveScenario(scenario: Scenario) {
        sessionStorage.setItem(SCENARIO_KEY, scenario);
    }

    function goTo(scenario: Scenario) {
        saveScenario(scenario);
        navigate(`/onboarding/profile-setup?scenario=${scenario}`);
    }

    const handleGoalManual = () => {
        goTo('manual')
    }

    const handleGoalAuto = () => {
        goTo('auto')
    }

    const handleSkipGoal = () => {
        goTo('skip')
    }


    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4 
                            justify-content-start align-items-start 
                            bg-brand p-2
                            vh-100
                            overflow-y-auto">
                <div className="d-flex w-100 flex-column align-items-start flex-grow-0">
                    <NavigateBackButton label="Назад" className="btn-tertiary-invert" />
                </div>
                
                 <div className="surface-card surface-card-column w-100">
                    <div className="d-flex flex-column align-items-center text-center">
                        <p className="fs-3 fw-medium mb-0">Желаете задать цель?</p>
                    </div>

                    <div className="form-layout mx-auto">
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