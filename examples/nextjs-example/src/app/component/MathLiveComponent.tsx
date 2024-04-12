"use client";

import React, { useLayoutEffect, useRef } from "react";
import { MathfieldElement } from "mathlive-tera";
import classNames from "classnames";

type Props = {
  value?: string
  className?: string
  onChange?: (value: string) => void
  autoFocus?: boolean
}

export default function MathLiveComponent({ value, className, onChange, autoFocus }: Props) {
  // const [value, setValue] = useState('\\sqrt{x}')

  const mf = useRef<any>();
  useLayoutEffect(() => {
    MathfieldElement.soundsDirectory = null;
    MathfieldElement.plonkSound = null;
    MathfieldElement.fontsDirectory = "";
    setTimeout(() => {
      if (autoFocus) {
        mf.current.focus();
      }
    }, 200);
  }, [autoFocus]);

  let style = classNames("p-4 border rounded-md w-full text-lg shadow-sm placeholder:text-muted-foreground focus-within:outline-none focus-within:bg-background focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50");

  return <>
    <math-field
      suppressHydrationWarning={true}
      class={style}
      ref={mf}
      onInput={(evt: any) => {
        if (onChange) {
          onChange(evt.target.value);
        }
      }}>
      {value}
    </math-field>
  </>;
}

