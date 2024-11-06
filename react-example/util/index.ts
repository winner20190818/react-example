import { useEffect, useMemo, useRef, useState } from "react";
import { dayjsManila } from "../format/date";

export { createGlobalApiData } from "./globalApiData";
export { useQueryApi } from "./useQueryApi";

export function useCountDownSeconds(props: { secondsEnd: number; callback?: () => void }) {
  const timestampAtEnter = useRef(Date.now());
  const [timestamp, timestampSet] = useState(Date.now());

  const secondsDiff = useMemo(() => {
    return dayjsManila(timestamp).diff(timestampAtEnter.current, "second");
  }, [timestamp]);
  const secondsCountDown = useMemo(() => {
    return props.secondsEnd - secondsDiff;
  }, [secondsDiff]);

  useEffect(() => {
    const interval = setInterval(() => {
      timestampSet(Date.now());
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (secondsCountDown < 0) {
      props.callback?.();
    }
  }, [secondsCountDown, props.callback]);

  return {
    secondsCountDown,
  };
}
