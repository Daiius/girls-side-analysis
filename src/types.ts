
import type {
  getLatestUserState,
  getUserStatesMaster,
} from '@/lib/users';
import type {
  getCharacters
} from '@/lib/characters';
import type {
  getLatestVotes
} from '@/lib/votes';
import { ExtractElement } from './lib/utils';

export type UserStatesMaster = 
  Awaited<ReturnType<typeof getUserStatesMaster>>;
export type UserState = 
  Awaited<ReturnType<typeof getLatestUserState>>;

export type Character =
  ExtractElement<Awaited<ReturnType<typeof getCharacters>>>;

export type Vote =
  ExtractElement<Awaited<ReturnType<typeof getLatestVotes>>>;

