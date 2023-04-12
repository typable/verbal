import { React } from "../deps.ts";
import { Callback, ChangeEvent, SetState } from "../types.ts";

const { useState, useEffect } = React;

export type UseForm<T> = Form<T>;

export interface Form<T> {
  data: T,
  setData: SetState<T>,
  isModified: boolean,
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (event: SubmitEvent) => void,
  doReset: () => void,
}

export default function useForm<T extends Record<string, unknown>>(initial: T, onSubmit?: Callback<void>, onReset?: Callback<void>): UseForm<T> {
  const [data, setData] = useState(initial);
  const [isModified, setIsModified] = useState(false);
  
  useEffect(() => {
    let isModified = false;
    for(const [key, value] of Object.entries(data)) {
      if(initial[key] !== value) {
        isModified = true;
        break;
      }
    }
    setIsModified(isModified);
  }, [data]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setData({
      ...data,
      [event.target.name]: event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value
    });
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    onSubmit?.();
    setIsModified(false);
  }
  
  function doReset() {
    setData(initial);
    onReset?.();
  }

  return { data, setData, isModified, handleChange, handleSubmit, doReset };
}
