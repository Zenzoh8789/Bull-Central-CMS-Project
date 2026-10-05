import {createContext} from 'react';
export const ItemSaveContext=createContext<null | (()=>Promise<void>)>(null);
