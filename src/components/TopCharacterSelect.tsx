import React from 'react';
import clsx from 'clsx';

import { getCharacters } from '@/lib/characters';
import TopCharacterSelectClient from './TopCharacterSelectClient';

const TopCharacterSelect: React.FC<React.ComponentProps<'div'>> = async ({
  className,
  ...props
}) => {
  const characters = await getCharacters();
  return (
    <TopCharacterSelectClient 
      className={clsx(className)} 
      {...props}
      characters={characters}
    />
  );
};

export default TopCharacterSelect;

