import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  empId: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  avatarUri?: string;
  avatarLocal?: any;
}

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_01',
    firstName: 'Soumen',
    lastName: 'Sen',
    name: 'Soumen Sen',
    empId: '93821048',
    phone: '0400 555 320',
    email: 'soumen@crowncuts.com.au',
    status: 'active',
    avatarLocal: require('../../assets/emp_avatar_1.png'),
  },
  {
    id: 'emp_02',
    firstName: 'Liam',
    lastName: 'Hemsworth',
    name: 'Liam Hemsworth',
    empId: '93822048',
    phone: '0400 555 321',
    email: 'liam@crowncuts.com.au',
    status: 'active',
    avatarLocal: require('../../assets/emp_avatar_2.png'),
  },
  {
    id: 'emp_03',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    name: 'Sarah Jenkins',
    empId: '93824048',
    phone: '0400 555 322',
    email: 'sarah@crowncuts.com.au',
    status: 'inactive',
    avatarLocal: require('../../assets/emp_avatar_3.png'),
  },
  {
    id: 'emp_04',
    firstName: 'Jack',
    lastName: 'Robinson',
    name: 'Jack Robinson',
    empId: '93823048',
    phone: '0400 555 323',
    email: 'jack@crowncuts.com.au',
    status: 'active',
    avatarLocal: require('../../assets/emp_avatar_4.png'),
  },
];

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'name'>) => Employee;
  updateEmployee: (id: string, employee: Partial<Omit<Employee, 'id'>>) => void;
  toggleEmployeeStatus: (id: string) => void;
  deleteEmployee: (id: string) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  const addEmployee = (data: Omit<Employee, 'id' | 'name'>): Employee => {
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
    const newEmp: Employee = {
      ...data,
      id: `emp_${Date.now()}`,
      name: fullName || 'New Employee',
    };
    setEmployees((prev) => [newEmp, ...prev]);
    return newEmp;
  };

  const updateEmployee = (id: string, data: Partial<Omit<Employee, 'id'>>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;
        const firstName = data.firstName !== undefined ? data.firstName : emp.firstName;
        const lastName = data.lastName !== undefined ? data.lastName : emp.lastName;
        const name = `${firstName.trim()} ${lastName.trim()}`.trim() || emp.name;
        return {
          ...emp,
          ...data,
          name,
        };
      })
    );
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' }
          : emp
      )
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        deleteEmployee,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
}
