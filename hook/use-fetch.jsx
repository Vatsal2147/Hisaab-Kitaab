import { useState } from "react";
import { toast } from "sonner";
//custom hook bana rahe hai
//create-account-drawer
//instead of every component having to manage the entire async lifecycle, you put that logic into one reusable hook.
//for different states we are storing, like loading and error and creating the user ID
const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try{
        const response = await cb(...args);
        setData(response);
        setError(null);
    } catch(error){
            setError(error);
            toast.error(error.message);
    } finally{
        setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fn,
    setData,
  };
};

export default useFetch;
