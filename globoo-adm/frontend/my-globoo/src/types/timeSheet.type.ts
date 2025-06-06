export interface TimeSheet {
  id: string;
  workerId: string;
  date: string | Date;
  entryTime: string | Date | null;
  leaveTime: string | Date | null;
  hoursWorked: number | null;
  isAbsent: boolean;
  absenceType: string | null;
  notes: string | null;
  createdAt: string | Date;
  worker?: {
    id: string;
    name: string;
    employeeCode: string;
    department: string;
  };
}

export interface CreateTimeSheetDTO {
  workerId: string;
  date: string;
  entryTime?: string | null;
  leaveTime?: string | null;
  hoursWorked?: number | null;
  isAbsent: boolean;
  absenceType?: string | null;
  notes?: string | null;
}

export interface UpdateTimeSheetDTO {
  workerId?: string;
  date?: string;
  entryTime?: string | null;
  leaveTime?: string | null;
  hoursWorked?: number | null;
  isAbsent?: boolean;
  absenceType?: string | null;
  notes?: string | null;
}

export interface TimeSheetFilters {
  workerId?: string;
  startDate?: string;
  endDate?: string;
  isAbsent?: boolean;
  limit?: number;
  page?: number;
}