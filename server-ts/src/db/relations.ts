import { defineRelations } from 'drizzle-orm';
import { characters } from './schema';


export const relations = defineRelations({ characters });
