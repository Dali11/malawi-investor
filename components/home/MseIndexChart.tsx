// 'use client';

// import React from 'react';
// import {
//   Area,
//   AreaChart,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from 'recharts';

// export type ChartPoint = {
//   date: string; // ISO date, e.g. '2024-06-20'
//   price: number;
// };

// type MseIndexChartProps = {
//   data: ChartPoint[];
//   title?: string;
//   currentValue?: number;
//   changePercent?: number;
// };

// function formatDateLabel(iso: string) {
//   const d = new Date(iso);
//   return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
// }

// export default function MseIndexChart({
//   data,
//   title = 'MSE INDEX',
//   currentValue,
//   changePercent,
// }: MseIndexChartProps) {
//   if (!data || data.length === 0) {
//     return (
//       <div className="w-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-center text-sm text-gray-400">
//         No index data available
//       </div>
//     );
//   }

//   const prices = data.map((d) => d.price);
//   const minPrice = Math.min(...prices);
//   const maxPrice = Math.max(...prices);
//   const padding = (maxPrice - minPrice) * 0.1 || maxPrice * 0.05;

//   const isPositive =
//  changePercent !== undefined ? changePercent >= 0 : true;
//   const strokeColor = isPositive ? '#10b981' : '#ef4444';

//  return (
//     <div className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xs font-bold tracking-wide text-gray-500 uppercase">
//           {title}
//         </h3>

//         <div className="flex items-center gap-2">
//           {currentValue !== undefined && (
//             <span className="text-sm font-bold text-gray-900">
//               {currentValue.toLocaleString(undefined, {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </span>
//           )}
//           {changePercent !== undefined && (
//             <span
//               className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
//                 isPositive ? 'bg-emerald-50 text-emerald-700'
//                   : 'bg-red-50 text-red-700'
//               }`}
//             >
//               {isPositive ? '+' : ''}
//               {changePercent.toFixed(2)}%
//             </span>
//           )}
//         </div>
//       </div>

//       {/* Chart */}
//       <div className="h-56 w-full">
//         <ResponsiveContainer width="100%" height="100%">
//           <AreaChart
//             data={data}
//             margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
//           >
//             <defs>
//               <linearGradient id="mseGradient" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor={strokeColor}
//                   stopOpacity={0.2}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor={strokeColor}
//                   stopOpacity={0}
//                 />
//               </linearGradient>
//             </defs>

//             <CartesianGrid
//               strokeDasharray="3 3"
//               vertical={false}
//               stroke="#f3f4f6"
//             />

//             <XAxis
//               dataKey="date"
//               tickFormatter={formatDateLabel}
//               tick={{ fontSize: 10, fill: '#9ca3af' }}
//               axisLine={false}
//               tickLine={false}
//               minTickGap={30}
//             />

//             <YAxis
//               domain={[minPrice - padding, maxPrice + padding]}
//               tick={{ fontSize: 10, fill: '#9ca3af' }}
//               axisLine={false}
//               tickLine={false}
//               width={0}
//             />

//             <Tooltip
//               content={({ active, payload, label }: any) => {
//                 if (active && payload && payload.length) {
//                   const value = payload[0].value as number;
//                   return (
//                     <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1.5 shadow-lg border border-gray-800">
//  <div className="text-gray-400 mb-0.5">
//                         {formatDateLabel(label as string)}
//                       </div>
//                       <div className="font-semibold">
//                         {Number(value).toLocaleString(undefined, {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </div>
//                     </div>
//                   );
//                 }
//                 return null;
//               }}
//             />

//             <Area
//               type="monotone"
//               dataKey="price"
//               stroke={strokeColor}
//               strokeWidth={2}
//               fill="url(#mseGradient)"
//               dot={false}
//               activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
//             />
//           </AreaChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }