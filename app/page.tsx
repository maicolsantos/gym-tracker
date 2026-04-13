import { Calendar } from "@/components/calendar"

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Calendar />
      </div>
    </main>
  )
}
