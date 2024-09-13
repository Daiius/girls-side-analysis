import Button from '@/components/Button';

const XShareLink: React.FC<
  {
    text: string;
    url: string;
    children: React.ReactNode,
  } & React.ComponentProps<'a'>
> = ({
  text,
  url,
  className,
  children,
  ...props
}) => (
  <a 
    className={className}
    target='_blank'
    href={
      `https://twitter.com/share?text=${encodeURIComponent(text+'\n')}&url=${encodeURIComponent(url)}`
    }
    rel='noopener noreferrer'
    {...props}
  >
    <Button>{children}</Button>
  </a>
);

export default XShareLink;

