import clsx from 'clsx';

import Link from 'next/link';

import VoteButton from '@/components/VoteButton'; 

/**
 * プロファイルページへのリンク
 *
 * リンク先では非表示にするため、client componentとしています
 */
const VoteLink: React.FC<
  React.ComponentProps<typeof VoteButton>
> = ({
  className,
  ...props
}) => (
  <Link 
    className={clsx(className)} 
    href='/profile'
  >
    <VoteButton {...props} />
  </Link>
);

export default VoteLink;

