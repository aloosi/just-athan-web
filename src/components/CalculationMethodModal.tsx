import React from 'react';
import '../styles/CalculationMethodModal.css';

interface CalculationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const calculationMethods = [
  {
    organization: 'Muslim World League',
    fajr: '18 degrees',
    isha: '17 degrees',
    region: 'Europe, The Far East, Parts of the USA'
  },
  {
    organization: 'Egyptian General Authority of Survey',
    fajr: '19.5 degrees',
    isha: '17.5 degrees',
    region: 'Africa, Syria, Iraq, Lebanon, Malaysia, Parts of the USA'
  },
  {
    organization: 'University Of Islamic Sciences, Karachi',
    fajr: '18 degrees',
    isha: '18 degrees',
    region: 'Pakistan, Bangladesh, India, Afghanistan, Parts of Europe'
  },
  {
    organization: 'Umm Al-Qura',
    fajr: '18.5 Degrees (19 degrees before 1430 hijri)',
    isha: '90 minutes after the Sunset Prayer\n120 minutes (in Ramadan only)',
    region: 'The Arabian Peninsula'
  },
  {
    organization: 'Islamic Society of North America',
    fajr: '15 degrees',
    isha: '15 degrees',
    region: 'Parts of the USA, Canada, Parts of the UK'
  },
  {
    organization: 'Union des Organisations Islamiques de France',
    fajr: '12 degrees',
    isha: '12 degrees',
    region: 'France region'
  },
  {
    organization: 'Majlis Ugama Islam Singapura',
    fajr: '20 degrees',
    isha: '18 degrees',
    region: 'Singapore region'
  }
];

const CalculationMethodModal: React.FC<CalculationMethodModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Calculation Method</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <table className="calculation-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Angle of the sun under the horizon (Fajr)</th>
                <th>Angle of the sun under the horizon (Isha)</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {calculationMethods.map((method, index) => (
                <tr key={index}>
                  <td>{method.organization}</td>
                  <td>{method.fajr}</td>
                  <td>{method.isha}</td>
                  <td>{method.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalculationMethodModal;
