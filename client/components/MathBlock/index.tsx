import katex from 'katex';
import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';

export default function MathBlock({formula}:{formula:string}){
    const ref = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        if (!ref?.current) return;

        katex.render(formula,ref.current,{
            displayMode:true,
            throwOnError: false
        })
    },[formula])
    return <div ref={ref}></div>
}