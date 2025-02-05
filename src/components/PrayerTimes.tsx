import React, { useState, useEffect } from 'react';
import '../styles/PrayerTimes.css';
import { format } from 'date-fns';
import HijriConverter from 'hijri-converter';
import CalculationMethodModal from './CalculationMethodModal';
import { generateToken } from '../notifications/firebase';

interface PrayerTime {
  name: string;
  time: string;
}

interface PrayerData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
}

interface CalculationMethod {
  id: number;
  name: string;
  description: string;
}

const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 3, name: 'Muslim World League', description: 'Standard method used in Europe, Far East, and parts of the US' },
  { id: 5, name: 'Egyptian General Authority', description: 'Used in Africa, Syria, Iraq, Lebanon, Malaysia, and parts of the US' },
  { id: 1, name: 'University of Islamic Sciences, Karachi', description: 'Used in Pakistan, Bangladesh, India, Afghanistan, and parts of Europe' },
  { id: 4, name: 'Umm Al-Qura University, Makkah', description: 'Used in the Arabian Peninsula' },
  { id: 2, name: 'Islamic Society of North America', description: 'Used in North America' },
  { id: 12, name: 'Union Organization islamic de France', description: 'Used in France' },
  { id: 11, name: 'Majlis Ugama Islam Singapura', description: 'Used in Singapore' },
  { id: 0, name: 'Jafari / Shia Ithna-Ashari', description: 'Shia Ithna-Ashari method' }
];

const STORAGE_KEY = 'just-athan-calculation-method';

const PrayerTimes: React.FC = () => {

  useEffect(() => {
    generateToken();
  },[]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const [calculationMethod, setCalculationMethod] = useState<number>(() => {
    const savedMethod = localStorage.getItem(STORAGE_KEY);
    return savedMethod ? parseInt(savedMethod) : 2; // Default to ISNA if no saved preference
  });
  const [showCalculationModal, setShowCalculationModal] = useState<boolean>(false);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds < 0) return '0h 0m 0s';
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getHijriDate = (): string => {
    const today = new Date();
    const hijriDate = HijriConverter.toHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi Al-Awwal', 'Rabi Al-Thani',
      'Jumada Al-Awwal', 'Jumada Al-Akhira', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah'
    ];
    return `${hijriDate.hd} ${hijriMonths[hijriDate.hm - 1]}, ${hijriDate.hy}`;
  };

  const startCountdown = (nextPrayerDate: Date) => {
    // Clear existing interval if any
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const timeDiff = nextPrayerDate.getTime() - now.getTime();
      setTimeRemaining(formatTimeRemaining(timeDiff));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    setCountdownInterval(interval);
  };

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const date = new Date();
            const response = await fetch(
              `http://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${latitude}&longitude=${longitude}&method=${calculationMethod}`
            );
            const data = await response.json();
            
            if (data.code === 200) {
              setPrayerTimes({
                fajr: data.data.timings.Fajr,
                sunrise: data.data.timings.Sunrise,
                dhuhr: data.data.timings.Dhuhr,
                asr: data.data.timings.Asr,
                maghrib: data.data.timings.Maghrib,
                isha: data.data.timings.Isha,
                midnight: data.data.timings.Midnight
              });
            } else {
              setError('Failed to fetch prayer times');
            }
          });
        } else {
          setError('Geolocation is not supported by your browser');
        }
      } catch (error) {
        setError('Failed to fetch prayer times');
      }
    };

    fetchPrayerTimes();
    const interval = setInterval(fetchPrayerTimes, 1000 * 60 * 60); // Update every hour

    return () => {
      clearInterval(interval);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [calculationMethod]);

  useEffect(() => {
    const calculateNextPrayer = () => {
      if (!prayerTimes) return;

      const now = new Date();
      const prayers: PrayerTime[] = [
        { name: 'Fajr', time: prayerTimes.fajr },
        { name: 'Sunrise', time: prayerTimes.sunrise },
        { name: 'Dhuhr', time: prayerTimes.dhuhr },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isha', time: prayerTimes.isha },
      ];

      const prayerTimeObjects = prayers.map(prayer => {
        const [hours, minutes] = prayer.time.split(':');
        const prayerDate = new Date();
        prayerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return { ...prayer, date: prayerDate };
      });

      const nextPrayerObj = prayerTimeObjects.find(prayer => prayer.date > now) ||
        { ...prayerTimeObjects[0], date: new Date(prayerTimeObjects[0].date.getTime() + 24 * 60 * 60 * 1000) };

      setNextPrayer({ name: nextPrayerObj.name, time: format(nextPrayerObj.date, 'h:mm a') });
      startCountdown(nextPrayerObj.date);
    };

    calculateNextPrayer();
    const interval = setInterval(calculateNextPrayer, 60000);
    return () => {
      clearInterval(interval);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [prayerTimes]);

  // Save calculation method to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, calculationMethod.toString());
  }, [calculationMethod]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission === 'granted');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const handleMethodChange = (methodId: number) => {
    setCalculationMethod(methodId);
    setShowCalculationModal(false);
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="prayer-container">
      <div className="prayer-header">
        <h1>Prayer Times</h1>
        <div className="date">
          {format(new Date(), 'EEE, MMMM d, yyyy')}
          <br />
          {getHijriDate()}
        </div>
      </div>

      {nextPrayer && (
        <div className="next-prayer">
          <h2>Next Prayer</h2>
          <div className="next-prayer-details">
            <span className="prayer-name">{nextPrayer.name}</span>
            <span className="prayer-time">{nextPrayer.time}</span>
          </div>
          <div className="countdown">Time remaining: {timeRemaining}</div>
        </div>
      )}

      {prayerTimes && (
        <>
          <div className="calculation-method">
            <span>{CALCULATION_METHODS.find(m => m.id === calculationMethod)?.name}</span>
            <button onClick={() => setShowCalculationModal(true)}>Change</button>
            <button className="info-button" onClick={() => setShowCalculationModal(true)}>i</button>
          </div>
          <table className="prayer-times">
            <tbody>
              <tr><td>Fajr</td><td>{formatTime(prayerTimes.fajr)}</td></tr>
              <tr><td>Sunrise</td><td>{formatTime(prayerTimes.sunrise)}</td></tr>
              <tr><td>Dhuhr</td><td>{formatTime(prayerTimes.dhuhr)}</td></tr>
              <tr><td>Asr</td><td>{formatTime(prayerTimes.asr)}</td></tr>
              <tr><td>Maghrib</td><td>{formatTime(prayerTimes.maghrib)}</td></tr>
              <tr><td>Isha</td><td>{formatTime(prayerTimes.isha)}</td></tr>
              <tr><td>Midnight (Qiyam)</td><td>{formatTime(prayerTimes.midnight)}</td></tr>
            </tbody>
          </table>
        </>
      )}
{/**
      {!notificationPermission && (
        <button className="notification-button" onClick={requestNotificationPermission}>
          Enable Notifications
        </button>
      )}
 */}

      <CalculationMethodModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        methods={CALCULATION_METHODS}
        selectedMethod={calculationMethod}
        onMethodSelect={handleMethodChange}
      />
    </div>
  );
};

export default PrayerTimes;
