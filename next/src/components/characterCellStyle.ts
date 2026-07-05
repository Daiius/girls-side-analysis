import clsx from 'clsx';

/**
 * シリーズ配色とキャラ選択セルの共通スタイル。
 * 投票（トグルボタン）と分析（遷移リンク）でセルの「中身」は違うが、
 * 見た目（サイズ・シリーズ色）は揃えたいので、ここに集約する。
 *
 * シリーズ色は Header のハート（GS1=green / GS2=blue / GS3=pink / GS4=orange）に対応。
 * グラデーションは「ゲーム画面風の重要ボタン」である GSButton 専用の装飾なので
 * ここでは使わず、フラットな塗りで表現する。
 */

/**
 * シリーズ毎の配色トークン。シリーズ追加・色変更はこのテーブルだけを直す。
 * Tailwind はソース中のリテラルからクラスを検出するため、値は完全なクラス名で書く。
 * GS2 の淡色（pale）はダイアログのパネル背景（bg-sky-100）に溶けないよう
 * sky-200/60 にしている。
 */
export const seriesTheme: Record<number, {
  /** セル・トリガーボタン左端のアクセントバー色 */
  leftAccent: string;
  /** 非選択セルの枠線・文字色（文字はほぼ黒の 950） */
  idle: string;
  /** 選択状態（選択済みセル / 現在地セル / 選択中チップ）のフラットな塗り */
  active: string;
  /** 淡色（未選択チップ・シリーズ見出しバッジ） */
  pale: string;
  /** 未選択チップの hover */
  chipHover: string;
  /** 未選択チップのチェックボックス枠色 */
  checkboxBorder: string;
  /** 選択中チップのチェックマーク色（白地の箱の上に置く） */
  check: string;
}> = {
  1: {
    leftAccent: 'border-l-green-400',
    idle: 'border-green-600 text-green-950',
    active: 'bg-green-500 border-green-600',
    pale: 'bg-green-100 text-green-900 border-green-400',
    chipHover: 'hover:bg-green-200',
    checkboxBorder: 'border-green-500',
    check: 'text-green-600',
  },
  2: {
    leftAccent: 'border-l-sky-400',
    idle: 'border-sky-600 text-sky-950',
    active: 'bg-sky-500 border-sky-600',
    pale: 'bg-sky-200/60 text-sky-900 border-sky-400',
    chipHover: 'hover:bg-sky-200',
    checkboxBorder: 'border-sky-500',
    check: 'text-sky-600',
  },
  3: {
    leftAccent: 'border-l-pink-400',
    idle: 'border-pink-600 text-pink-950',
    active: 'bg-pink-500 border-pink-600',
    pale: 'bg-pink-100 text-pink-900 border-pink-400',
    chipHover: 'hover:bg-pink-200',
    checkboxBorder: 'border-pink-500',
    check: 'text-pink-600',
  },
  4: {
    leftAccent: 'border-l-orange-400',
    idle: 'border-orange-600 text-orange-950',
    active: 'bg-orange-500 border-orange-600',
    pale: 'bg-orange-100 text-orange-900 border-orange-400',
    chipHover: 'hover:bg-orange-200',
    checkboxBorder: 'border-orange-500',
    check: 'text-orange-600',
  },
};

/**
 * 長い複合名（・入り）か。
 * フォントサイズ・セル幅（col-span）・折り返し位置の3挙動がこの判定を共有する。
 */
export const isCompoundName = (name: string) => name.includes('・');

/**
 * シリーズ色の左アクセントバー。
 * セルのほか、ダイアログを開くトリガーボタンを「セル風」に見せる用途でも使う。
 */
export const seriesLeftAccentClass = (series: number) =>
  clsx('border-l-4', seriesTheme[series]?.leftAccent);

/** アクティブ（選択済みセル / 現在地セル / 選択中チップ）のシリーズ別アクセント色。 */
export const seriesActiveClass = (series: number) =>
  clsx('text-white font-bold', seriesTheme[series]?.active);

/**
 * キャラ名のフォントサイズ。原則1行で収まるサイズを画面幅ごとに選ぶ:
 * - 通常名: 最長の「ギャリソン伊藤」(7字) が モバイル(375px)の1列幅で
 *   収まるよう、狭い画面では一段小さくする
 * - 長い複合名: さらに一段小さく + col-span-2（2列幅）で1行に収める。
 *   想定外の狭さで折り返した場合も他セルと高さが揃うよう行間を詰めておく
 */
const characterNameSizeClass = (name: string) =>
  isCompoundName(name)
    ? 'text-xs sm:text-sm leading-tight'
    : 'text-sm sm:text-base';

/**
 * キャラ選択セルのクラス一式（button / a 共通）。
 * - 非アクティブ: 白ベース + シリーズ色の枠・文字・左アクセントバー
 *   （検索結果などシリーズ横断の一覧でも所属シリーズが色で分かる）
 * - アクティブ（選択済み / 現在地）: シリーズ色のフラットな塗り + 白文字
 */
export const characterCellClass = (
  character: { name: string; series: number },
  active: boolean,
) => clsx(
  'relative w-full min-h-11 rounded-lg border px-1 py-2',
  'flex items-center justify-center text-center',
  'transition-colors',
  characterNameSizeClass(character.name),
  active
    ? seriesActiveClass(character.series)
    : clsx(
        'bg-white/60 hover:bg-white',
        seriesTheme[character.series]?.idle,
        seriesLeftAccentClass(character.series),
      ),
);

/**
 * 長い複合名は例外的にグリッド2列分の幅を使う。
 * グリッドセルを包む要素（li 等）に付けること。
 */
export const characterCellSpanClass = (name: string) =>
  isCompoundName(name) ? 'col-span-2' : undefined;
