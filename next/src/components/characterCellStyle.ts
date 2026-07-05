import clsx from 'clsx';

/**
 * キャラ選択セルの共通スタイル。
 * 投票（トグルボタン）と分析（遷移リンク）でセルの「中身」は違うが、
 * 見た目（サイズ・シリーズ色）は揃えたいので、ここに集約する。
 *
 * シリーズ色は Header のハート（GS1=green / GS2=blue / GS3=pink / GS4=orange）に対応。
 * グラデーションは「ゲーム画面風の重要ボタン」である GSButton 専用の装飾なので
 * ここでは使わず、フラットな塗りで表現する。
 * - 非選択セル: 白ベース + シリーズ色の左アクセントバー
 *   （検索結果などシリーズ横断の一覧でも所属シリーズが色で分かる）
 * - 選択（選択済み / 現在地）セル: シリーズ色のフラットな塗り + 白文字
 */

/** セルの基本クラス（button / a 共通）。 */
export const characterCellBaseClass = clsx(
  'relative w-full min-h-11 rounded-lg border px-1 py-2',
  'flex items-center justify-center text-center',
  'transition-colors',
);

/**
 * シリーズ色の左アクセントバー。
 * セルのほか、ダイアログを開くトリガーボタンを「セル風」に見せる用途でも使う。
 */
export const seriesLeftAccentClass = (series: number) => clsx(
  'border-l-4',
  series === 1 && 'border-l-green-400',
  series === 2 && 'border-l-sky-400',
  series === 3 && 'border-l-pink-400',
  series === 4 && 'border-l-orange-400',
);

/**
 * 非アクティブセル: 白ベース + シリーズ色の左アクセントバー。
 * ボーダーと文字色もシリーズ色系統（文字はほぼ黒に近い 950）でまとめる。
 */
export const characterCellIdleClass = (series: number) => clsx(
  'bg-white/60 hover:bg-white',
  series === 1 && 'border-green-600 text-green-950',
  series === 2 && 'border-sky-600 text-sky-950',
  series === 3 && 'border-pink-600 text-pink-950',
  series === 4 && 'border-orange-600 text-orange-950',
  seriesLeftAccentClass(series),
);

/** アクティブ（選択済み / 現在地）セルのシリーズ別アクセント色。 */
export const seriesActiveClass = (series: number) => clsx(
  'text-white font-bold',
  series === 1 && 'bg-green-500 border-green-600',
  series === 2 && 'bg-sky-500 border-sky-600',
  series === 3 && 'bg-pink-500 border-pink-600',
  series === 4 && 'bg-orange-500 border-orange-600',
);

/**
 * キャラ名のフォントサイズ。原則1行で収まるサイズを画面幅ごとに選ぶ:
 * - 通常名: 最長の「ギャリソン伊藤」(7字) が モバイル(375px)の1列幅で
 *   収まるよう、狭い画面では一段小さくする
 * - 長い複合名（・入り）: さらに一段小さく + col-span-2（2列幅）で1行に収める。
 *   想定外の狭さで折り返した場合も他セルと高さが揃うよう行間を詰めておく
 */
export const characterNameSizeClass = (name: string) =>
  name.includes('・')
    ? 'text-xs sm:text-sm leading-tight'
    : 'text-sm sm:text-base';

/**
 * 長い複合名（・入り）は例外的にグリッド2列分の幅を使う。
 * グリッドセルを包む要素（li 等）に付けること。
 */
export const characterCellSpanClass = (name: string) =>
  name.includes('・') ? 'col-span-2' : undefined;
