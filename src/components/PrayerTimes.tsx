import React, { useState, useEffect } from 'react';
import '../styles/PrayerTimes.css';

interface PrayerTimesData {
  [key: string]: string;
}

interface NextPrayer {
  name: string;
  time: string;
}

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimesData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [countdown, setCountdown] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const prayerNames = {
    Fajr: "Fajr",
    Sunrise: "Sunrise",
    Dhuhr: "Dhuhr",
    Asr: "Asr",
    Maghrib: "Maghrib",
    Isha: "Isha"
  };

  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, ' ')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateNextPrayer = (prayerTimes: PrayerTimesData): NextPrayer => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Convert all prayer times to minutes and pair with their names
    const prayerTimesArray = Object.entries(prayerNames)
      .map(([key, name]) => ({
        name,
        minutes: timeToMinutes(prayerTimes[key])
      }))
      .sort((a, b) => a.minutes - b.minutes);

    // Find the next prayer
    const nextPrayer = prayerTimesArray.find(prayer => prayer.minutes > currentTime);

    // If no next prayer found, it means we're past Isha, so next prayer is tomorrow's Fajr
    if (!nextPrayer) {
      return {
        name: prayerTimesArray[0].name,
        time: prayerTimes[Object.keys(prayerNames)[0]]
      };
    }

    // Return the next prayer's details
    return {
      name: nextPrayer.name,
      time: prayerTimes[Object.entries(prayerNames).find(([_, name]) => name === nextPrayer.name)![0]]
    };
  };

  const updateCountdown = () => {
    if (!nextPrayer?.time) return;

    const now = new Date();
    const [prayerHours, prayerMinutes] = nextPrayer.time.split(':').map(Number);
    const prayerTime = new Date(now);
    prayerTime.setHours(prayerHours, prayerMinutes, 0);

    // If the prayer time is earlier than now, it means it's for tomorrow
    if (prayerTime < now) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    const diff = prayerTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setCountdown(`${hours}h ${minutes}m`);
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&method=2`
            );
            if (!response.ok) {
              throw new Error("Failed to fetch prayer times");
            }
            const data = await response.json();
            setTimes(data.data.timings);
            setDate(new Date(data.data.date.readable));
            const next = calculateNextPrayer(data.data.timings);
            setNextPrayer(next);
          } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError("Error getting location. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      updateCountdown();
    }, 1000); // Update every second instead of every minute

    return () => clearInterval(timer);
  }, [nextPrayer]);

  if (loading) {
    return <div className="prayer-container">Loading prayer times...</div>;
  }

  if (error) {
    return <div className="prayer-container error">{error}</div>;
  }

  return (
    <div className="prayer-container">
      <div className="prayer-header">
        <h1>Prayer Times</h1>
        <div className="date">{date.toLocaleDateString()}</div>
      </div>

      {nextPrayer && (
        <div className="next-prayer">
          <h2>Next Prayer</h2>
          <div className="next-prayer-details">
            <span className="prayer-name">{nextPrayer.name}</span>
            <span className="prayer-time">{convertTo12Hour(nextPrayer.time)}</span>
          </div>
          <div className="countdown">Time remaining: {countdown}</div>
        </div>
      )}

      <table className="prayer-times">
        <tbody>
          {Object.entries(prayerNames).map(([key, name]) => (
            <tr
              key={key}
              className={nextPrayer?.name === name ? "next-prayer-row" : ""}
            >
              <td>{name}</td>
              <td>{convertTo12Hour(times[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!notificationsEnabled && (
        <button
          className="notification-button"
          onClick={requestNotificationPermission}
        >
          Enable Notifications
        </button>
      )}
    </div>
  );
};

export default PrayerTimes;
