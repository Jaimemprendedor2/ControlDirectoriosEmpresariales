import React from 'react';

interface TimeSelectorProps {
  duration: number; // duración en segundos
  onChange: (duration: number) => void;
  label?: string;
  className?: string;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  duration,
  onChange,
  label = "Tiempo",
  className = ""
}) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const handleMinutesChange = (newMinutes: number) => {
    const newDuration = (newMinutes * 60) + seconds;
    onChange(newDuration);
  };

  const handleSecondsChange = (newSeconds: number) => {
    const newDuration = (minutes * 60) + newSeconds;
    onChange(newDuration);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} *
      </label>
      <div className="flex space-x-2">
        {/* Minutos */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Minutos</label>
          <select
            value={minutes}
            onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {Array.from({ length: 121 }, (_, i) => i).map(num => (
              <option key={num} value={num}>
                {num.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Separador */}
        <div className="flex items-end pb-2">
          <span className="text-gray-500 font-mono text-lg">:</span>
        </div>

        {/* Segundos */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Segundos</label>
          <select
            value={seconds}
            onChange={(e) => handleSecondsChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {Array.from({ length: 60 }, (_, i) => i).map(num => (
              <option key={num} value={num}>
                {num.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
