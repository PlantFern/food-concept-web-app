import {logoutLocal} from "@/api/auth.ts";
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";

export function LogoutPage() {
    const navigate = useNavigate();

    useEffect(() => {
        logoutLocal()
        navigate('/login', {replace: true})
    }, [navigate]);

    return null;
}