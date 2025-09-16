import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir automáticamente al menú principal
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Redirigiendo...</h1>
        <p className="text-gray-600">Por favor espera mientras te redirigimos al menú principal.</p>
      </div>
    </div>
  );
};