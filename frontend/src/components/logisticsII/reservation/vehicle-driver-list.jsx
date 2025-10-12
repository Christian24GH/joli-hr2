import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DriverSelect } from "@/components/logisticsII/inputs/driver-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";

export default function VehicleDriverList({ record, assignments, onAssign }) {
  return (
    <Card className="w-full bg-card/80 backdrop-blur-md rounded-md">
      <CardHeader>
        <CardTitle>
          Vehicles and Drivers
        </CardTitle>
        <CardDescription>Please assign drivers to the vehicles below.</CardDescription>
      </CardHeader>
      <CardContent>
        {record?.assignments?.map((d, i) => (
          <div key={i} className="flex justify-end h-48 lg:max-w-xl border">
            <div className="w-full h-full flex-1">
              <img
                src={d.image_url}
                className="w-full h-full object-cover rounded-md"
                alt="Vehicle"
                loading="lazy"
              />
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-1 flex-col p-2 gap-2">
              <div className="flex justify-between">
                <h3 className="font-semibold">Type: {d.type}</h3>
                <Badge>{d.vehicle_status}</Badge>
              </div>
              <h3 className="font-semibold">Capacity: {d.capacity}</h3>
              {record.status === "Rejected" ? null : d.driver_name ? (
                <h3 className="font-semibold">Driver: {d.driver_name}</h3>
              ) : (
                <DriverSelect
                  assignments={assignments}
                  onSelect={(driver) => onAssign(d.vehicle_id, driver.uuid)}
                  defaultValue={d.driver_name}
                />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
