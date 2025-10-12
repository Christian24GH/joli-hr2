import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

import { AlertDescription } from "@/components/ui/alert"
import { YearCombobox } from "@/components/ui/dropdown-year";

import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner";
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios";
import { logisticsII as FleetApi } from "../../api/logisticsII"

export function RegisterDialog({}){
    const { register,
          handleSubmit,
          control,
          reset,
          formState: { errors, isSubmitting }
        } = useForm({})
    const [ open, setOpen ] = useState(false)

    const onSubmit = async (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key !== "image") {
                formData.append(key, value ?? "");
            }
        });

        if (data.image?.[0]) {
            formData.append("image", data.image[0]);
        }

        try {
            const response = await FleetApi.vehicles.register(formData,{
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status === 200) {
                setOpen(false);
                reset();
                toast.success(response.data.message ?? "Vehicle registered successfully!", {
                    position: "top-center",
                });
            }
        } catch (error) {
            console.log(error)
            if (error.response?.status === 422) {
                toast.error(error.response.data.message || "Validation error", {
                    position: "top-center",
                });
            } else if (error.response?.status === 500) {
                toast.error("Server Error", { position: "top-center" });
            } else {
                toast.error("Network error", { position: "top-center" });
            }
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)}>Register</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader className="mb-3">
                    <DialogTitle>Register Vehicle</DialogTitle>
                    <DialogDescription>
                    Fill all the fields, click register when you're done.
                    </DialogDescription>
                </DialogHeader>

                {/* VIN */}
                <div className="flex flex-col gap-2 mb-3" >
                    <div className="flex items-center justify-between">
                    <Label>Vehicle Identification Number (VIN)</Label>
                    {errors.vin && (
                        <AlertDescription className="text-red-500">{errors.vin.message}</AlertDescription>
                    )}
                    </div>
                    <Input
                    {...register("vin", {
                        required: "VIN is required!",
                        minLength: { value: 17, message: "VIN must contain 17 characters!" },
                        maxLength: { value: 17, message: "VIN must contain 17 characters!" },
                    })}
                    type="text"
                    className={errors.vin ? "border-red-500 focus-visible:ring-red-300" : ""}
                    />
                </div>

                <div className="flex gap-2 mb-3">
                    {/* Brand */}
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between">
                            <Label>Brand</Label>
                            {errors.make && (
                                <AlertDescription className="text-red-500">{errors.make.message}</AlertDescription>
                            )}
                        </div>
                        <Input
                            {...register("make", { required: "Brand is required!" })}
                            type="text"
                            className={errors.make ? "border-red-500 focus-visible:ring-red-300" : ""}
                            />
                        
                    </div>

                    {/* Model */}
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between">
                            <Label>Model</Label>
                            {errors.model && (
                                <AlertDescription className="text-red-500">{errors.model.message}</AlertDescription>
                            )}
                        </div>
                        <Input
                            {...register("model", { required: "Model is required!" })}
                            type="text"
                            className={errors.model ? "border-red-500 focus-visible:ring-red-300" : ""}
                            />
                        
                    </div>
                </div>
                {/* Year */}
                <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center justify-between">
                    <Label>Year</Label>
                    {errors.year && (
                        <AlertDescription className="text-red-500">{errors.year.message}</AlertDescription>
                    )}
                    </div>
                    <Controller
                        name="year"
                        control={control}
                        rules={{ required: "Year is required!" }}
                        render={({ field }) => (
                            <YearCombobox
                                startYear={1980}
                                value={field.value}
                                onChange={(y) => field.onChange(y)}
                                className={errors.year ? "border-red-500 focus-visible:ring-red-300" : ""}
                                />
                        )}
                    />
                </div>

                {/* Type */}
                <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center justify-between">
                    <Label>Type</Label>
                    {errors.type && (
                        <AlertDescription className="text-red-500">{errors.type.message}</AlertDescription>
                    )}
                    </div>
                   <Input {...register('type', {rules: { required: "Type is required!" }})}/>
                </div>
                        
                {/*
                <div className="flex gap-2">
                    //Acquisition Date 
                    <div className="flex flex-col gap-2 mb-3 !flex-1">
                        <div className="flex items-center justify-between">
                        <Label>Acquisition Date</Label>
                        {errors.acqdate && (
                            <AlertDescription className="text-red-500">{errors.acqdate.message}</AlertDescription>
                        )}
                        </div>
                        <Controller 
                            control={control} 
                            name="acqdate"
                            render={({field})=>(
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        className={errors.acqdate ? "border-red-500 focus-visible:ring-red-300 data-[empty=true]:text-muted-foreground justify-start text-left font-normal" : "data-[empty=true]:text-muted-foreground justify-start text-left font-normal"}
                                        variant="outline"
                                        data-empty={!watch('acqdate')}
                                        >
                                    {watch('acqdate') ? format(watch('acqdate'), "PPP") : <span>{"Pick a Date(Optional)"}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" captionLayout="dropdown" selected={field.value} onSelect={(d)=>field.onChange(d)}/>
                                </PopoverContent>
                            </Popover>
                            )}
                        />
                    </div>
                </div>
                */}
                {/* Height & Width in meters */}
                <div className="flex gap-2 mb-3">
                    <div className="flex flex-col gap-2 flex-1">
                        <Label>Height (m)</Label>
                        <Input
                        {...register("height", {
                            required: "Height is required!",
                            valueAsNumber: true,
                            min: { value: 0.5, message: "Too small" },
                            max: { value: 10, message: "Too large" },
                        })}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1.75"
                        className={errors.height ? "border-red-500 focus-visible:ring-red-300" : ""}
                        />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <Label>Width (m)</Label>
                        <Input
                        {...register("width", {
                            required: "Width is required!",
                            valueAsNumber: true,
                            min: { value: 0.5, message: "Too small" },
                            max: { value: 5, message: "Too large" },
                        })}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1.85"
                        className={errors.width ? "border-red-500 focus-visible:ring-red-300" : ""}
                        />
                    </div>
                </div>
                {/* Capacity & Seats */}
                <div className="flex gap-2 mb-3">
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between">
                        <Label>Capacity (kg)</Label>
                        {errors.capacity && (
                            <AlertDescription className="text-red-500">{errors.capacity.message}</AlertDescription>
                        )}
                        </div>
                        <Input
                            {...register("capacity", { required: "Capacity is required!" })}
                            type="number"
                            placeholder="Weight in kg"
                            className={errors.capacity ? "border-red-500 focus-visible:ring-red-300" : ""}
                        />
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between">
                        <Label>Seats</Label>
                        {errors.seats && (
                            <AlertDescription className="text-red-500">{errors.seats.message}</AlertDescription>
                        )}
                        </div>
                        <Input
                        {...register("seats", { required: "Seats is required!" })}
                            type="number"
                            placeholder="Number of passenger seats"
                            className={errors.seats ? "border-red-500 focus-visible:ring-red-300" : ""}
                        />
                    </div>
                    </div>

                {/* Fuel Efficiency */}
                <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center justify-between">
                        <Label>Fuel Efficiency (L/100km)</Label>
                        {errors.fuel_efficiency && (
                        <AlertDescription className="text-red-500">{errors.fuel_efficiency.message}</AlertDescription>
                        )}
                    </div>
                    <Input
                        {...register("fuel_efficiency", { required: "Fuel efficiency is required!" })}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2"
                        className={errors.fuel_efficiency ? "border-red-500 focus-visible:ring-red-300" : ""}
                    />
                </div>
                
                {/* Vehicle Image */}
                <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center justify-between">
                        <Label>Vehicle Image (optional)</Label>
                        {errors.image && (
                        <AlertDescription className="text-red-500">{errors.image.message}</AlertDescription>
                        )}
                    </div>
                    <Input
                        {...register("image")}
                        type="file"
                        accept="image/*"
                        className={errors.image ? "border-red-500 focus-visible:ring-red-300" : ""}
                    />
                </div>

                {/* Footer */}

                <DialogFooter>
                    <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Submitting..." : "Register"}
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}