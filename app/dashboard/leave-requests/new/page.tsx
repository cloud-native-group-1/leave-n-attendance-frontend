"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Paperclip, X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { getTeamMembers, type TeamMember } from "@/lib/services/team"
import { type LeaveType, getLeaveTypes } from "@/lib/services/leave-type"
import { createLeaveRequest, uploadLeaveAttachment } from "@/lib/services/leave-request"
import { getMyLeaveBalance, type LeaveBalanceItem } from "@/lib/services/leave-balance"
import { getCurrentUser, type UserProfile } from "@/lib/services/user"
import { 
  getHolidaysForYear, 
  getWeekendAndHolidayDatesInRange, 
  type Holiday 
} from "@/lib/services/holiday"

export default function NewLeaveRequestPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [weekendHolidayDates, setWeekendHolidayDates] = useState<Array<{ date: Date; isWeekend: boolean; isHoliday: boolean; holidayName?: string }>>([])

  // 取得公假的 id
  const publicLeaveType = leaveTypes.find(type => type.name === "公假")
  const publicLeaveTypeId = publicLeaveType?.id?.toString()

  // files 狀態與 form 的 attachment 欄位同步
  useEffect(() => {
    form.setValue("attachment", files, { shouldValidate: true })
  }, [files])

  const formSchema = z.object({
    leaveType: z.string({
      required_error: "請選擇假別",
    }),
    dateRange: z.object({
      from: z.date({
        required_error: "請選擇開始日期",
      }),
      to: z.date({
        required_error: "請選擇結束日期",
      }),
    }),
    reason: z.string().optional(),
    proxyPerson: z.string({
      required_error: "請選擇代理人",
    }),
    attachment: z.array(z.instanceof(File)).optional(),
  }).superRefine((data, ctx) => {
    if (
      data.leaveType === publicLeaveTypeId &&
      (!Array.isArray(data.attachment) || data.attachment.length === 0)
    ) {
      ctx.addIssue({
        path: ["attachment"],
        code: z.ZodIssueCode.custom,
        message: "申請公假時，附件為必填",
      })
    }

    // 檢查日期範圍是否包含週末或假日
    if (data.dateRange.from && data.dateRange.to) {
      const weekendHolidaysInRange = getWeekendAndHolidayDatesInRange(
        data.dateRange.from,
        data.dateRange.to,
        holidays
      )
      
      if (weekendHolidaysInRange.length > 0) {
        ctx.addIssue({
          path: ["dateRange"],
          code: z.ZodIssueCode.custom,
          message: "請假期間不可包含週末或國定假日",
        })
      }
    }
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
    mode: "onChange",
  })

  // 檢查表單是否已完整填寫
  const isFormValid = form.formState.isValid && weekendHolidayDates.length === 0

  // 獲取未填寫的必填欄位
  const getMissingFields = () => {
    const missingFields = []
    if (!form.getValues("leaveType")) missingFields.push("假別")
    if (!form.getValues("dateRange.from")) missingFields.push("開始日期")
    if (!form.getValues("dateRange.to")) missingFields.push("結束日期")
    if (!form.getValues("proxyPerson")) missingFields.push("代理人")
    if (weekendHolidayDates.length > 0) missingFields.push("日期範圍包含週末或假日")
    return missingFields
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentYear = new Date().getFullYear()
        const nextYear = currentYear + 1
        
        const [types, members, balance, user, currentYearHolidays, nextYearHolidays] = await Promise.all([
          getLeaveTypes(),
          getTeamMembers(),
          getMyLeaveBalance(),
          getCurrentUser(),
          getHolidaysForYear(currentYear),
          getHolidaysForYear(nextYear),
        ])
        
        setLeaveTypes(types)
        setTeamMembers(members)
        setLeaveBalances(balance.balances)
        setCurrentUser(user)
        setHolidays([...currentYearHolidays, ...nextYearHolidays])
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error("載入資料失敗", {
          description: error instanceof Error ? error.message : "發生未知錯誤",
        })
      }
    }
    fetchData()
  }, [])

  // 監聽日期範圍變化，更新週末假日提示
  useEffect(() => {
    const dateRange = form.watch("dateRange")
    if (dateRange?.from && dateRange?.to && holidays.length > 0) {
      const weekendHolidaysInRange = getWeekendAndHolidayDatesInRange(
        dateRange.from,
        dateRange.to,
        holidays
      )
      setWeekendHolidayDates(weekendHolidaysInRange)
    } else {
      setWeekendHolidayDates([])
    }
  }, [form.watch("dateRange"), holidays])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // 公假時附件必填的保險檢查
    if (
      values.leaveType === publicLeaveTypeId &&
      (!files || files.length === 0)
    ) {
      form.setError("attachment", { type: "manual", message: "申請公假時，附件為必填" })
      setIsSubmitting(false)
      return
    }

    try {
      setIsSubmitting(true)
      const data = {
        leave_type_id: parseInt(values.leaveType),
        start_date: format(values.dateRange.from, 'yyyy-MM-dd'),
        end_date: format(values.dateRange.to, 'yyyy-MM-dd'),
        reason: values.reason || "",
        proxy_user_id: parseInt(values.proxyPerson),
      }

      const leaveRequest = await createLeaveRequest(data)

      // Upload attachments if any files are selected
      if (files.length > 0) {
        try {
          setIsUploadingFiles(true)
          const uploadPromises = files.map((file: File) => 
            uploadLeaveAttachment(leaveRequest.id, file)
          )
          await Promise.all(uploadPromises)
          
          toast.success("請假申請已送出", {
            description: `您的請假申請已成功送出，並上傳了 ${files.length} 個附件。`,
          })
        } catch (uploadError) {
          console.error('Failed to upload some attachments:', uploadError)
          toast.success("請假申請已送出", {
            description: "請假申請已成功送出，但部分附件上傳失敗。",
          })
        } finally {
          setIsUploadingFiles(false)
        }
      } else {
        toast.success("請假申請已送出", {
          description: "您的請假申請已成功送出。",
        })
      }

      router.push("/dashboard/leave-requests")
    } catch (error) {
      console.error('Failed to submit leave request:', error)
      toast.error("送出申請失敗", {
        description: "請稍後再試一次",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // File validation
      const maxFileSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ]
      
      const validFiles: File[] = []
      const invalidFiles: string[] = []
      
      newFiles.forEach(file => {
        if (file.size > maxFileSize) {
          invalidFiles.push(`${file.name} (檔案過大，超過 10MB)`)
        } else if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(`${file.name} (不支援的檔案格式)`)
        } else {
          validFiles.push(file)
        }
      })
      
      if (invalidFiles.length > 0) {
        toast.error("部分檔案無法上傳", {
          description: invalidFiles.join(', ')
        })
      }
      
      if (validFiles.length > 0) {
        setFiles((prev) => {
          const updated = [...prev, ...validFiles]
          form.setValue("attachment", updated, { shouldValidate: true })
          return updated
        })
      }
      
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      form.setValue("attachment", updated, { shouldValidate: true })
      return updated
    })
  }

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 處理送出按鈕點擊
  const handleSubmitClick = () => {
    if (!isFormValid) {
      // 觸發所有欄位的驗證
      form.trigger()
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">請假申請</h1>
        <p className="text-muted-foreground">請填寫以下表單以提交新的請假申請。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>請假申請表</CardTitle>
          <CardDescription>請提供所有必要的請假資訊。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>假別</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        if (!value) {
                          form.trigger("leaveType")
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇假別" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes
                          .filter(type => {
                            const balance = leaveBalances.find(b => b.leave_type.id === type.id)
                            return balance && balance.remaining_days > 0
                          })
                          .map((type) => {
                            const balance = leaveBalances.find(b => b.leave_type.id === type.id)
                            return (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name} (剩餘 {balance?.remaining_days} 天)
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                    <FormDescription>請選擇您要申請的假別類型。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>請假期間</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "yyyy/MM/dd")} - {format(field.value.to, "yyyy/MM/dd")}
                                </>
                              ) : (
                                format(field.value.from, "yyyy/MM/dd")
                              )
                            ) : (
                              <span>選擇日期範圍</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="range" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    
                    {/* 週末假日警告提示 */}
                    {weekendHolidayDates.length > 0 && (
                      <Alert variant="warning" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-medium">選擇的日期範圍包含以下週末或國定假日：</p>
                            <ul className="text-sm space-y-1">
                              {weekendHolidayDates.map((item, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span>• {format(item.date, "yyyy/MM/dd")}</span>
                                  <span className="text-muted-foreground">
                                    ({item.isWeekend ? '週末' : ''}{item.isWeekend && item.isHoliday ? '、' : ''}{item.isHoliday ? item.holidayName : ''})
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-sm text-muted-foreground mt-2">
                              請重新選擇不包含週末或國定假日的日期範圍。
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <FormDescription>請選擇請假的起始與結束日期。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>請假事由</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="請說明請假原因"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>請簡要說明您的請假原因。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proxyPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>代理人</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        if (!value) {
                          form.trigger("proxyPerson")
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇代理人" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!currentUser ? (
                          <SelectItem value="loading" disabled>
                            載入中...
                          </SelectItem>
                        ) : teamMembers
                          .filter(person => person.id !== currentUser.id)
                          .map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.last_name}{person.first_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      請選擇在您請假期間可以處理您工作的同事。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>附件</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            onChange={handleFileChange} 
                            multiple 
                            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("file-upload")?.click()}
                            disabled={isSubmitting}
                          >
                            <Paperclip className="mr-2 h-4 w-4" />
                            上傳附件
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            支援圖片、PDF、Word、Excel、文字檔案，單檔最大 10MB
                          </span>
                        </div>

                        {files.length > 0 && (
                          <div className="space-y-2">
                            {files.map((file, index) => (
                              <div key={`file-${index}`} className="flex items-center justify-between rounded-md border p-3 bg-muted/50">
                                <div className="flex items-center gap-3 text-sm min-w-0 flex-1">
                                  <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{file.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeFile(index)}
                                  className="ml-2 flex-shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      上傳相關文件（公假申請必須附上證明文件）。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/leave-requests")}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid}
                  className={!isFormValid ? "opacity-50" : ""}
                  onClick={handleSubmitClick}
                >
                  {isSubmitting ? (
                    isUploadingFiles ? "上傳附件中..." : "送出中..."
                  ) : (
                    "送出申請"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
