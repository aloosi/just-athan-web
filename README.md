# Just-Athan Web 

A modern, responsive Islamic prayer times web application built with React and TypeScript. Get accurate prayer times based on your location with a beautiful, user-friendly interface.

## Features

- **Location-based Prayer Times**: Automatically fetches prayer times based on your current location
- **Dual Calendar System**: Displays both Gregorian and Hijri dates
- **Real-time Updates**: 
  - Live countdown to the next prayer
  - Precise timing with seconds display
  - Automatic date and prayer time updates
- **Prayer Notifications**: Optional browser notifications for prayer times
- **Multiple Calculation Methods**: 
  - Support for various prayer time calculation methods
  - Detailed information about each calculation method
  - Easy method switching
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/just-athan-web.git
cd just-athan-web
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Built With

- [React](https://reactjs.org/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [date-fns](https://date-fns.org/) - Date manipulation
- [hijri-converter](https://github.com/arabsight/hijri-converter) - Hijri date conversion
- [Aladhan API](https://aladhan.com/prayer-times-api) - Prayer times calculations

## Supported Calculation Methods

- Muslim World League
- Egyptian General Authority of Survey
- University of Islamic Sciences, Karachi
- Umm Al-Qura University, Makkah
- Islamic Society of North America (ISNA)
- Union des Organisations Islamiques de France
- Majlis Ugama Islam Singapura

## Features in Detail

### Prayer Times
- Fajr
- Sunrise
- Dhuhr
- Asr
- Maghrib
- Isha

### Time Display
- 12-hour format with AM/PM
- Countdown timer with hours, minutes, and seconds
- Next prayer highlighting

### Date Display
- Gregorian date in full format (e.g., "Mon, December 2, 2024")
- Hijri date with month names (e.g., "1 Jumada Al-Akhira, 1446")

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
