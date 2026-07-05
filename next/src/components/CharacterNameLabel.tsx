import React from 'react';

/**
 * キャラセル内の名前表示。
 * 長い複合名（・入り）は、幅が足りない時に文字の途中（「〜フィール/ド」等）で
 * 折り返されると不格好なので、・の直後でだけ折り返せるよう
 * パート毎に inline-block で包む。幅が足りれば1行のまま表示される。
 */
const CharacterNameLabel: React.FC<{ name: string }> = ({ name }) =>
  name.includes('・')
    ? <span>
        {name.split('・').map((part, i, parts) =>
          <span key={i} className='inline-block'>
            {part}
            {i < parts.length - 1 && '・'}
          </span>
        )}
      </span>
    : <span>{name}</span>;

export default CharacterNameLabel;
