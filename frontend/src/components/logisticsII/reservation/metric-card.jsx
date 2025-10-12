import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function MetricsCards({ totalCost, totalDistance, totalDuration }) {
  return (
    <div className="flex w-full gap-2">
      <Card className="flex-1 rounded-md bg-card/80 backdrop-blur-md">
        <CardHeader className="flex-grow">
          <CardTitle>Estimated Cost</CardTitle>
          <CardDescription>Pre-trip estimated cost</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl text-gray-500">Philippine Peso</Label>
          <Label className="text-3xl font-semibold">{totalCost ?? "N/A"}</Label>
        </CardContent>
      </Card>
      <Card className="flex-1 rounded-md bg-card/80 backdrop-blur-md">
        <CardHeader className="flex-grow">
          <CardTitle>Travel Distance</CardTitle>
          <CardDescription>Total distance</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl text-gray-500">Kilometer</Label>
          <Label className="text-3xl font-semibold">{totalDistance ?? "N/A"}</Label>
        </CardContent>
      </Card>
      <Card className="flex-1 rounded-md bg-card/80 backdrop-blur-md">
        <CardHeader className="flex-grow">
          <CardTitle>Travel Duration</CardTitle>
          <CardDescription>Total duration</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl text-gray-500">Minutes</Label>
          <Label className="text-3xl font-semibold">{totalDuration ?? "N/A"}</Label>
        </CardContent>
      </Card>
    </div>
  );
}
