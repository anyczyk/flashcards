import React, { useState, useEffect, useRef } from 'react';
import { showInterstitial } from '../../../services/admobService';
import { useTranslation } from "react-i18next";
import { setCookie, getCookie, removeCookie, hasCookie } from '../../../utils/cookies';
const numberCookieMinutes = 5;

const AdButton = ({ timerAccess, setTimerAccess }) => {
    const { t } = useTranslation();
    const [saveStartTime, setSaveStartTime] = useState(null);
    const intervalRef = useRef(null);
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    const handleClick = () => {
        const now = new Date();
        setSaveStartTime(now);
        showInterstitial(true);
        setCookie('oFlashoAdButtonCookie', now.toISOString(), (numberCookieMinutes+1));
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setTimerAccess(600);
    };

    useEffect(() => {
        if (hasCookie('oFlashoAdButtonCookie')) {
            const savedTime = getCookie('oFlashoAdButtonCookie');
            if (savedTime) {
                const savedDate = new Date(savedTime);
                setSaveStartTime(savedDate);
            }
        }
    }, []);

    useEffect(() => {
        if (saveStartTime) {
            const endTime = new Date(saveStartTime.getTime() + numberCookieMinutes * 60000);

            const updateTimer = () => {
                const now = new Date();
                const difference = Math.floor((endTime - now) / 1000);
                if (difference <= 0) {
                    clearInterval(intervalRef.current);
                    setTimerAccess(0);
                    removeCookie('oFlashoAdButtonCookie');
                } else {
                    setTimerAccess(difference);
                }
            };
            updateTimer();
            intervalRef.current = setInterval(updateTimer, 1000);
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [saveStartTime]);

    return (
        <button
            className="w-100 o-default-box"
            onClick={handleClick}
            disabled={timerAccess > 0}
        >
            {timerAccess > 0 ? `${t('thanks')}!` : t('show_ad')} {timerAccess > 0 && formatTime(timerAccess)}
        </button>
    );
};

export default AdButton;
