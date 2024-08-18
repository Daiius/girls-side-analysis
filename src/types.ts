
import type {
  getLatestUserState,
  getUserStatesMaster,
} from '@/lib/users';
import type {
  getCharacters
} from '@/lib/characters';
import type {
  getLatestVotes,
  getLatestVotesForAnalysis
} from '@/lib/votes';

export type ExtractElement<T> = T extends (infer U)[] ? U : never;

export type UserStatesMaster = 
  Awaited<ReturnType<typeof getUserStatesMaster>>;
export type UserState = 
  Awaited<ReturnType<typeof getLatestUserState>>;

export type Character =
  ExtractElement<Awaited<ReturnType<typeof getCharacters>>>;

export type Vote =
  ExtractElement<Awaited<ReturnType<typeof getLatestVotes>>>;

export type TopAnalysisData =
  Awaited<ReturnType<typeof getLatestVotesForAnalysis>>;
