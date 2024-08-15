import React from 'react';

import { Vote } from '@/types';

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
    if (levelOfTarget <= 1) return;

    const isOnlyCharaInLevel = charactersInGarden
      .filter(c => c.level === levelOfTarget)
      .length <= 1;
    if (isOnlyCharaInLevel) {
      // 自分と自分以下の順位のキャラを変化させる
      setCharactersInGarden(
        charactersInGarden.map(c =>
          levelOfTarget <= c.level
          ? { 
              characterName: c.characterName,
              level: c.level - 1,
            }
          : c
        )
      );
    } else {
      // 該当キャラクターのみ順位を変化させる
      setCharactersInGarden(
        charactersInGarden.map(v =>
          charaName === v.characterName
          ? { characterName: v.characterName,
              level: v.level - 1,
           }
          : v
        )
      );
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
    const isOnlyCharaInLevel = charactersInGarden
      .filter(c => c.level === levelOfTarget)
      .length <= 1;
    if (isOnlyCharaInLevel) return;

    setCharactersInGarden(
      charactersInGarden.map(v =>
        charaName === v.characterName
        ? {
            characterName: v.characterName,
            level: v.level + 1,
          }
        : v
      )
    );
  };

  return {
    charactersInGarden: positionData,
    maxLevel,
    increaseLevel,
    decreaseLevel,
  };
};

