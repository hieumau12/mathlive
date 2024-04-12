'use client'
import classNames from "classnames";
import { MathfieldElementAttributes } from "mathlive-tera";
import { DOMAttributes } from "react";
import MathLiveComponent from "@/app/component/MathLiveComponent";

export default function Home() {
  let style = classNames('p-4 border rounded-md w-full text-lg shadow-sm placeholder:text-muted-foreground focus-within:outline-none focus-within:bg-background focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50')

  return (
    <div className={"grid place-content-center h-screen"}>
      <div>
        <MathLiveComponent value={'12341234'}/>

      </div>
    </div>
  );
}


declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["math-field"]: Partial<MathfieldElementAttributes & DOMAttributes<MathfieldElementAttributes>>;
    }
  }
}
