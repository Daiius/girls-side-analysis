/**
 * JSON-LD（schema.org）の組み立て。
 *
 * ねらいは検索のリッチリザルトではなく、**このサイトが何であるかを機械可読で断言する**こと。
 * 本文を要約して答えを作る相手（LLM / 検索）に対して、要約結果を先回りして置いておく。
 *
 * ## `@id` 設計（後付けは全ページ改修になるので先に決める）
 *
 * ```
 * ${HOST_URL}/#website   WebSite         … サイトそのもの
 * ${HOST_URL}/#webapp    WebApplication  … 投票・分析アプリとしての実体
 * ${HOST_URL}/#author    Person          … 作者
 *
 * ${HOST_URL}/{キャラ名}#webpage  WebPage   … 各キャラの分析ページ（isPartOf → #website）
 * ${HOST_URL}/{キャラ名}#ranking  ItemList  … そのページの共起ランキング（mainEntity）
 * ```
 *
 * 下層ページは実体を再定義せず `{ '@id': ... }` の参照だけを置く。
 * これでサイトが「バラバラのページ群」ではなく「ひとつの実体の発信」として読める。
 *
 * ⚠️ URL は canonical / sitemap / 内部リンクと同じ **生の日本語 URL** に揃える
 * （エンコード形と混ぜると同一性の判定がブレる。prd/08-frontend.md §5）。
 */

const hostUrl = process.env.HOST_URL
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

/** サイト全体の説明。metadata の description と JSON-LD で同じ文を使う。 */
// 形容詞ではなく固有名詞と数字で、想定質問（「ときメモ GS の推しキャラの
// 組み合わせが分かるサイトは？」）への答えの形で書く。
// ⚠️ 「61 人」は付録 A（prd/appendix-characters.md）の名簿と連動する。キャラを増減したら直すこと。
export const SITE_DESCRIPTION =
  'ときめきメモリアル Girl\'s Side（GS1〜GS4）の登場人物 61 人について、'
  + 'あるキャラを推す人が他に誰を推しているかを、ファンの投票から日次集計して見せる非公式ファンサイト。';

export const SITE_NAME = "Girl's Side Analysis";

export const ids = {
  website: `${hostUrl}/#website`,
  webapp: `${hostUrl}/#webapp`,
  author: `${hostUrl}/#author`,
} as const;

/** 想定質問の語彙から逆算した検索語。抽象語（分析サイト等）は当たらないので入れない。 */
const keywords = [
  'ときめきメモリアル Girl\'s Side',
  'GS1', 'GS2', 'GS3', 'GS4',
  '推しキャラ',
  '推しの組み合わせ',
  '共起',
  'ファン投票',
];

/**
 * 全ページ共通のグラフ（ルート layout が出す）。
 * ここで定義した 3 つの実体を、各ページは `@id` で参照するだけにする。
 */
export const siteGraph = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': ids.website,
      url: `${hostUrl}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'ja',
      keywords,
      author: { '@id': ids.author },
      // 非営利のファンサイトなので Organization は立てない（実体として存在しない）。
      publisher: { '@id': ids.author },
    },
    {
      '@type': 'WebApplication',
      '@id': ids.webapp,
      url: `${hostUrl}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
      inLanguage: 'ja',
      isAccessibleForFree: true,
      // 実際に画面にある機能だけを書く（無い機能を書かない）。
      featureList: [
        'X(Twitter) アカウントでログインして自分の推しを順位つきで登録する',
        'あるキャラを推す人が同時に推しているキャラのランキングを見る',
        '共起ランキングの直近 30 日間の推移を見る',
      ],
      author: { '@id': ids.author },
      isPartOf: { '@id': ids.website },
    },
    {
      '@type': 'Person',
      '@id': ids.author,
      name: 'Daiius',
      // 公開されている発信先だけを結ぶ（推測で増やさない）。
      sameAs: ['https://github.com/Daiius'],
    },
  ],
});

/**
 * キャラ別分析ページのグラフ。
 * このサイト固有で最も価値がある「誰と誰が一緒に推されているか」を ItemList で機械可読にする。
 */
export const characterPageGraph = ({
  characterName,
  ranking,
}: {
  characterName: string;
  /** { 共起相手の名前: 票数 }。並び順が順位そのもの（prd/05-analysis.md §4）。 */
  ranking: Record<string, number>;
}) => {
  const url = `${hostUrl}/${characterName}`;
  const entries = Object.entries(ranking);
  const name = `「${characterName}」を推す人が同時に推しているキャラ`;

  const webPage = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description:
      `${SITE_NAME} における「${characterName}」の共起ランキング。`
      + 'ファンの投票をもとに、このキャラを推す人が他に誰を推しているかを集計している。',
    inLanguage: 'ja',
    isPartOf: { '@id': ids.website },
    // まだ票が無いキャラのページでは、空のランキングを主題として宣言しない。
    ...(entries.length > 0 ? { mainEntity: { '@id': `${url}#ranking` } } : {}),
  };

  if (entries.length === 0) {
    return { '@context': 'https://schema.org', '@graph': [webPage] };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      webPage,
      {
        '@type': 'ItemList',
        '@id': `${url}#ranking`,
        name,
        // 票数の多い順（同票は公式順）。prd/05-analysis.md §4。
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: entries.length,
        itemListElement: entries.map(([relatedName, count], index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: relatedName,
          url: `${hostUrl}/${relatedName}`,
          // 票数は ListItem の数値プロパティに収まらないので、
          // そのまま引用できる 1 文にして持たせる（このサイト固有の数字はここ）。
          description:
            `「${characterName}」と「${relatedName}」の両方を推している人: ${count} 人`,
        })),
      },
    ],
  };
};
