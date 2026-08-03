'use client'

import { useRef, useEffect } from 'react';
import clsx from 'clsx';
// chart.js/auto は全コントローラ・全プラグインを登録してバンドルが膨らむため、
// この折れ線チャートが実際に使う機能だけを個別 import して登録する。
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Colors,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  // データセット側で色指定が無いため、chart.js/auto と同様に Colors プラグインで
  // 既定パレットを自動割り当てする（これが無いと全系列がグレーになる）。
  Colors,
);

import type { DataSet } from '@/types';
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

  const refCanvas = useRef<HTMLCanvasElement>(null);
  const refChart  = useRef<Chart>(null); 


  useEffect(() => {
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
          // DataSet は {x: string, y: number}[] を許すが、chart.js の
          // ChartDataset<'line'> は数値点か Point 型しか受け付けない型定義になっている。
          // 実行時は文字列 x（カテゴリ軸ラベル）で正しく動く。
          // biome-ignore lint/suspicious/noExplicitAny: chart.js の型定義側の制約を外すためのキャスト
          data: { datasets: datasets as any },
          options: {
            //maintainAspectRatio: false,
            aspectRatio: 1,
            elements: {
              point: {
                hitRadius: 16, // default: 1, increased value for mobile touch devices
                radius: 2,     // default: 3
              }
            },
            scales: {
              y: { 
                min: 0,
                ticks: {
                  callback: (value, _index, _ticks) => 
                    Number.isInteger(value) ? value : null
                },
                title: { 
                  display: true, 
                  text: '票数',
                  font: { weight: 'bold', size: 15 },
                },
              },
              x: {
                ticks: {
                  callback: function(value, index, ticks) {
                    // 7日毎に日付を表示する、今日の日付も含める
                    // callback の value は string | number だが getLabelForValue は
                    // number しか受け付けない型。カテゴリ軸では実行時に index が渡る。
                    return (ticks.length - index - 1) % 7 === 0
                    // biome-ignore lint/suspicious/noExplicitAny: chart.js の型定義側の制約を外すためのキャスト
                    ? this.getLabelForValue(value as any)
                    : null
                  }
                },
                title: { 
                  display: true, 
                  text: '日付',
                  font: { weight: 'bold', size: 15 },
                },
              }
            },
            plugins: {
              legend: {
                //maxHeight: 25,
                //labels: { boxWidth: 3, boxHeight: 3 },
                display: false,
              }
            }
          }
        }
      );
    }
    return () => refChart.current?.destroy();
  }, [mounted, datasets]);

  return (
    // {/* <div className='rounded-lg bg-white/80'> */}
    //<GSMessage className='h-auto mt-8' heightFixed={false}>
    //<div style={{ height: `${datasets.length * 10 + 200}px`}}>
      <canvas 
        id='line-chart'
        className={clsx('bg-sky-200 shadow rounded-md', className)}
        {...props}
      />
    //</div>
    //</GSMessage>
    // {/* </div> */}
  );
};

export default LineChartClient;

