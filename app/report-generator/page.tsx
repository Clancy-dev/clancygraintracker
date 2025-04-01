"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  Check,
  ChevronRight,
  FileSpreadsheet,
  FilePieChart,
  FileBarChart2,
  FileStack,
  Maximize,
  Minimize,
  Palette,
  CalendarIcon,
} from "lucide-react"
import { format, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAppData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import type { DateRange } from "@/lib/types"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export default function ReportGenerator() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<number>(1)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [reportType, setReportType] = useState<string>("profit-loss")
  const [reportPeriod, setReportPeriod] = useState<string>("monthly")
  const [pageFormat, setPageFormat] = useState<string>("a4")
  const [orientation, setOrientation] = useState<string>("portrait")
  // Set black as the default color theme
  const [colorTheme, setColorTheme] = useState<string>("black")
  const [companyName, setCompanyName] = useState<string>("Grain Tracker Ltd")
  const [companyInfo, setCompanyInfo] = useState<string>("123 Farmer's Road, Kampala, Uganda")
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [includeCharts, setIncludeCharts] = useState<boolean>(true)
  const [includeSummary, setIncludeSummary] = useState<boolean>(true)
  const [includeFooter, setIncludeFooter] = useState<boolean>(true)
  const [footerText, setFooterText] = useState<string>("Confidential - For internal use only")
  const [showPreview, setShowPreview] = useState<boolean>(false)

  const { data } = useAppData()
  const { user } = useAuth()
  const reportRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1)
    } else {
      setShowPreview(true)
    }
  }

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1)
    } else {
      router.push("/reports-analytics")
    }
  }

  // Replace the entire handleExportReport function with this new implementation
  const handleExportReport = async () => {
    if (!reportRef.current) {
      toast.error("Report content not found")
      return
    }

    // Show loading toast
    toast.loading("Preparing PDF...", { id: "export-pdf" })

    try {
      // Get the report element
      const element = reportRef.current

      // Create a new jsPDF instance
      const pdf = new jsPDF({
        orientation: orientation === "landscape" ? "landscape" : "portrait",
        unit: "mm",
        format: pageFormat,
      })

      // Use html2canvas to capture the report as an image
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      // Convert the canvas to an image
      const imgData = canvas.toDataURL("image/png")

      // Calculate dimensions to fit the content properly
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Add the image to the PDF
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, (pdfWidth * imgHeight) / imgWidth)

      // Save the PDF
      const filename = `${companyName.replace(/\s+/g, "-").toLowerCase()}-${reportType}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`
      pdf.save(filename)

      // Show success message
      toast.success("PDF exported successfully", { id: "export-pdf" })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Failed to export PDF. Please try printing instead.", { id: "export-pdf" })
    }
  }

  const handlePrintReport = () => {
    if (!reportRef.current) return

    toast.loading("Preparing to print...", { id: "print-report" })

    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast.error("Failed to open print window. Please check your popup settings.", { id: "print-report" })
        return
      }

      printWindow.document.write(`
      <html>
        <head>
          <title>${companyName} - ${getReportTitle()}</title>
          <style>
            @page {
              size: ${pageFormat} ${orientation};
              margin: 10mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 0; 
              margin: 0;
              padding-bottom: 50px; /* Add padding to prevent footer overlap */
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              page-break-inside: avoid;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { background-color: #f2f2f2; }
            .header { 
              display: flex; 
              align-items: center; 
              justify-content: space-between; 
              margin-bottom: 20px; 
              padding: 20px;
              background-color: ${getThemeColor()};
              color: white;
            }
            .logo { font-weight: bold; font-size: 24px; }
            h1 { margin-bottom: 5px; }
            .summary-box { 
              border: 1px solid #ddd; 
              padding: 15px; 
              margin-bottom: 15px; 
              border-radius: 5px; 
              background-color: #f9f9f9;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-top { border-top: 2px solid #000; }
            .border-bottom { border-bottom: 2px solid #000; }
            .border-double { border-top: 3px double #000; }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 10px;
              text-align: center;
              font-size: 10px;
              border-top: 1px solid #ddd;
              background-color: #f9f9f9;
              height: 40px; /* Fixed height for footer */
            }
            @media print {
              button { display: none; }
            }
            @media screen and (max-width: 768px) {
              .table-container {
                overflow-x: auto;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          ${reportRef.current.innerHTML}
          ${includeFooter ? `<div class="footer">${footerText} | Generated on ${format(new Date(), "MMMM d, yyyy")} by ${user?.name || "Admin"}</div>` : ""}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `)

      printWindow.document.close()
      toast.success("Print prepared successfully", { id: "print-report" })
    } catch (error) {
      console.error("Error printing report:", error)
      toast.error("Failed to print report", { id: "print-report" })
    }
  }

  const getReportTitle = () => {
    switch (reportType) {
      case "profit-loss":
        return "Consolidated Statements of Operations"
      case "sales":
        return "Sales Report"
      case "expenses":
        return "Expense Report"
      case "inventory":
        return "Inventory Report"
      default:
        return "Business Report"
    }
  }

  const getThemeColor = () => {
    switch (colorTheme) {
      case "amber":
        return "#f59e0b"
      case "blue":
        return "#3b82f6"
      case "green":
        return "#10b981"
      case "purple":
        return "#8b5cf6"
      case "red":
        return "#ef4444"
      case "black":
        return "#000000"
      default:
        return "#f59e0b"
    }
  }

  const getReportIcon = () => {
    switch (reportType) {
      case "profit-loss":
        return <FilePieChart className="h-5 w-5" />
      case "sales":
        return <FileBarChart2 className="h-5 w-5" />
      case "expenses":
        return <FileSpreadsheet className="h-5 w-5" />
      case "inventory":
        return <FileStack className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // Calculate summary data for the selected period
  const filteredExpenses = data.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return dateRange.from && dateRange.to && expenseDate >= dateRange.from && expenseDate <= dateRange.to
  })

  const filteredSales = data.sales.filter((sale) => {
    const saleDate = new Date(sale.date)
    return dateRange.from && dateRange.to && saleDate >= dateRange.from && saleDate <= dateRange.to
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalProfit = totalSales - totalExpenses
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

  // Add this CSS to the component's JSX, just before the return statement
  // This ensures the styles are properly applied in your deployed application

  const styleOverrides = `
    /* Override for responsive tables */
    .responsive-table-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Ensure footer is always fully visible */
    .report-footer {
      padding-bottom: 2rem;
      margin-bottom: 1rem;
      min-height: 3rem;
    }

    /* Fix color appearance in theme selector */
    .color-preview {
      width: 1rem;
      height: 1rem;
      border-radius: 9999px;
      display: inline-block;
      margin-right: 0.25rem;
    }

    /* Enhanced table styles */
    .report-table {
      width: 100%;
      border-collapse: collapse;
    }

    .report-table th,
    .report-table td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
    }

    .report-table th {
      background-color: #f9fafb;
      font-weight: 600;
    }

    /* Improve color contrast for theme colors */
    .theme-header {
      color: white !important;
      padding: 1rem;
    }

    @media (max-width: 640px) {
      .report-table {
        font-size: 0.75rem;
      }
    }
    
    /* PDF export specific styles */
    @media print {
      .report-table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .report-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
      }
    }
  `

  return (
    <div className="container mx-auto py-6 px-4 report-generator-container">
      <style>{styleOverrides}</style>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-2 report-generator-button-outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {activeStep === 1 ? "Back to Analytics" : "Back"}
        </Button>
        <h1 className="text-2xl font-bold">Report Generator</h1>
      </div>

      {!showPreview ? (
        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <div
                className={`flex items-center p-3 rounded-lg sidebar-step ${activeStep === 1 ? "active" : ""}`}
                onClick={() => setActiveStep(1)}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${activeStep === 1 ? "bg-primary-foreground text-primary" : "bg-muted-foreground text-muted"} mr-3`}
                >
                  <span className="text-xs font-bold">1</span>
                </div>
                <span>Report Type</span>
              </div>

              <div
                className={`flex items-center p-3 rounded-lg sidebar-step ${activeStep === 2 ? "active" : ""}`}
                onClick={() => setActiveStep(2)}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${activeStep === 2 ? "bg-primary-foreground text-primary" : "bg-muted-foreground text-muted"} mr-3`}
                >
                  <span className="text-xs font-bold">2</span>
                </div>
                <span>Date Range</span>
              </div>

              <div
                className={`flex items-center p-3 rounded-lg sidebar-step ${activeStep === 3 ? "active" : ""}`}
                onClick={() => setActiveStep(3)}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${activeStep === 3 ? "bg-primary-foreground text-primary" : "bg-muted-foreground text-muted"} mr-3`}
                >
                  <span className="text-xs font-bold">3</span>
                </div>
                <span>Company Info</span>
              </div>

              <div
                className={`flex items-center p-3 rounded-lg sidebar-step ${activeStep === 4 ? "active" : ""}`}
                onClick={() => setActiveStep(4)}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${activeStep === 4 ? "bg-primary-foreground text-primary" : "bg-muted-foreground text-muted"} mr-3`}
                >
                  <span className="text-xs font-bold">4</span>
                </div>
                <span>Format & Layout</span>
              </div>
            </div>

            <Separator />

            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-medium mb-2">Report Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your report settings and preview before generating.
              </p>
              <Button
                variant="outline"
                className="w-full report-generator-button-outline"
                onClick={() => setShowPreview(true)}
              >
                Preview Report
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div>
            <Card className="report-generator-card">
              <CardHeader>
                <CardTitle>
                  {activeStep === 1 && "Select Report Type"}
                  {activeStep === 2 && "Choose Date Range"}
                  {activeStep === 3 && "Company Information"}
                  {activeStep === 4 && "Format & Layout Options"}
                </CardTitle>
                <CardDescription>
                  {activeStep === 1 && "Select the type of report you want to generate"}
                  {activeStep === 2 && "Define the time period for your report"}
                  {activeStep === 3 && "Add your company details to the report"}
                  {activeStep === 4 && "Customize the appearance of your report"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 1: Report Type */}
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all report-type-card ${reportType === "profit-loss" ? "active" : ""}`}
                        onClick={() => setReportType("profit-loss")}
                      >
                        <div className="flex items-center mb-2">
                          <FilePieChart
                            className={`h-5 w-5 mr-2 ${reportType === "profit-loss" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <h3 className="font-medium">Profit & Loss Statement</h3>
                          {reportType === "profit-loss" && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive view of your business's financial performance over a specific period.
                        </p>
                      </div>

                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all report-type-card ${reportType === "sales" ? "active" : ""}`}
                        onClick={() => setReportType("sales")}
                      >
                        <div className="flex items-center mb-2">
                          <FileBarChart2
                            className={`h-5 w-5 mr-2 ${reportType === "sales" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <h3 className="font-medium">Sales Report</h3>
                          {reportType === "sales" && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Detailed breakdown of all sales transactions with customer information.
                        </p>
                      </div>

                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all report-type-card ${reportType === "expenses" ? "active" : ""}`}
                        onClick={() => setReportType("expenses")}
                      >
                        <div className="flex items-center mb-2">
                          <FileSpreadsheet
                            className={`h-5 w-5 mr-2 ${reportType === "expenses" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <h3 className="font-medium">Expense Report</h3>
                          {reportType === "expenses" && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Analysis of all expenses categorized by type with date information.
                        </p>
                      </div>

                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all report-type-card ${reportType === "inventory" ? "active" : ""}`}
                        onClick={() => setReportType("inventory")}
                      >
                        <div className="flex items-center mb-2">
                          <FileStack
                            className={`h-5 w-5 mr-2 ${reportType === "inventory" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <h3 className="font-medium">Inventory Report</h3>
                          {reportType === "inventory" && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current stock levels, costs, and inventory movement details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Date Range */}
                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Report Period</Label>
                          <Select value={reportPeriod} onValueChange={setReportPeriod}>
                            <SelectTrigger className="select-trigger">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Date Range</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal report-generator-button-outline"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                  dateRange.to ? (
                                    <>
                                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                    </>
                                  ) : (
                                    format(dateRange.from, "LLL dd, y")
                                  )
                                ) : (
                                  "Select date range"
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 popover-content calendar-wrapper" align="start">
                              <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                  if (range && range.from) {
                                    setDateRange({
                                      from: range.from,
                                      to: range.to || range.from,
                                    })
                                  }
                                }}
                                initialFocus
                                className="bg-white"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium mb-2">Selected Period Summary</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-medium">
                              {dateRange.from ? format(dateRange.from, "MMMM d, yyyy") : "Not selected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">End Date:</span>
                            <span className="font-medium">
                              {dateRange.to ? format(dateRange.to, "MMMM d, yyyy") : "Not selected"}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Sales:</span>
                            <span className="font-medium">UGX {totalSales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Expenses:</span>
                            <span className="font-medium">UGX {totalExpenses.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Net Profit:</span>
                            <span className={`font-medium ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              UGX {totalProfit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profit Margin:</span>
                            <span className={`font-medium ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {profitMargin.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Company Information */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter your company name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="companyInfo">Company Address</Label>
                          <Textarea
                            id="companyInfo"
                            value={companyInfo}
                            onChange={(e) => setCompanyInfo(e.target.value)}
                            placeholder="Enter company address and contact information"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="companyLogo">Company Logo URL (Optional)</Label>
                          <Input
                            id="companyLogo"
                            value={companyLogo}
                            onChange={(e) => setCompanyLogo(e.target.value)}
                            placeholder="https://example.com/logo.png"
                          />
                          <p className="text-xs text-muted-foreground">Enter a URL to your company logo image</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="footerText">Report Footer Text</Label>
                          <Textarea
                            id="footerText"
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            placeholder="Enter text to appear in the report footer"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-4 pt-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="includeFooter" className="cursor-pointer">
                              Include Footer
                            </Label>
                            <Switch id="includeFooter" checked={includeFooter} onCheckedChange={setIncludeFooter} />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="includeSummary" className="cursor-pointer">
                              Include Summary Section
                            </Label>
                            <Switch id="includeSummary" checked={includeSummary} onCheckedChange={setIncludeSummary} />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="includeCharts" className="cursor-pointer">
                              Include Charts & Graphs
                            </Label>
                            <Switch id="includeCharts" checked={includeCharts} onCheckedChange={setIncludeCharts} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Format & Layout */}
                {activeStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Page Format</Label>
                          <RadioGroup
                            value={pageFormat}
                            onValueChange={setPageFormat}
                            className="grid grid-cols-2 gap-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="a4" id="a4" />
                              <Label htmlFor="a4" className="cursor-pointer">
                                A4
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="letter" id="letter" />
                              <Label htmlFor="letter" className="cursor-pointer">
                                Letter
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="legal" id="legal" />
                              <Label htmlFor="legal" className="cursor-pointer">
                                Legal
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="a3" id="a3" />
                              <Label htmlFor="a3" className="cursor-pointer">
                                A3
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label>Page Orientation</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div
                              className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-center ${orientation === "portrait" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50"}`}
                              onClick={() => setOrientation("portrait")}
                            >
                              <Maximize className="h-10 w-10 mb-2" />
                              <span className="text-sm font-medium">Portrait</span>
                              {orientation === "portrait" && <Check className="mt-2 h-4 w-4 text-primary" />}
                            </div>

                            <div
                              className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-center ${orientation === "landscape" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50"}`}
                              onClick={() => setOrientation("landscape")}
                            >
                              <Minimize className="h-10 w-10 mb-2 rotate-90" />
                              <span className="text-sm font-medium">Landscape</span>
                              {orientation === "landscape" && <Check className="mt-2 h-4 w-4 text-primary" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Update the color theme display section to ensure colors are correctly displayed */}

                        {/* Replace the color theme radio group with this enhanced version */}
                        <div className="space-y-2">
                          <Label>Color Theme</Label>
                          <RadioGroup
                            value={colorTheme}
                            onValueChange={setColorTheme}
                            className="grid grid-cols-3 gap-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="black" id="black" />
                              <div className="color-preview" style={{ backgroundColor: "#000000" }}></div>
                              <Label htmlFor="black" className="cursor-pointer">
                                Black
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="amber" id="amber" />
                              <div className="color-preview" style={{ backgroundColor: "#f59e0b" }}></div>
                              <Label htmlFor="amber" className="cursor-pointer">
                                Amber
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="blue" id="blue" />
                              <div className="color-preview" style={{ backgroundColor: "#3b82f6" }}></div>
                              <Label htmlFor="blue" className="cursor-pointer">
                                Blue
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="green" id="green" />
                              <div className="color-preview" style={{ backgroundColor: "#10b981" }}></div>
                              <Label htmlFor="green" className="cursor-pointer">
                                Green
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="purple" id="purple" />
                              <div className="color-preview" style={{ backgroundColor: "#8b5cf6" }}></div>
                              <Label htmlFor="purple" className="cursor-pointer">
                                Purple
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="red" id="red" />
                              <div className="color-preview" style={{ backgroundColor: "#ef4444" }}></div>
                              <Label htmlFor="red" className="cursor-pointer">
                                Red
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-gray-200 mt-6">
                          <div className="flex items-center mb-2">
                            <Palette className="h-4 w-4 mr-2" />
                            <h3 className="font-medium">Preview</h3>
                          </div>
                          <div className="flex items-center justify-center p-4 bg-white rounded border">
                            <div className="w-32 h-40 bg-white rounded shadow-sm overflow-hidden">
                              <div className="h-8" style={{ backgroundColor: getThemeColor() }}></div>
                              <div className="p-2">
                                <div className="h-2 w-16 bg-gray-200 rounded mb-1"></div>
                                <div className="h-2 w-12 bg-gray-200 rounded mb-3"></div>
                                <div className="h-2 w-full bg-gray-200 rounded mb-1"></div>
                                <div className="h-2 w-full bg-gray-200 rounded mb-1"></div>
                                <div className="h-2 w-3/4 bg-gray-200 rounded mb-3"></div>
                                <div className="h-8 w-full bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack} className="report-generator-button-outline">
                  {activeStep === 1 ? "Cancel" : "Back"}
                </Button>
                <Button onClick={handleNext} className="report-generator-button">
                  {activeStep < 4 ? "Continue" : "Preview Report"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="report-generator-button-outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintReport} className="report-generator-button-outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleExportReport} className="report-generator-button">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md report-preview">
            <div ref={reportRef} className="max-w-4xl mx-auto">
              {/* Add custom styles */}
              <style dangerouslySetInnerHTML={{ __html: styleOverrides }} />
              {/* Report Header */}
              <div className="text-center mb-8">
                {companyLogo && (
                  <img src={companyLogo || "/placeholder.svg"} alt={companyName} className="h-16 mx-auto mb-4" />
                )}
                <h1 className="text-2xl font-bold uppercase">{companyName}</h1>
                <p className="text-sm">{companyInfo}</p>
                <h2
                  className="text-xl font-bold mt-4 theme-header"
                  style={{
                    color: getThemeColor(),
                    backgroundColor: colorTheme === "black" ? "transparent" : undefined,
                  }}
                >
                  {getReportTitle()}
                </h2>
                <p className="text-sm text-gray-500">
                  Period: {dateRange.from && format(dateRange.from, "MMMM d, yyyy")} -{" "}
                  {dateRange.to && format(dateRange.to, "MMMM d, yyyy")}
                </p>
              </div>

              {/* Summary Section */}
              {includeSummary && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4">Executive Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Total Sales</p>
                      <p className="text-xl font-bold">UGX {totalSales.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Total Expenses</p>
                      <p className="text-xl font-bold">UGX {totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Net Profit</p>
                      <p className={`text-xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        UGX {totalProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Profit Margin: {profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Content */}
              <div className="mb-8">
                {reportType === "profit-loss" && (
                  <div className="overflow-x-auto responsive-table-wrapper">
                    <table className="w-full border-collapse report-table">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 border">Item</th>
                          <th className="text-right p-2 border">Amount (UGX)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border font-medium">Revenue</td>
                          <td className="text-right p-2 border">{totalSales.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border pl-4">Product Sales</td>
                          <td className="text-right p-2 border">{totalSales.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border pl-4">Service Sales</td>
                          <td className="text-right p-2 border">0</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="p-2 border font-medium">Expenses</td>
                          <td className="text-right p-2 border">{totalExpenses.toLocaleString()}</td>
                        </tr>
                        {Object.entries(
                          filteredExpenses.reduce((acc: { [key: string]: number }, expense) => {
                            if (!acc[expense.category]) {
                              acc[expense.category] = 0
                            }
                            acc[expense.category] += expense.amount
                            return acc
                          }, {}),
                        ).map(([category, amount]) => (
                          <tr key={category}>
                            <td className="p-2 border pl-4 capitalize">{category}</td>
                            <td className="text-right p-2 border">{amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-bold">
                          <td className="p-2 border">Gross Profit</td>
                          <td className="text-right p-2 border">{totalProfit.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">Tax (30%)</td>
                          <td className="text-right p-2 border">
                            {(totalProfit > 0 ? totalProfit * 0.3 : 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="bg-gray-100 font-bold">
                          <td className="p-2 border">Net Profit</td>
                          <td className="text-right p-2 border">
                            {(totalProfit > 0 ? totalProfit * 0.7 : totalProfit).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {reportType === "sales" && (
                  <div className="overflow-x-auto responsive-table-wrapper">
                    <table className="w-full border-collapse report-table">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 border">Date</th>
                          <th className="text-left p-2 border">Customer</th>
                          <th className="text-right p-2 border">Quantity (kg)</th>
                          <th className="text-right p-2 border">Amount (UGX)</th>
                          <th className="text-center p-2 border">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-4 border">
                              No sales data for the selected period
                            </td>
                          </tr>
                        ) : (
                          filteredSales.map((sale) => (
                            <tr key={sale.id}>
                              <td className="p-2 border">{format(new Date(sale.date), "MMM dd, yyyy")}</td>
                              <td className="p-2 border">{sale.customer}</td>
                              <td className="text-right p-2 border">{sale.quantity.toLocaleString()}</td>
                              <td className="text-right p-2 border">{sale.amount.toLocaleString()}</td>
                              <td className="text-center p-2 border">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${sale.isPaid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                                >
                                  {sale.isPaid ? "Paid" : "Unpaid"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={3} className="p-2 border">
                            Total
                          </td>
                          <td className="text-right p-2 border">{totalSales.toLocaleString()}</td>
                          <td className="p-2 border"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {reportType === "expenses" && (
                  <div className="overflow-x-auto responsive-table-wrapper">
                    <table className="w-full border-collapse report-table">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 border">Date</th>
                          <th className="text-left p-2 border">Description</th>
                          <th className="text-left p-2 border">Category</th>
                          <th className="text-right p-2 border">Amount (UGX)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-4 border">
                              No expense data for the selected period
                            </td>
                          </tr>
                        ) : (
                          filteredExpenses.map((expense) => (
                            <tr key={expense.id}>
                              <td className="p-2 border">{format(new Date(expense.date), "MMM dd, yyyy")}</td>
                              <td className="p-2 border">{expense.description}</td>
                              <td className="p-2 border capitalize">{expense.category}</td>
                              <td className="text-right p-2 border">{expense.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={3} className="p-2 border">
                            Total
                          </td>
                          <td className="text-right p-2 border">{totalExpenses.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {reportType === "inventory" && (
                  <div className="overflow-x-auto responsive-table-wrapper">
                    <table className="w-full border-collapse report-table">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 border">Date</th>
                          <th className="text-left p-2 border">Source</th>
                          <th className="text-right p-2 border">Quantity (kg)</th>
                          <th className="text-right p-2 border">Price/kg</th>
                          <th className="text-right p-2 border">Total Cost (UGX)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.inventory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-4 border">
                              No inventory data available
                            </td>
                          </tr>
                        ) : (
                          data.inventory.map((item) => (
                            <tr key={item.id}>
                              <td className="p-2 border">{format(new Date(item.date), "MMM dd, yyyy")}</td>
                              <td className="p-2 border">{item.source}</td>
                              <td className="text-right p-2 border">{item.quantity.toLocaleString()}</td>
                              <td className="text-right p-2 border">{item.pricePerKg.toLocaleString()}</td>
                              <td className="text-right p-2 border">{item.totalCost.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={2} className="p-2 border">
                            Total
                          </td>
                          <td className="text-right p-2 border">
                            {data.inventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                          </td>
                          <td className="p-2 border"></td>
                          <td className="text-right p-2 border">
                            {data.inventory.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              <div className="text-center text-sm text-gray-500 mt-12 pt-4 border-t pb-8 report-footer">
                <p>
                  Report generated on {format(new Date(), "MMMM d, yyyy")} at {format(new Date(), "h:mm a")}
                </p>
                <p>Generated by: {user?.name || "Admin"}</p>
                {includeFooter && <p className="mt-2 mb-4">{footerText}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

