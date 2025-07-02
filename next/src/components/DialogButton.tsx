'use client' // for modal

import clsx from 'clsx'
import { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'

import Button from '@/components/Button'

export const DialogButton = ({
  children,
  icon,
  title,
}: {
  children: ReactNode,
  icon: ReactNode,
  title: ReactNode,
}) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {icon}
      </Button>

      <Transition appear show={open}>
        <Dialog 
          as='div'
          onClose={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'flex flex-col gap-4',
                    'w-full rounded-xl py-2 px-5 backdrop-blur-2xl',
                    'bg-sky-300',
                  )}
                >
                  <DialogTitle className='my-1 font-bold'>
                    {title}
                  </DialogTitle>
                  {children}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

