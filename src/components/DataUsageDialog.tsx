'use client'

import React from 'react';

import { 
  Dialog, 
  DialogPanel, 
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import Button from '@/components/Button';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const DataUsageDialog: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const onClose = () => setIsOpen(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <InformationCircleIcon className='size-6'/>
      </Button>

      <Transition appear show={isOpen}>
        <Dialog 
          as='div'
          onClose={onClose}
          className='relative z-10 focus:outline-none'
        >
          {/* これはおそらく背景要素 */}
          <div className='fixed inset-0 bg-black/30 w-screen overflow-auto'>
            <div className='flex min-h-full items-start justify-center p-4'>
              <TransitionChild
                enter='ease-out duration-300'
                enterFrom='opacity-0 transform-[scale(95%)]'
                enterTo='opacity-100 transform-[scale(100%)]'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 transform-[scale(100%)]'
                leaveTo='opacity-0 transform-[scale(95%)]'
              >
                <DialogPanel
                  onClick={onClose}
                  className='w-full max-w-4/5 rounded-xl bg-slate-300 dark:bg-slate-600 py-2 px-5 backdrop-blur-2xl'
                >
                  <DialogTitle className='my-1 font-bold'>
                    <div>データの使用方法：</div>
                    <img
                      className='bg-white/80 ml-auto mr-auto rounded-lg'
                      alt='データ使用方法' 
                      src='/girls-side-analysis/data_usage.svg'
                    />
                  </DialogTitle>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};


export default DataUsageDialog;

