import { db } from '@/db';
import { characters } from '@/db/schema';
import { ExtractElement } from '@/lib/utils';

export const getCharacters = async () => await db.select().from(characters)

export type Character = ExtractElement<Awaited<ReturnType<typeof getCharacters>>>;

