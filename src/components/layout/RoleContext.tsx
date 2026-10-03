'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';

export const PERSONAS = {
  CLIENT: { id: 'usr-client-alice', name: 'Alice Client', email: 'client1@escrow.local' },
  FREELANCER: { id: 'usr-dev-charlie', name: 'Charlie Developer', email: 'dev1@escrow.local' },
  REVIEWER: { id: 'usr-reviewer-judge', name: 'Judge Reviewer', email: 'reviewer1@escrow.local' },
  ADMIN: { id: 'usr-admin-system', name: 'System Auditor', email: 'admin@escrow.local' },
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
