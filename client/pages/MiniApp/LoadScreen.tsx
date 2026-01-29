import { Spinner } from "@/components/ui/spinner"

export default function LoadScreen(){
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-3">
            <Spinner className="size-8"/>
            <span>Загрузка</span>
        </div>
    </div>
}