import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import React from "react";
import AddTransactionForm from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

async function AddTransactionPage({ searchParams }) {
  const accounts = await getUserAccounts();

  const editId = (await searchParams)?.edit; //this is for routing, so searchParams sends us the endpoint of the route, for exmaple edit=?id so it sends us the ID
  let initalData = null;
  if(editId){
    const transaction = await getTransaction(editId);
    initalData = transaction;
  }
  

  return (
    <div className="max-w-3xl mx-auto px-5">
      <h1 className="text-5xl gradient-title mb-8 ">{editId?"Edit":"Create"} Transaction</h1>

      <AddTransactionForm accounts={accounts} categories={defaultCategories} editMode={!!editId} 
      initialData = {initalData}  />
    </div>
  );
}

export default AddTransactionPage;
