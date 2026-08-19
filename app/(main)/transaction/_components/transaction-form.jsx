"use client"
import { createTransaction } from '@/actions/transaction';
import { transactionSchema } from '@/app/lib/schema';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useFetch from '@/hook/use-fetch';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';

function AddTransactionForm({accounts, categories}) {
   const {register, setValue, handleSubmit, formState:{errors}, watch, getValues, reset,} =useForm({
        resolver:zodResolver(transactionSchema),
        defaultValues:{
            type:"Expense",
            amount: "",
            description: "",
            accountId: accounts.find((ac)=>ac.isDefault)?.id,
            date: new Date(),
            isRecurring:false,
        },
    });

    const {
        loading: transactionLoading,
        fn: transactionFn,
        data: transactionResult,
    } = useFetch(createTransaction);
    const type = watch("type");
    const isRecurring = watch("isRecurring");
    const date = watch("date");
  return (
    <form className='space-y-6'>
        {/* AI receipt scanner */}

        <div className='space-y-2'>
            <label>Type</label>
            <Select onValueChange={(value)=>
                setValue("type", value)
            }
            defaultValue={type}>
  <SelectTrigger className="w-45">
    <SelectValue placeholder="Select Type" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      
        <SelectItem value='Expense'> Expense         
        </SelectItem>
        <SelectItem value="Income">Income</SelectItem> 
        {/* i have changed the uppercase of these to lowercase in case there is an error, error yahi pe hogi */}
     
    </SelectGroup>
  </SelectContent>
</Select>

{errors.type && (
    <p className='text-sm text-red-500'>{errors.type.message}</p>
)}
        </div>
      
    </form>
  )
}

export default AddTransactionForm;
