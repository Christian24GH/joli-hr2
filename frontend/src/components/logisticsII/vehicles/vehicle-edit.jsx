import axios from "axios"
import { logisticsII as FleetApi, echoUpdateList } from "../../../api/logisticsII"

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

import { AlertDescription } from '@/components/ui/alert'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useForm, Controller } from 'react-hook-form'
import { YearCombobox } from "../../ui/dropdown-year"
import { DatePicker } from "../inputs/date-picker"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useEchoPublic } from "@laravel/echo-react"

export function VehicleEdit({ item }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({})

  useEffect(() => {
    if (item) {
      reset({
        id: item.id,
        vin: item.vin,
        make: item.make,
        model: item.model,
        year: item.year,
        type: item.type,
        capacity: item.capacity,
        seats: item.seats,
        fuel_efficiency: item.fuel_efficiency,
        height: item.height,
        width: item.width,
        status: item.status,
      });
    }
  }, [item, reset]);

  const [editMode, setEditMode] = useState(false)

  const onSubmit = async (data) => {
    try {
      let response = await FleetApi.vehicles.update(data)
      //console.log(response)
      if (response.status === 200) {
        toast.success(response.data, { position: "top-center" })
        setEditMode(false)
      }
    } catch (error) {
      if (error.response?.status === 422) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Server Error")
      }
    }
  }

  const handleResetEdit = () => {
    reset({
      id: item.id,
      vin: item.vin,
      make: item.make,
      model: item.model,
      year: item.year,
      type: item.type,
      capacity: item.capacity,
      seats: item.seats,
      fuel_efficiency: item.fuel_efficiency,
      height: item.height,
      width: item.width,
      status: item.status,
    })
    setEditMode(false)
  }
  
  return (
    <>
      <div className="w-full py-2 px-6 flex justify-between">
          <h2 className="text-2xl mb-0 font-medium">Details</h2>
          {editMode ? (
            <div className="flex justify-between gap-2">
              <Button type="submit" form="vehicle_form" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              
              <Button variant="outline" type="button" onClick={handleResetEdit} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
      </div>
      <Separator/>
      <div className="py-3 px-8" >
        <form onSubmit={handleSubmit(onSubmit)} id="vehicle_form">
          <input {...register("id")} type="hidden" />

          <div className="grid gap-3 mb-3">

            {/* VIN */}
            <div className="flex flex-col gap-2">
              <Label>VIN</Label>
              <Input
                {...register("vin", {
                  required: "VIN is required",
                  minLength: { value: 17, message: "VIN must be 17 characters" },
                  maxLength: { value: 17, message: "VIN must be 17 characters" },
                })}
                type="text"
                disabled={!editMode}
              />
              {errors.vin && <p className="text-red-500">{errors.vin.message}</p>}
            </div>

            {/* Make & Model */}
            <div className="flex gap-2">
              <div className="flex flex-col flex-1">
                <Label>Brand</Label>
                <Input
                  {...register("make", { required: "Brand is required!" })}
                  type="text"
                  disabled={!editMode}
                />
                {errors.make && <p className="text-red-500">{errors.make.message}</p>}
              </div>

              <div className="flex flex-col flex-1">
                <Label>Model</Label>
                <Input
                  {...register("model", { required: "Model is required!" })}
                  type="text"
                  disabled={!editMode}
                />
                {errors.model && <p className="text-red-500">{errors.model.message}</p>}
              </div>
            </div>

            {/* Year */}
            <div>
              <Label>Year</Label>
              <Controller
                name="year"
                control={control}
                rules={{ required: "Year is required!" }}
                render={({ field }) => (
                  <YearCombobox
                    startYear={1990}
                    value={field.value?.toString()}
                    onChange={(y) => field.onChange(String(y))}
                    disabled={!editMode}
                  />
                )}
              />
              {errors.year && <p className="text-red-500">{errors.year.message}</p>}
            </div>

            {/*Type & Status*/}
            <div className="flex gap-2">
              <div className="flex flex-col flex-1">
                <Label>Type</Label>
                <Input {...register("type", { required: "Type is required!" })} disabled={!editMode} className="w-full"/>
                {errors.type && <p className="text-red-500">{errors.type.message}</p>}
              </div>
            </div> 

            {/* Capacity & Seats */}
            <div className="flex gap-2">
              <div className="flex flex-col flex-1">
                <Label>Capacity (kg)</Label>
                <Input {...register("capacity")} type="number" disabled={!editMode} />
                {errors.capacity && <p className="text-red-500">{errors.capacity.message}</p>}
              </div>
              <div className="flex flex-col flex-1">
                <Label>Seats</Label>
                <Input {...register("seats")} type="number" disabled={!editMode} />
                {errors.seats && <p className="text-red-500">{errors.seats.message}</p>}
              </div>
            </div>

            {/* Fuel Efficiency */}
            <div>
              <Label>Fuel Efficiency (L/100km)</Label>
              <Input {...register("fuel_efficiency", { required: "Required" })} type="number" step="0.01" disabled={!editMode} />
              {errors.fuel_efficiency && <p className="text-red-500">{errors.fuel_efficiency.message}</p>}
            </div>

            {/* Dimensions */}
            <div className="flex gap-2">
              <div className="flex flex-col flex-1">
                <Label>Height (m)</Label>
                <Input {...register("height")} type="number" step="0.01" disabled={!editMode} />
                {errors.height && <p className="text-red-500">{errors.height.message}</p>}
              </div>
              <div className="flex flex-col flex-1">
                <Label>Width (m)</Label>
                <Input {...register("width")} type="number" step="0.01" disabled={!editMode} />
                {errors.width && <p className="text-red-500">{errors.width.message}</p>}
              </div>
            </div>

          </div>
        </form>
    </div>
    </>
  )
}

export function EditImage({id}){
  const { register,
          handleSubmit,
          reset,
          formState: { errors, isSubmitting }} = useForm({})
  
  const formSubmit = async (data) => {
    if (!data.id) return
    if (!data.image || data.image.length === 0) {
      toast.error("Please select an image to upload");
      return;
    }

    const formData = new FormData();
    formData.append("id", data.id);
    formData.append("image", data.image[0]); // file input is an array

    console.log(data)
    try {
      const response = await FleetApi.vehicles.changeImage(formData)
      toast.success("Image uploaded successfully!");
      reset(); // reset the form after successful upload
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to upload image"
      );
    }
  }

  return(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload an Image</DialogTitle>
          <DialogDescription>
            Image size should be less than 2MB
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(formSubmit)}>
          <input {...register('id', {rules:{required:true}})} type="hidden" defaultValue={id}/>
          <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center justify-between">
                  <Label>Vehicle Image</Label>
                  {errors.image && (
                  <AlertDescription className="text-red-500">{errors.image.message}</AlertDescription>
                  )}
              </div>
              <Input
                  {...register("image", {rules:{required: "Image is required"}})}
                  type="file"
                  accept="image/*"
                  className={errors.image ? "border-red-500 focus-visible:ring-red-300" : ""}
              />
          </div>

          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Uploading": "Upload"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
};

export function UploadDocument({ id }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm()
 // adjust to your backend route

  const onSubmit = async (data) => {
    const formData = new FormData()
    formData.append("vehicle_id", id)
    formData.append("document_type", data.document_type)
    formData.append("document_name", data.document_name)
    if (data.provider) formData.append("provider", data.provider)
    if (data.issue_date) formData.append("issue_date", data.issue_date)
    if (data.expiry_date) formData.append("expiry_date", data.expiry_date)
    if (data.document_file?.[0]) formData.append("document_file", data.document_file[0])

    try {
      let res = await FleetApi.vdocuments.upload(formData)

      if (res.status === 200) {
        toast.success("Document uploaded successfully")
        reset()
      }
    } catch (err) {
      if (err.response?.status === 422) {
        toast.error(err.response.data.message || "Validation failed")
      } else {
        toast.error("Upload failed")
      }
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>
            Supported formats: PDF, DOC/DOCX, Images (jpg/png).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label className="mb-2">Document Type</Label>
            <Select onValueChange={(v) => setValue("document_type", v)} className="w-full">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Registration">Registration</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Inspection">Inspection</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.document_type && (
              <p className="text-red-500">{errors.document_type.message}</p>
            )}
          </div>

          <div className="w-full">
            <Label className="mb-2">Document Name</Label>
            <Input
              {...register("document_name", { required: "Document name is required" })}
              type="text"
            />
            {errors.document_name && (
              <p className="text-red-500">{errors.document_name.message}</p>
            )}
          </div>

          <div>
            <Label className="mb-2">Provider</Label>
            <Input {...register("provider")} type="text" />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-2">Issue Date</Label>
              <Controller
                name="issue_date"
                control={control}
                render={({ field }) => (
                  <DatePicker className="w-full"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date ? date.toISOString().split("T")[0] : "")}
                  />
                )}
              />
              {errors.issue_date && (
                <p className="text-red-500">{errors.issue_date.message}</p>
              )}
            </div>
            <div className="flex-1">
              <Label className="mb-2">Expiry Date</Label>
              <Controller
                name="expiry_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date ? date.toISOString().split("T")[0] : "")}
                  />
                )}
              />
              {errors.expiry_date && (
                <p className="text-red-500">{errors.expiry_date.message}</p>
              )}
            </div>
          </div>

          <div className="">
            <Label className="mb-2">Upload File</Label>
            <Input
              {...register("document_file", { required: "File is required" })}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            {errors.document_file && (
              <p className="text-red-500">{errors.document_file.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DocumentList({ id }){
  FleetApi.broadcast.config()

  const [ record, setRecord ] = useState()

  const fetchRecord = useCallback(()=>{
    if(!id) return;
    
    FleetApi.vdocuments.get({ vehicle_id: id, })
      .then(response=>{
        //console.log(response.data.documents)
        setRecord(response.data.documents)
      }).catch(error=>{
        console.log(error)
      })

  }, [id])

  useEffect(()=>{
    fetchRecord()
  }, [fetchRecord])

  useEchoPublic("vehicle_document_channel", "VehicleDocumentEvents", (e)=>{
    if (!e.record) return;

    setRecord(prev => {
      // Delete event
      if (e.action === "deleted") {
        return prev.filter(item => item.id !== e.record.id);
      }

      // Create / Update event
      return echoUpdateList(prev, e.record, "id");
    });
  })

  return(
    <>
      <div className="w-full py-2 px-6 flex justify-between">
          <h2 className="text-2xl mb-0 font-medium">Documents</h2>
          <UploadDocument id={id}/>
      </div>
      <Separator/>
      <div className="py-4 px-8">
        {!record || record.length === 0 ? (
            <div className="p-4">
                <p className="block text-center font-medium text-xl text-secondary-foreground">
                    No vehicle documents found.
                </p>
            </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" >
          {record.map((docu, i)=>{
            return (
                <AccordionItem value={`item-${i}`} key={i}>
                  <AccordionTrigger className="flex justify-between px-2 py-1">
                    <div className="flex gap-2">
                      <Badge>{docu.document_type}</Badge>
                      <h2 className="mb-0 font-medium">{docu.document_name}</h2>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-2 space-y-1">
                    <div className="flex">
                      <Label>Provider <Label className="font-normal">{docu.provider}</Label></Label>
                    </div>
                    <div className="flex">
                      <Label>Issue Date: <Label className="font-normal">{format(docu.issue_date, 'PPP')}</Label></Label>
                    </div>
                    <div className="flex">
                      <Label>Expiry Date: <Label className="font-normal">{format(docu.expiry_date, 'PPP')}</Label></Label>
                    </div>
                    <div className="flex">
                      <Label>File: </Label>
                      <a href={docu.document_url} target="_blank" className="px-4 decoration-1">{docu.document_file.replace('vehicle_documents/', '')}</a>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </>
  )
}

export function MaintenanceSection({ item }){
  return (
    <>
      <div className="w-full py-2 px-6 flex justify-between">
        <h2 className="text-2xl mb-0 font-medium">Maintenance Details</h2>
      </div>
      <Separator/>
      <div className="py-4 px-8">
        <h4>Last Maintenance Date: 9/24/2025</h4>
        <h4>Overall Status: Good</h4>
        <h4>Known Issues: None</h4>
        <h4>Verified By: Logistics 1</h4>
      </div>
    </>
  )

}
export function DangerSection({ id, main_message, message, buttonTitle, type, status }) {
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

    
    await FleetApi.vehicles.updateStatus(payload)
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
      <div className="flex w-full items-center justify-between px-6 py-4 rounded-md border">
        
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
                  {message}
                </AlertDialogDescription>
              </AlertDialogHeader>

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
