import { 
  Character,
  Vote,
} from '@/types';

/**
 * 推しキャラ組み合わせの投票用コンポーネント
 *
 * 親のServer Componentからユーザ情報を受け取って表示します
 * 並び替えや項目追加など、インタラクションが多くなるので
 * Client Componentとして作成しています
 */
const VotingFormCharactersClient: React.FC<{
  characters: Character[],
  latestVotes: Vote[],
}> = ({
  characters,
  latestVotes,
}) => {

  return (
    <div>
      <div>推しを追加:</div>
      {latestVotes.map(lv =>
        <div key={`${lv.characterName}-${lv.level}`}>
          {lv.characterName} : 推しレベル{lv.level}
        </div>
      )}
    </div>
  );
};

export default VotingFormCharactersClient;

