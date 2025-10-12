import { logisticsII as FleetApi, echoUpdateList } from "../../../api/logisticsII"
import { ChevronRightIcon, EyeIcon } from "lucide-react"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
 } from "@/components/ui/table"

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

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

import { AlertDescription } from '@/components/ui/alert'

import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useForm, Controller } from 'react-hook-form'
import { YearCombobox } from "../../ui/dropdown-year"
import { DatePicker } from "../inputs/date-picker"
import { Link } from "react-router"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useEchoPublic } from "@laravel/echo-react"

export function DriverInfo({driverInfo, loading}){
  
    return(
        <>
          <div className="w-full py-2 px-6 flex justify-between">
              <h2 className="text-2xl mb-0 font-medium">Driver Information</h2>
          </div>
          <Separator/>
          <div className="py-3 px-8" >
              <div className="grid gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  {loading ? 
                    (
                      <>
                        <Skeleton className="w-24 h-7"/>
                        <Skeleton className="w-full h-7"/>
                        <Skeleton className="w-full h-7"/>
                      </>
                    ) : (
                      <>
                        <h3 className="font-medium">Name</h3>
                        <h4 className="px-4">{driverInfo?.name}</h4>
                      </>
                    )
                  }
                </div>
              </div>
          </div>
        </>
    )
}

export function DispatchHistory({dispatches, loading}){
  return(
      <>
          <div className="w-full py-2 px-6 flex justify-between">
              <h2 className="text-2xl mb-0 font-medium">Dispatch History</h2>
          </div>
          <Separator/>
          <div className="py-3 px-8 min-h-24" >
              <div className="grid gap-3 mb-3">
                  <div className="flex flex-col gap-1">
                      {loading ? (
                        <>
                          <Skeleton className="w-24 h-7"/>
                          <Skeleton className="w-full h-7"/>
                          <Skeleton className="w-full h-7"/>
                        </>
                      ):
                        dispatches?.length > 0 ? (
                          <Table> 
                            <TableHeader>
                              <TableRow>
                                <TableHead>Dispatch</TableHead>
                                <TableHead>Batch Number</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dispatches?.map((item, index) => {
                                return(
                                  <TableRow key={`${item.id}-` + index}>
                                    <TableCell>
                                      <h4 className="px-4">{item?.uuid}</h4>
                                    </TableCell>
                                    <TableCell>
                                      <h4 className="px-4">{item?.batch_number}</h4>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={item?.status === "Completed" ? "default" : "destructive"} className="min-w-30">
                                        <h4 className="px-4 font-medium">{item?.status}</h4>
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Link to={`/logisticsII/dispatch/${item?.batch_number}`}>
                                        <Button>
                                          <ChevronRightIcon/>
                                        </Button>
                                      </Link>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="w-full">
                            <h3 className="text-center font-medium text-muted-foreground">No dispatches found</h3>
                          </div>
                        )
                      }
                  </div>
              </div>
          </div>
      </>
  )
}

export function ReportsHistory({reports, loading}){
  return(
      <>
          <div className="w-full py-2 px-6 flex justify-between">
              <h2 className="text-2xl mb-0 font-medium">Reports History</h2>
          </div>
          <Separator/>
          <div className="py-3 px-8 min-h-24">
              <div className="grid gap-3 mb-3">
                  <div className="flex flex-col gap-1">
                      {loading ? (
                        <>
                          <Skeleton className="w-24 h-7"/>
                          <Skeleton className="w-full h-7"/>
                          <Skeleton className="w-full h-7"/>
                        </>
                      ) :
                        reports?.length > 0 ? (
                          <Table className="table-fixed w-full">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/3">Report</TableHead>
                                <TableHead className="w-1/4">Batch Number</TableHead>
                                <TableHead className="w-1/4">Date</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reports?.map((item, index) => (
                                <TableRow key={`${item.id}-${index}`} className="group">
                                  <TableCell>
                                    <h4 className="px-4 truncate">{item?.uuid}</h4>
                                  </TableCell>
                                  <TableCell>
                                    <h4 className="px-4 truncate">{item?.batch_number}</h4>
                                  </TableCell>
                                  <TableCell>
                                    <h4 className="px-4">{item?.created_at}</h4>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Dialog>
                                      <DialogTrigger className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm">
                                          <EyeIcon />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Report {item?.uuid}</DialogTitle>
                                          <DialogDescription>
                                            Created at {item?.created_at}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="w-full">
                                          <p>{item?.message}</p>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                        ) : (
                          <div className="w-full">
                            <h3 className="text-center font-medium text-muted-foreground">No reports found</h3>
                          </div>
                        )
                      }
                  </div>
              </div>
          </div>
      </>
  )
}

export function SummarySection({ tDispatch, avgSpeed, reports, comRate, loading}){
    return(
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
            <Card className="rounded-md flex flex-col h-full">
                <CardHeader  className="flex-grow">
                    <CardTitle>Dispatches</CardTitle>
                    <CardDescription>Total driver dispatches</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-medium text-gray-500 text-md">Counts</p>
                    <h1 className="font-semibold text-3xl">{tDispatch ?? "N/A"}</h1>
                </CardContent>
            </Card>
            <Card className="rounded-md flex flex-col h-full">
                <CardHeader  className="flex-grow">
                    <CardTitle>Average Speed</CardTitle>
                    <CardDescription>Average driving speed</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-lg">Mph</p>
                    <p className="font-medium text-3xl">{avgSpeed ?? "N/A"}</p>
                </CardContent>
            </Card>
            <Card className="rounded-md flex flex-col h-full">
                <CardHeader  className="flex-grow">
                    <CardTitle>Accident Reports</CardTitle>
                    <CardDescription>Total accident report involving this driver</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-medium text-gray-500 text-md">Counts</p>
                    <h1 className="font-medium text-3xl">{reports ?? "N/A"}</h1>
                </CardContent>
            </Card>
            <Card className="rounded-md flex flex-col h-full">
                <CardHeader  className="flex-grow">
                    <CardTitle>Completion Rate</CardTitle>
                    <CardDescription>Percentage of which driver can accomplish the dispatch order</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-medium text-gray-500 text-md">Percentage</p>
                    <h1 className="font-medium text-3xl">{comRate ?? "N/A"}</h1>
                </CardContent>
            </Card>
        </div>
    )
}

export function DangerSection({ id, main_message, message, buttonTitle, type, status, loading}) {
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()


  const [ open, setOpen ] = useState(false)

  const formSubmit = async () => {
    const payload = {
      id: id,
      status: status
    }

    return 
    await FleetApi.vehicles.updateStatus()
      .then(response => {
        if(response.status == 200) toast.success('Request Sent')

        setOpen(false)
      })
      .catch(errors => {
        toast.error('Something went wrong')
        console.log(errors.message)
      })
  }

  return (
    <>
      <div className="w-full py-2 px-6 flex justify-between">
        <h2 className="text-2xl mb-0 font-medium">Danger Zone</h2>
      </div>
      <Separator/>
      <div className="flex w-full items-center justify-between px-6 py-4">
        
        <p className="text-sm leading-relaxed max-w-[70%]">
          {main_message}
        </p>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              className={
                (type === "danger" ? "bg-destructive " : "") +
                "ml-6 shrink-0 px-4 py-2"
              }
            >
              {buttonTitle}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent >
            <form onSubmit={handleSubmit(formSubmit)}>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be reverted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-3">
                {message}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Continue"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
