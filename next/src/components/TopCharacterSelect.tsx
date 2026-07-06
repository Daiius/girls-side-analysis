import React from 'react';

import { getCharacters } from '@/lib/characters';
import TopCharacterPickerDialog from './TopCharacterPickerDialog';

/**
 * キャラ毎の分析ページに移動するためのキャラ選択コンポーネントです
 *
 * データ取得とインタラクションの両方が必要なので、
 * server componentでデータを取得し、client componentに渡しています
 * (わざわざclient componentでデータ取得する仕組みを整えるのが手間なので...)
 */
const TopCharacterSelect: React.FC<
  React.ComponentProps<'div'>
> = async ({
  className,
}) => {
  const characters = await getCharacters();
  return (
    <TopCharacterPickerDialog
      className={className}
      characters={characters}
    />
  );
};

export default TopCharacterSelect;

