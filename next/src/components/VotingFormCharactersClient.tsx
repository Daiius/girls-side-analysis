'use client'

import React from 'react';
import clsx from 'clsx';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


import { 
  Character,
  Vote,
} from '@/types';

import CharacterStrip from './CharacterStrip';
import HandIndexIcon from './HandIndexIcon';


const SortableCharacterStrip: React.FC<
  React.ComponentProps<typeof CharacterStrip>
> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.characterName });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div 
      className={clsx(
        'w-fit touch-none',
      )}
      ref={setNodeRef} style={style} {...attributes} {...listeners}
    >
      <CharacterStrip {...props} />
    </div>
  );
};

/**
 * 推しキャラ組み合わせの投票用コンポーネント
 *
 * 親のServer Componentからユーザ情報を受け取って表示します
 * 並び替えや項目追加など、インタラクションが多くなるので
 * Client Componentとして作成しています
 */
const VotingFormCharactersClient: React.FC<
  {
    characters: Character[],
    latestVotes: Vote[],
    favorites: string[];
    setFavorites: React.Dispatch<React.SetStateAction<string[]>
    >
  }
  & React.ComponentProps<'div'>
> = ({
  characters,
  latestVotes,
  favorites,
  setFavorites,
  className,
  ...props
}) => {

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { distance: 10 }
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;

    if (over == null) {
      // 変な位置にドロップされた場合削除とみなす
      // 2024/08/25時点ではうまくいかない
      setFavorites(items => items.filter(c => c !== active.id));
    } else if (active.id !== over.id) {
      // それ以外はいれかえ
      setFavorites(items => {
        const oldIndex = items.findIndex(c => c === active.id);
        const newIndex = items.findIndex(c => c === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  return (
    <div 
      className={clsx(
        'bg-black/5',
        'border border-1 border-slate-500',
        'rounded-lg relative',
        className
      )}
      {...props}
    >
      <div className='flex flex-col gap-2'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={favorites}
            strategy={verticalListSortingStrategy}
          >
            {favorites.length === 0 &&
              <div>推しを選択、追加しましょう！</div>
            }
            {favorites.length > 0 &&
              favorites
                .map((c, ic) =>
                  <SortableCharacterStrip
                    className={clsx(
                      'w-[13rem] h-[3rem]',
                    )}
                    key={c}
                    characterName={c}
                    level={ic}
                    onDelete={() => setFavorites(items =>
                      items
                        .filter(characterName => characterName !== c)
                    )}
                  />
                )
              }
          </SortableContext>
        </DndContext>
      </div>
      {favorites.length >= 2 &&
        <div 
          className={clsx(
            'absolute right-0 h-full w-20 bg-slate-500/20 top-0',
            'rounded-md',
            'text-white',
          )}
        >
          <div className={clsx(
            'absolute',
            'border-2 border-white rounded-md w-10 h-4',
            'top-1/2 left-2',
            'animate-swipe-1',
          )}/>
          <div className={clsx(
            'absolute',
            'border-2 border-white rounded-md w-10 h-4',
            'top-1/2 left-2',
            'animate-swipe-2',
          )}/>
          <HandIndexIcon
            width='2rem' height='2rem'
            //rotate='90'
            className={clsx(
              'absolute',
              //'rotate-90 -scale-y-100',
              'top-1/2 left-1/2 -translate-x-1/2',
              'animate-swipe-1-hand',
            )}
          />
        </div>
      }
    </div>
  );
};

export default VotingFormCharactersClient;

