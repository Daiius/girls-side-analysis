'use client'

import clsx from 'clsx';

import Link from 'next/link';

import VoteButton from '@/components/VoteButton';

/**
 * プロファイルページへのリンク
 *
 * リンク先では非表示にするため、client componentとしています。
 * 投票ボタンの見た目を Next.js の Link として直接描画し、
 * <a> の中に <button> を入れ子にしない（単一の <a> にする）。
 */
const VoteLink: React.FC<{ className?: string }> = ({
  className,
}) => (
  <VoteButton
    as={Link}
    href='/profile'
    className={clsx(className)}
  />
);

export default VoteLink;
