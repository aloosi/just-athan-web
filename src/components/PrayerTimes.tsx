import React, { useState, useEffect, useRef } from 'react';
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
const LOCATION_CACHE_KEY = 'just-athan-location-cache';
const ATHAN_ENABLED_KEY = 'just-athan-athan-enabled';
/** Location lat/lng + label is refreshed via geolocation after this TTL (24h). Prayer times still update hourly via API while cache is fresh. */
const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ATHAN_URL = 'https://media.blubrry.com/muslim_central_adhan/content.blubrry.com/muslim_central_adhan/Adhan_Makkah.mp3';

interface LocationCacheEntry {
  lat: number;
  lng: number;
  locationName: string;
  savedAt: number;
}

function readLocationCache(): LocationCacheEntry | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as LocationCacheEntry;
    if (
      typeof p.lat !== 'number' ||
      typeof p.lng !== 'number' ||
      typeof p.locationName !== 'string' ||
      typeof p.savedAt !== 'number'
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function isLocationCacheFresh(entry: LocationCacheEntry): boolean {
  return Date.now() - entry.savedAt < LOCATION_CACHE_TTL_MS;
}

function writeLocationCache(lat: number, lng: number, locationName: string): void {
  const entry: LocationCacheEntry = {
    lat,
    lng,
    locationName,
    savedAt: Date.now(),
  };
  localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(entry));
}

function readAthanEnabled(): boolean {
  return localStorage.getItem(ATHAN_ENABLED_KEY) === 'true';
}

const PrayerTimes: React.FC = () => {
  useEffect(() => {
    generateToken();
  }, []);

  const [prayerTimes, setPrayerTimes] = useState<PrayerData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string>(() => {
    const cached = readLocationCache();
    if (cached && isLocationCacheFresh(cached)) return cached.locationName;
    return 'Detecting location...';
  });
  const [calculationMethod, setCalculationMethod] = useState<number>(() => {
    const savedMethod = localStorage.getItem(STORAGE_KEY);
    return savedMethod ? parseInt(savedMethod) : 2; // Default to ISNA
  });
  const [showCalculationModal, setShowCalculationModal] = useState<boolean>(false);
  const [isAthanEnabled, setIsAthanEnabled] = useState<boolean>(() => readAthanEnabled());
  
  const countdownIntervalParams = useRef<{ intervalId: NodeJS.Timeout | null, nextPrayerDate: Date | null }>({ intervalId: null, nextPrayerDate: null });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<string>('');

  useEffect(() => {
    audioRef.current = new Audio(ATHAN_URL);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
    if (countdownIntervalParams.current.intervalId) {
      clearInterval(countdownIntervalParams.current.intervalId);
    }
    countdownIntervalParams.current.nextPrayerDate = nextPrayerDate;

    const updateTimeRemaining = () => {
      const now = new Date();
      const timeDiff = nextPrayerDate.getTime() - now.getTime();
      setTimeRemaining(formatTimeRemaining(timeDiff));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    countdownIntervalParams.current.intervalId = interval;
  };

  useEffect(() => {
    const cleanTime = (timeStr: string) => timeStr.split(' ')[0];

    const applyTimings = (timings: Record<string, string>) => {
      setPrayerTimes({
        fajr: cleanTime(timings.Fajr),
        sunrise: cleanTime(timings.Sunrise),
        dhuhr: cleanTime(timings.Dhuhr),
        asr: cleanTime(timings.Asr),
        maghrib: cleanTime(timings.Maghrib),
        isha: cleanTime(timings.Isha),
        midnight: cleanTime(timings.Midnight),
      });
    };

    const fetchPrayerTimesForCoords = async (
      latitude: number,
      longitude: number,
      method: number
    ): Promise<boolean> => {
      try {
        const date = new Date();
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${method}`
        );
        const data = await response.json();
        if (data.code === 200) {
          applyTimings(data.data.timings);
          return true;
        }
        setError('Failed to fetch prayer times from Aladhan API');
        return false;
      } catch {
        setError('Network error: Could not load data');
        return false;
      }
    };

    const fetchLocationAndPrayers = async () => {
      setLoading(true);
      setError('');
      try {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          setLoading(false);
          return;
        }

        const cached = readLocationCache();
        if (cached && isLocationCacheFresh(cached)) {
          setLocationName(cached.locationName);
          await fetchPrayerTimesForCoords(cached.lat, cached.lng, calculationMethod);
          setLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              let city = 'Your Location';
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                city =
                  geoData.address.city ||
                  geoData.address.town ||
                  geoData.address.village ||
                  geoData.address.county ||
                  'Your Location';
              }
              setLocationName(city);

              const ok = await fetchPrayerTimesForCoords(latitude, longitude, calculationMethod);
              if (ok) {
                writeLocationCache(latitude, longitude, city);
              }
            } catch {
              setError('Network error: Could not load data');
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            console.error(err);
            setError('Location access denied. Please enable location services.');
            setLoading(false);
          }
        );
      } catch {
        setError('An unexpected error occurred.');
        setLoading(false);
      }
    };

    fetchLocationAndPrayers();
    const intervalId = setInterval(fetchLocationAndPrayers, 1000 * 60 * 60); // Hourly prayer refresh; location re-fetched after cache TTL

    return () => clearInterval(intervalId);
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

      const formattedTime = format(nextPrayerObj.date, 'h:mm a');
      setNextPrayer({ name: nextPrayerObj.name, time: formattedTime });
      startCountdown(nextPrayerObj.date);

      // Check current time against prayers for strictly matching minute (play athan)
      const audio = audioRef.current;
      if (isAthanEnabled && audio) {
        const currentMs = now.getTime();
        prayers.forEach(p => {
          if (p.name === 'Sunrise') return; // no athan at sunrise
          const pObj = prayerTimeObjects.find(po => po.name === p.name);
          if (pObj && pObj.name !== lastPlayedRef.current) {
            // If current time is past prayer time by less than 1 min
            if (currentMs >= pObj.date.getTime() && currentMs < pObj.date.getTime() + 60000) {
              lastPlayedRef.current = pObj.name;
              audio.play().catch(e => console.log('Audio play blocked:', e));
            }
          }
        });
      }
    };

    calculateNextPrayer();
    const interval = setInterval(calculateNextPrayer, 1000); // Check every second for exact countdown & audio
    return () => {
      clearInterval(interval);
      if (countdownIntervalParams.current.intervalId) {
        clearInterval(countdownIntervalParams.current.intervalId);
      }
    };
  }, [prayerTimes, isAthanEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, calculationMethod.toString());
  }, [calculationMethod]);

  useEffect(() => {
    localStorage.setItem(ATHAN_ENABLED_KEY, String(isAthanEnabled));
  }, [isAthanEnabled]);

  const toggleAthan = () => {
    setIsAthanEnabled((prev) => !prev);
    if (!isAthanEnabled && audioRef.current) {
      // Play a short empty sound or load it to unlock audio context in browsers
      audioRef.current.load();
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

  const isCurrentNextPrayer = (name: string) => {
    return nextPrayer?.name === name;
  };

  return (
    <div className="prayer-container">
      <div className="prayer-header">
        <div className="header-top">
          <div className="location">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>{locationName}</span>
          </div>
          <button className={`athan-toggle ${isAthanEnabled ? 'active' : ''}`} onClick={toggleAthan} title="Toggle Athan Audio">
            {isAthanEnabled ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            )}
          </button>
        </div>
        <h1>Prayer Times</h1>
        <div className="date">
          <span className="gregorian">{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
          <span className="hijri">{getHijriDate()}</span>
        </div>
      </div>

      {loading && !prayerTimes ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding accurate timings for your location...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {nextPrayer && (
            <div className="next-prayer-card">
              <div className="next-prayer-info">
                <h2>Next Prayer: <span className="highlight-text">{nextPrayer.name}</span></h2>
                <div className="countdown-timer">{timeRemaining}</div>
              </div>
              <div className="next-prayer-time">{nextPrayer.time}</div>
            </div>
          )}

          <div className="times-container">
            <div className="method-selector">
              <span>{CALCULATION_METHODS.find(m => m.id === calculationMethod)?.name}</span>
              <button onClick={() => setShowCalculationModal(true)}>Change</button>
            </div>

            {prayerTimes && (
              <div className="times-list">
                {[
                  { name: 'Fajr', time: prayerTimes.fajr },
                  { name: 'Sunrise', time: prayerTimes.sunrise },
                  { name: 'Dhuhr', time: prayerTimes.dhuhr },
                  { name: 'Asr', time: prayerTimes.asr },
                  { name: 'Maghrib', time: prayerTimes.maghrib },
                  { name: 'Isha', time: prayerTimes.isha },
                ].map((prayer) => (
                  <div key={prayer.name} className={`prayer-row ${isCurrentNextPrayer(prayer.name) ? 'active-prayer' : ''}`}>
                    <span className="prayer-name">{prayer.name}</span>
                    <span className="prayer-time">{formatTime(prayer.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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
