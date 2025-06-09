// App.js
import React, { useContext } from 'react';
import { chatContext } from './Context/Context'; 
import AppRoutes from './Routes/Routes';

const App = () => {
  const { isRegistered, toggler } = useContext(chatContext);

  return (
    <div className="h-screen bg-zinc-950 bg-cover bg-center flex items-center justify-center overflow-hidden">
      <AppRoutes />
    </div>
  );
};

export default App;
