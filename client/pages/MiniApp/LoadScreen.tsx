import { Spinner } from "@/components/ui/spinner"

export default function LoadScreen(){
    return <div className="w-full h-full flex items-center justify-center">
        <div><Spinner data-icon="inline-start" className="size-8"/>Загрузка</div>
    </div>
}