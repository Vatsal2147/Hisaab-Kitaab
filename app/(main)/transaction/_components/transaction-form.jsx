"use client";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import CreateAccountDrawer from "@/components/ui/create-account-drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hook/use-fetch";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";

function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    //agar pehle se data hai toh usko lo nahi toh naya data banao.
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);
  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  const onSubmit = async (data) => {
    const formData = {
      ...data, //spread operator
      amount: parseFloat(data.amount), //overwrites the old amount
    };
    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully",
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode]);

  //for AI receipt scanning
  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if (scannedData.description) {
        setValue("description", scannedData.description);
      }
      if (scannedData.category) {
        setValue("category", scannedData.category);
      }
      toast.success("Receipt scanned successfully");
    }
  };

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* AI receipt scanner */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      <div className="space-y-2">
        <label>Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={type}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="EXPENSE"> Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              {/* i have changed the uppercase of these to lowercase in case there is an error, error yahi pe hogi */}
            </SelectGroup>
          </SelectContent>
        </Select>

        {errors.accountId && (
          <p className="text-sm text-red-500">{errors.accountId.message}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
          />

          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (₹{parseFloat(account.balance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <CreateAccountDrawer>
            <Button type="button" variant="outline" className="cursor-pointer w-full mt-2 bg-black text-white hover:bg-gray-600 hover:text-white">
              Create Account
            </Button>
          </CreateAccountDrawer>

          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            onValueChange={(value) => setValue("category", value)}
            defaultValue={getValues("category")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {" "}
                    {category.name}{" "}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {errors.type && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-full pl-3 text-left font-normal"
              />
            }
          >
            {date ? format(date, "PPP") : <span>Pick a Date</span>}

            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1 cursor-pointer" disabled={transactionLoading}>
          {transactionLoading ? (
            <>
              {" "}
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            `Update Transaction`
          ) : (
            `Create Transaction`
          )}
        </Button>
      </div>
    </form>
  );
}

export default AddTransactionForm;
