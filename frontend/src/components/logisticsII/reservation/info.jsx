import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ReservationInfo({ record, onApprove, onReject, isSubmitting, setIsSubmitting }) {
  return (
    <Card className="flex-1 py-4 rounded-md bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="font-bold text-2xl tracking-tight">
            RESERVATION <span className="text-primary">{record?.batch_number}</span>
          </span>
          {record?.status === "Pending" && record?.assignments?.length > 0 ? (
            <div className="flex gap-2 items-center h-full">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isSubmitting} size="sm">
                    {isSubmitting ? "Submitting" : "Approve"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Reservation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this reservation?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isSubmitting}
                      onClick={() => onApprove(setIsSubmitting)}
                    >
                      {isSubmitting ? "Submitting" : "Approve"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSubmitting} size="sm">
                    {isSubmitting ? "Submitting" : "Reject"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Reservation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this reservation?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isSubmitting}
                      onClick={() => onReject(setIsSubmitting)}
                    >
                      {isSubmitting ? "Submitting" : "Reject"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Badge className={`rounded-full py-2 px-3 flex items-center text-base font-semibold ${record?.status === 'Rejected' ? 'bg-destructive' : record?.status === 'Confirmed' ? 'bg-green-700' : ''}`}>
              {record?.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground font-semibold">Requested By:</Label>
            <span className="font-bold text-primary">{record?.requestor_uuid}</span>
          </div>
        </div>

        <div className="my-4 w-full">
          <Label className="font-semibold text-lg">Date and Time</Label>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground font-medium">Start:</Label>
              <span className="font-bold">{record?.start_date ? format(new Date(record.start_date), 'PPp') : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground font-medium">End:</Label>
              <span className="font-bold">{record?.end_date ? format(new Date(record.end_date), 'PPp') : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="my-4 w-full">
          <Label className="font-semibold text-lg">Trip Routes</Label>
          <Separator className="my-2" />
          <div className="flex flex-col gap-3 w-full">
            {record?.trip_routes?.length > 0 ? (
              record.trip_routes.map((r, idx) => (
                <div key={r.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground font-medium">
                      {idx === 0
                        ? "Start"
                        : idx === record.trip_routes.length - 1
                        ? "End"
                        : `Stop ${idx}`}
                    </Label>
                    <span className="font-bold text-primary">{r.full_address}</span>
                  </div>
                </div>
              ))
            ) : (
              <Label className="text-gray-500">No trip routes available</Label>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
