export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  isAdmin: boolean;
  permissions: string[];
  unit: 'main' | 'franchise' | 'factory';
}
