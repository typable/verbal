import { React } from '../deps.ts';
import { Ref } from '../types.ts';

const { useRef, useEffect } = React;

export type UseInput<T> = (initial: T) => Ref<T>;

export default function useInput<T>(initial: T): UseInput<T> {
  const ref = useRef(null);

  useEffect(() => {
    ref.current.value = initial;
  }, [initial]);

  return ref;
}
