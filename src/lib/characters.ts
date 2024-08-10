import { db } from '@/db';
import { characters } from '@/db/schema';
import { ExtractElement } from '@/lib/utils';
import { asc } from 'drizzle-orm';

export const getCharacters = async () => await db.select()
  .from(characters)
  .orderBy(
    asc(characters.series),
    asc(characters.sort), 
  );

export type Character = ExtractElement<Awaited<ReturnType<typeof getCharacters>>>;

