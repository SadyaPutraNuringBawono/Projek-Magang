"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

interface DateRange {
  start: string
  end: string
}

interface DatePickerProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

interface DatePickerProps {
  value: {
    start: string;
    end: string;
  };
  onChange: (value: { start: string; end: string }) => void;
  className?: string;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selecting, setSelecting] = React.useState<"start" | "end">("start")
  const [tempRange, setTempRange] = React.useState<DateRange>(value)

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const daysOfWeek = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const previousMonth = new Date(year, month, 0)
    const daysInPreviousMonth = previousMonth.getDate()

    const days = []

    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPreviousMonth - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, daysInPreviousMonth - i),
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i),
      })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i),
      })
    }

    return days
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDateSelect = (fullDate: Date) => {
    const formattedDate = format(fullDate, "yyyy-MM-dd")

    if (selecting === "start") {
      setTempRange({ ...tempRange, start: formattedDate })
      setSelecting("end")
    } else {

      if (fullDate < parseISO(tempRange.start)) {
        setTempRange({ start: formattedDate, end: tempRange.start })
      } else {
        setTempRange({ ...tempRange, end: formattedDate })
      }

      onChange({
        start: selecting === "end" && fullDate < parseISO(tempRange.start) ? formattedDate : tempRange.start,
        end: selecting === "end" && fullDate >= parseISO(tempRange.start) ? formattedDate : tempRange.start,
      })
      setSelecting("start")
      setIsOpen(false)
    }
  }

  const displayDateRange = `${format(parseISO(value.start), "d MMMM yyyy", { locale: id })} - ${format(parseISO(value.end), "d MMMM yyyy", { locale: id })}`

  return (
    <div className="relative">
      <Button variant="outline" className="flex w-[280px] items-center gap-2" onClick={() => setIsOpen(!isOpen)}>
        <Calendar className="h-4 w-4" />
        {displayDateRange}
        <ChevronLeft className={`ml-auto h-4 w-4 transition-transform ${isOpen ? "rotate-90" : "-rotate-90"}`} />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-md border bg-white p-4 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="p-1 hover:text-gray-600" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">{months[currentMonth.getMonth()]}</span>
              <button className="p-1 hover:text-gray-600" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-600">{currentMonth.getFullYear()}</span>
          </div>

          <div className="mb-2 text-center text-xs text-gray-500">
            {selecting === "start" ? "Pilih tanggal mulai" : "Pilih tanggal akhir"}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="p-1 text-xs font-medium">
                {day}
              </div>
            ))}
            {getDaysInMonth(currentMonth).map((day, index) => {
              const dateStr = format(day.fullDate, "yyyy-MM-dd")
              const isStartDate = dateStr === tempRange.start
              const isEndDate = dateStr === tempRange.end
              const isInRange =
                day.fullDate >= parseISO(tempRange.start) &&
                day.fullDate <= parseISO(tempRange.end) &&
                tempRange.start !== tempRange.end

              return (
                <button
                  key={index}
                  className={`p-1 text-sm hover:bg-gray-100 ${
                    !day.isCurrentMonth ? "text-gray-400" : ""
                  } ${isStartDate ? "bg-green-600 text-white hover:bg-green-700" : ""}
                  ${isEndDate ? "bg-green-600 text-white hover:bg-green-700" : ""}
                  ${isInRange && !isStartDate && !isEndDate ? "bg-green-100" : ""}
                  `}
                  onClick={() => day.isCurrentMonth && handleDateSelect(day.fullDate)}
                >
                  {day.date}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

