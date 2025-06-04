'use server'

import { signOut as authSignOut } from '@/auth';

export async function signOut(
  params?: Parameters<typeof authSignOut>[0]
) { await authSignOut(params); }

