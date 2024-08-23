import React from 'react';

import { Vote } from '@/types';

/**
 * 推し組み合わせ投票のキャラクター選択処理を行います
 *
 * 4thのマリィ・ガーデンに見立ててキャラクターを追加・移動します
 */
export const useGarden = ({
  latestVotes 
}: {
  latestVotes: Vote[];
}) => {

  type GardenData = Vote & { position: number };

  const [charactersInGarden, setCharactersInGarden] =
    React.useState<Vote[]>(latestVotes);
  
  const positionData: GardenData[] = [];
  for (const c of charactersInGarden) {
    const position = positionData
      .filter(pd => pd.level === c.level)
      ?.length ?? 0;
    positionData.push({ ...c, position });
  }
  
  const maxLevel = Math.max(
    ...charactersInGarden.map(lv => lv.level)
  );
  
  
  /**
   * 推し順位を減少させます
   * 1より小さい数にはしません
   * 空の順位が出来る場合には自分以下の順位を全て減少させます
   */
  const decreaseLevel = (charaName: string) => {
    const levelOfTarget = charactersInGarden 
      .find(c => c.characterName === charaName)?.level;
    if (levelOfTarget == null || levelOfTarget <= 1) return;

    if (
      charactersInGarden
        .filter(c => c.level === levelOfTarget)
        .length === 1
    ) {
      // 単純に順位を上げると空の順位ができてしまう
      // 自分以下の順位のキャラクターの順位を一つ上昇する
      setCharactersInGarden([
        ...charactersInGarden.filter(v =>
          charaName !== v.characterName
        ).map(v =>
          v.level >= levelOfTarget // 等号は成立しないはず
            ? { ...v, level: v.level - 1 }
            : v
        ),
        {
          characterName: charaName,
          level: levelOfTarget - 1,
        }
      ]);
    } else {
      // 空の順位ができないので安心
      // 該当キャラクターのみ順位を変化させる
      setCharactersInGarden([
        ...charactersInGarden.filter(v =>
          charaName !== v.characterName
        ),
        {
          characterName: charaName,
          level: levelOfTarget - 1,
        }
      ]);
    }
  };
  
  /**
   * 推し順位を増加させます
   * その順位に1つしかない場合には増加させません
   * (空の順位は作りません)
   */
  const increaseLevel = (charaName: string) => {
    const levelOfTarget = charactersInGarden 
      .find(c => c.characterName === charaName)?.level;
    if (levelOfTarget == null) return;
    const isOnlyCharaInLevel = charactersInGarden
      .filter(c => c.level === levelOfTarget)
      .length <= 1;
    if (isOnlyCharaInLevel) {
      if (levelOfTarget === maxLevel) {
        // 最大レベルで孤立している場合...
        // 対象を削除します
        setCharactersInGarden(
          charactersInGarden.filter(c => c.characterName !== charaName)
        );
      }
    } else {
      // 単純に順位を一つ増やす
      setCharactersInGarden([
        ...charactersInGarden.filter(v =>
          charaName !== v.characterName
        ),
        {
          characterName: charaName,
          level: levelOfTarget + 1,
        }
      ]);
    }
  };

  const addCharacter = (charaName: string) => {
    setCharactersInGarden([
      ...charactersInGarden,
      { characterName: charaName, level: maxLevel }
    ]);
  };

  return {
    charactersInGarden: positionData,
    maxLevel,
    increaseLevel,
    decreaseLevel,
    addCharacter,
  };
};

