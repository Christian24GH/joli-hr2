import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  total: {
    label: "Reservations",
    color: "hsl(var(--chart-1))",
  },
}

export default function ReservationTrendChart({ data }) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={100}
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--vivid-neon-pink)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--vivid-indigo)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>

        <Area
          dataKey="total"
          type="natural"
          fill="url(#fillTotal)"
          fillOpacity={0.4}
          stroke="var(--vivid-neon-pink)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
