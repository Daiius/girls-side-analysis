import TopCharacterSelect from '@/components/TopCharacterSelect';
import clsx from 'clsx';

export default function Home({
  searchParams
}: {
  searchParams?: {
    oshi?: string;
  }
}) {
  const oshi = searchParams?.oshi || '';
  return (
    <div>推しの組み合わせを分析します...</div>
  );
}

