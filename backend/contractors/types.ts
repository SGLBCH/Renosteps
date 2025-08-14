export interface Contractor {
  id: number;
  name: string;
  role: string;
  phone: string;
  email?: string;
  company?: string;
  hourlyRate?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractorRequest {
  name: string;
  role: string;
  phone: string;
  email?: string;
  company?: string;
  hourlyRate?: number;
  notes?: string;
}

export interface UpdateContractorRequest {
  id: number;
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  company?: string;
  hourlyRate?: number;
  notes?: string;
}

export interface ListContractorsResponse {
  contractors: Contractor[];
}
