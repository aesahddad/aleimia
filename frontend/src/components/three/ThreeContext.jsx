import { createContext, useContext } from 'react';

export const ThreeContext = createContext(null);
export const useThreeScene = () => useContext(ThreeContext);
