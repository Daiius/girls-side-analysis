import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysis,
  getTimelineData,
} from '@/lib/votes';
import HeaderProfileLink from '@/components/HeaderProfileLink';
import XShareLink from '@/components/XShareLink';

// トップページは多くの人がアクセスすることを想定し、
// static renderingにします...
export const dynamic = 'force-static';
export const revalidate =
  process.env.NODE_ENV === 'production' ? 300 : 30;

export default async function Home() {

  const data = await getLatestVotesForAnalysis();

  const relatedCharacters = Object.keys(data) as string[];
  const timelineDataDict = (await Promise.all(
    relatedCharacters
      .map(async c => 
        ({ [c]: await getTimelineData(c) })
      )
  )).reduce((acc, curr) => ({ ...acc, ...curr }), {});

  // trailing slashまで付けるとopenGraphImageが表示されるのを確認
  const text = 'GSシリーズの情報共有・分析サイト';
  const sharedURL = 'https://faveo-systema.net/girls-side-analysis';


  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
        <div className={clsx(
          'relative mt-4',
          'border-2 border-slate-300',
          'rounded-b-lg rounded-tr-lg bg-slate-300',
          'text-sm sm:text-base flex flex-col',
          'before:content-[""]',
          'before:absolute before:bg-slate-300',
          'before:min-w-24 before:min-h-6 before:-top-6 before:-left-[2px]',
          'before:rounded-tl-lg',
          'before:[clip-path:polygon(0_0,_70%_0,_100%_100%,0_100%)]',
        )}>
          <div className={clsx(
            'bg-white/90 rounded-lg px-4 py-1 flex flex-col',
            'shadow-inner',
          )}>
            <div className={clsx(
              'flex flex-col',
              '[background-image:linear-gradient(0deg,_lightgray_1px,_transparent_1px)]',
              '[background-size:100%_1.5rem]',
              '[line-height:1.5rem]',
              'h-[4.6rem]',
              //'[background-position:0_0.2rem]', // 上部に余計な線が出る
            )}>
              <span>
              "ときめきメモリアル Girl's Side" シリーズのファンサイトです！
              </span>
              <span>あなたの推しを教えて下さい！</span>
            </div>
          </div>
        </div>
      <HeaderProfileLink  className='mt-3 mb-6'/>
      <TopCharacterSelect />
      <TopAnalysis 
        className='w-full flex-1' 
        topAnalysisData={data}
        timelineDataDict={timelineDataDict}
      />
      <XShareLink
        className='bottom-5 self-end sticky'
        text={text}
        url={sharedURL}
      >
        <span className='p-2'>X(Twitter)で共有</span>
      </XShareLink>
    </div>
  );
}

