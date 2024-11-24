// PrayerTimes.js
import React, { useEffect, useState } from "react";

const PrayerTimes = () => {
  const [times, setTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const city = "Brampton"; // Replace with dynamic user input if needed
  const country = "CA"; // Replace with dynamic user input if needed
  const method = "4"; // Replace with dynamic user input if needed

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setTimes(data.data.timings); // Assuming the API returns the timings here
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [city, country]); // Dependencies array, you can add city and country here if you want to change them dynamically

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="PrayerTimes">
      <table>
        <tbody>
          {Object.entries(times).map(([prayerName, prayerTime]) => (
            <tr key={prayerName}>
              <td className="prayer-name">{prayerName}</td>
              <td className="prayer-time">{prayerTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrayerTimes;
