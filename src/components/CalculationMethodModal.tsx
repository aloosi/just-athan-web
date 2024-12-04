import React from "react";
import "../styles/CalculationMethodModal.css";

interface CalculationMethod {
  id: number;
  name: string;
  description: string;
}

interface CalculationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  methods: CalculationMethod[];
  selectedMethod: number;
  onMethodSelect: (methodId: number) => void;
}

const calculationMethods = [
  {
    id: 1,
    name: "Muslim World League",
    description:
      "Fajr: 18 degrees, Isha: 17 degrees, Region: Europe, The Far East, Parts of the USA",
  },
  {
    id: 2,
    name: "Egyptian General Authority of Survey",
    description:
      "Fajr: 19.5 degrees, Isha: 17.5 degrees, Region: Africa, Syria, Iraq, Lebanon, Malaysia, Parts of the USA",
  },
  {
    id: 3,
    name: "University Of Islamic Sciences, Karachi",
    description:
      "Fajr: 18 degrees, Isha: 18 degrees, Region: Pakistan, Bangladesh, India, Afghanistan, Parts of Europe",
  },
  {
    id: 4,
    name: "Umm Al-Qura",
    description:
      "Fajr: 18.5 Degrees (19 degrees before 1430 hijri), Isha: 90 minutes after the Sunset Prayer\n120 minutes (in Ramadan only), Region: The Arabian Peninsula",
  },
  {
    id: 5,
    name: "Islamic Society of North America",
    description:
      "Fajr: 15 degrees, Isha: 15 degrees, Region: Parts of the USA, Canada, Parts of the UK",
  },
  {
    id: 6,
    name: "Union des Organisations Islamiques de France",
    description: "Fajr: 12 degrees, Isha: 12 degrees, Region: France region",
  },
  {
    id: 7,
    name: "Majlis Ugama Islam Singapura",
    description: "Fajr: 20 degrees, Isha: 18 degrees, Region: Singapore region",
  },
];

const CalculationMethodModal: React.FC<CalculationMethodModalProps> = ({
  isOpen,
  onClose,
  methods = calculationMethods,
  selectedMethod,
  onMethodSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Calculation Method</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="calculation-methods-list">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`calculation-method-item ${method.id === selectedMethod ? "selected" : ""}`}
                onClick={() => onMethodSelect(method.id)}
              >
                <div className="method-name">{method.name}</div>
                <div className="method-description">{method.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationMethodModal;
