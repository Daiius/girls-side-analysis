
/**
 * 配列の型から要素の型を取得します
 */
export type ExtractElement<T> = T extends (infer U)[] ? U : never;

