'use client'

import React from 'react';
import clsx from 'clsx';
import Chart from 'chart.js/auto';

import { DataSet } from '@/types';
import { useSettings } from '@/providers/SettingsProvider';

const LineChartClient: React.FC<
  {
    datasets: DataSet[];
    labels?: string[];
  }
  & React.ComponentProps<'canvas'>
> = ({
  datasets,
  labels,
  className,
  ...props
}) => {

  const { mounted } = useSettings();
  const refCanvas = React.useRef<HTMLCanvasElement>();
  const refChart  = React.useRef<Chart>(); 

  console.log('datasets: ', datasets);

  React.useEffect(() => {
    if (mounted) {
      refCanvas.current = 
        document.getElementById('line-chart') as HTMLCanvasElement;
      if (refCanvas.current == null) {
        throw new Error('line chart container is null...');
      }
      refChart.current = new Chart(
        refCanvas.current,
        {
          type: 'line',
          data: { datasets: datasets as any},
          options: {
            scales: {
              y: { 
                min: 0,
                ticks: {
                  callback: (value, index, ticks) => 
                    Number.isInteger(value) ? value : null
                }
              },
              x: {
                ticks: {
                  callback: function(value, index, ticks) {
                    return (ticks.length - index - 1) % 7 === 0
                    ? this.getLabelForValue(value as any)
                    : null
                  }
                }
              }
            },
            //plugins: {
            //  legend: {
            //    position: 'right',
            //  }
            //}
          }
        }
      );
    }
    return () => refChart.current?.destroy();
  }, [mounted]);

  return (
    <canvas 
      id='line-chart'
      className={clsx(className)}
      {...props}
    >
    </canvas>
  );
};

export default LineChartClient;

