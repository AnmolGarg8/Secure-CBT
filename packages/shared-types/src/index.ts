export interface HealthCheckResponse {
  status: 'ok';
}

export interface UserPlaceholder {
  id: string;
  email: string;
  role: 'admin' | 'candidate';
}
