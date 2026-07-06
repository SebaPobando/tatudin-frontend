import { api } from '@/api/client';
import type { LoginResponse, Membership, User } from '@/types/api';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/token/', { email, password });
  return data;
}

export async function logout(refresh: string): Promise<void> {
  await api.post('/api/auth/logout/', { refresh });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/me/');
  return data;
}

export async function getMemberships(): Promise<Membership[]> {
  const { data } = await api.get<Membership[]>('/api/memberships/');
  return data;
}
