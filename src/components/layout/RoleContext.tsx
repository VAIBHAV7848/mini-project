'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';

export const PERSONAS = {
  CLIENT: { id: '9d640d0c-137c-47dd-a118-084d7e2ec807', name: 'Alice Client', email: 'client1@escrow.local' },
  FREELANCER: { id: 'a7a09030-f1c7-4d58-82db-e7a556871fc4', name: 'Charlie Developer', email: 'dev1@escrow.local' },
  REVIEWER: { id: '54da6e71-a111-49f9-ac18-e25817066cbf', name: 'Judge Reviewer', email: 'reviewer1@escrow.local' },
  ADMIN: { id: '233616fd-2260-4131-882a-bb9e50f295b1', name: 'Vaibhav Chavanpatil (VAIBHAV)', email: 'admin@escrow.local' },
};

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentPersona: { id: string; name: string; email: string };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('CLIENT');

  useEffect(() => {
    const saved = localStorage.getItem('activeRole') as Role;
    if (saved && PERSONAS[saved]) setRoleState(saved);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem('activeRole', newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, currentPersona: PERSONAS[role] }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
}
