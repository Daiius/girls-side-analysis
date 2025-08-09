import clsx from 'clsx';

import type { Metadata } from 'next';

import { getCharacters } from '@/lib/characters'; 
import { 
  getLatestVotesForAnalysis, 
  getTimelineData,
} from '@/lib/votes';

import VoteLink from '@/components/VoteLink';
import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysisContent from '@/components/TopAnalysisContent';
import LineChartClient from '@/components/LineChartClient';
import XShareLink from '@/components/XShareLink';
import { notFound } from 'next/navigation';

const hostUrl = process.env.HOST_URL 
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

// NOTE:
// generateStaticParamsによるビルド時のキャッシュ生成をしていましたが、
// revalidatePath や dynamicParams を組み合わせて
// 「ビルド時に生成したページ以外は拒否 + On-demand ISR 更新」を実現しようとして 
// 上手くいかないことに気付きました
// 
// そもそもビルド時に全てのページを生成するとDBに負荷がかかるので
// 最初の試みとして残るようにコメントアウトして、generateStaticParamsは止める事にします

// On-demand ISR設定をし
// 投票が無くとも、アップデートは1日1回
// NOTE: これが有っても無くてもdynamicParams=false時の不自然な挙動は止まらない
export const revalidate = 86400;
export const dynamic = 'error';

// generateStaticParamsで生成した以外のパラメータを404とする
// TODO falseにするとrevalidatePathによる再生成に失敗する？？
// → 失敗する、dynamicParamsは「キャッシュが存在しないページを生成するか」のフラグで、
//   「generateStaticParamsで生成したページ以外を404にする」というのは厳密には間違っている
//   generateStaticParamsで生成したキャッシュをrevalidatePathなどで無効化すると、
//   それ以降のアクセスで「キャッシュにないページにアクセスした」ことになり、
//   dynamicParams = false だと404エラーになってしまう！
//export const dynamicParams = true;

/**
 * データベースからキャラクター一覧を取得して
 * 対応する分析ページを事前に生成出来るようにします
 */
//export async function generateStaticParams() {
//  const characters = await getCharacters();
//  return characters.map(chara => ({ charaName: chara.name }));
//}

export async function generateMetadata({ params }: { params: Promise<{ charaName: string }> }) {
  const { charaName } = await params;
  const decodedCharaName = decodeURIComponent(charaName);
  return {
    title: "Girl's Side Analysis",
    description: ` GSシリーズの情報共有・分析サイト ${decodedCharaName}分析ページ`,
    openGraph: {
      type: 'website',
      url: `${hostUrl}/${decodedCharaName}`,
      description: ` GSシリーズの情報共有・分析サイト「${decodedCharaName}」分析ページ`,
      siteName: "Girl's Side Analysis",
      images: `${hostUrl}/girls-side-analysis-logo.png`,
    },
    icons: [{
      rel: 'apple-touch-icon',
      url: `${hostUrl}/girls-side-analysis-touch-icon.png`,
      sizes: '180x180',
    }]
  } satisfies Metadata;
}


/**
 * 各キャラの、同時に推されているキャラ分析ページ
 *
 * 誰かがアクセスする度に毎回データ分析していては
 * サーバの処理能力が間に合わないと考えたので、
 * 一定時間ごとにrevalidateする静的ページとします
 */
export default async function Page({
  params
}: { params: Promise<{ charaName: string }>}) {

  const { charaName } = await params;
  const decodedCharaName = decodeURIComponent(charaName);
  
  // キャラクター一覧を取得し、charaNameが含まれるかここでチェックするしかない
  // getCharacters は適切な時間間隔でのキャッシュを行うこと
  const characters = await getCharacters();
  if (!characters.map(c => c.name).includes(decodedCharaName)) {
    return notFound();
  }
 
  const analysisData = await getLatestVotesForAnalysis(decodedCharaName);
  const datasets = await getTimelineData(decodedCharaName);
    
  return (
    <div className='flex flex-col items-center w-full'>
      <div className='relative w-full h-24'>
        <VoteLink
          className={clsx(
            'absolute left-1/2 -translate-x-1/2',
            'top-1/2 -translate-y-1/2',
          )}
        />
        <XShareLink
          className={clsx(
            'absolute right-0',
            'top-1/2 -translate-y-1/2',
          )}
          text={`GSシリーズの情報共有・分析サイト「${decodedCharaName}」分析ページ`}
          url={`${hostUrl}/${encodeURIComponent(decodedCharaName)}`}
        />
      </div>
      <TopCharacterSelect className='my-5'/>
      <TopAnalysisContent
        className='w-full mb-2'
        analysisData={analysisData}
        targetCharacterName={decodedCharaName}
      />
      {datasets.length > 0 &&
        <div className='w-full mb-4'>
          <LineChartClient
            className='w-full'
            datasets={datasets}
          />
        </div>
      }
    </div>
  );
}

