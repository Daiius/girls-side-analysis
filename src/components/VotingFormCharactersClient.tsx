import { 
  Character,
  Vote,
} from '@/types';

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

