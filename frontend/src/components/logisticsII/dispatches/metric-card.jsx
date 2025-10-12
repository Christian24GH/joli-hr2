import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

/**
 * IMPLIMENTS LIVE DISPATCH DATA
 */
export default function MetricsCards({ cost, distance, duration }) {
  return (
    <div className="flex w-full gap-2">
      <Card className="flex-1 rounded-md bg-card/80 backdrop-blur-md">
        <CardHeader className="flex-grow">
          <CardTitle>Dispatch spend</CardTitle>
          <CardDescription>Live dispatch cost</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl text-gray-500">Philippine Peso</Label>
          <Label className="text-3xl font-semibold">{cost ?? "N/A"}</Label>
        </CardContent>
      </Card>
      <Card className="flex-1 rounded-md bg-card/80 backdrop-blur-md">
        <CardHeader className="flex-grow">
          <CardTitle>Travel Distance</CardTitle>
          <CardDescription>Live distance taken</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl text-gray-500">Kilometer</Label>
          <Label className="text-3xl font-semibold">{distance ?? "N/A"}</Label>
        </CardContent>
      </Card>
      <Card className="flex-1 rounded-md bg-card/80 backdrop-blur-md">
        <CardHeader className="flex-grow">
          <CardTitle>Travel Duration</CardTitle>
          <CardDescription>Live duration taken</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl text-gray-500">Minutes</Label>
          <Label className="text-3xl font-semibold">{duration ?? "N/A"}</Label>
        </CardContent>
      </Card>
    </div>
  );
}
