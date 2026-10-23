"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColor } from "@/lib/categories";
import { formatINR } from "@/lib/format";
import type { CategorySlice } from "@/types";

export function ExpenseDonut({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.amount, 0);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((slice) => (
                <Cell
                  key={slice.category}
                  fill={categoryColor(slice.category)}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatINR(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Spend
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {formatINR(total)}
          </span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {data.map((slice) => (
          <div key={slice.category} className="flex items-center gap-2.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: categoryColor(slice.category) }}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
              {slice.category}
            </span>
            <span className="text-xs font-medium text-slate-900">
              {formatINR(slice.amount)}
            </span>
            <span className="w-9 text-right text-[10px] text-slate-400">
              {slice.share.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
