import React from 'react';
import clsx from 'clsx';

import { getCharacters } from '@/lib/characters';
import TopCharacterSelectClient from './TopCharacterSelectClient';

/**
 * キャラ毎の分析ページに移動するためのSelectコンポーネントです
 *
 * データ取得とインタラクションの両方が必要なので、
 * server componentでデータを取得し、client componentに渡しています
 * (わざわざclient componentでデータ取得する仕組みを整えるのが手間なので...)
 */
const TopCharacterSelect: React.FC<
  React.ComponentProps<'div'>
> = async ({
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

