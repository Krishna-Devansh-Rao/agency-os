// src/lib/pdf/invoice-generator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { InvoiceWithItems, Settings } from '@/types/database'

interface InvoicePDFOptions {
  invoice: InvoiceWithItems
  settings: Settings
}

// Color scheme: dark luxury
const COLORS = {
  black: rgb(0.05, 0.05, 0.08),
  navy: rgb(0.08, 0.10, 0.20),
  purple: rgb(0.40, 0.25, 0.85),
  gray: rgb(0.45, 0.45, 0.50),
  lightGray: rgb(0.90, 0.90, 0.92),
  white: rgb(1, 1, 1),
  green: rgb(0.15, 0.70, 0.40),
  red: rgb(0.85, 0.25, 0.25),
}

function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateInvoicePDF({ invoice, settings }: InvoicePDFOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)

  // ── Header Background
  page.drawRectangle({
    x: 0,
    y: height - 160,
    width,
    height: 160,
    color: COLORS.navy,
  })

  // Purple accent bar
  page.drawRectangle({
    x: 0,
    y: height - 4,
    width: 200,
    height: 4,
    color: COLORS.purple,
  })

  // ── Agency Name
  page.drawText(settings.agency_name || 'Your Agency', {
    x: 40,
    y: height - 55,
    size: 22,
    font: helveticaBold,
    color: COLORS.white,
  })

  // Agency details (right side)
  const agencyLines = [
    settings.address,
    settings.phone,
    settings.email,
    settings.gst_number ? `GST: ${settings.gst_number}` : '',
  ].filter(Boolean)

  agencyLines.forEach((line, i) => {
    page.drawText(line, {
      x: width - 40 - helvetica.widthOfTextAtSize(line, 9),
      y: height - 30 - i * 13,
      size: 9,
      font: helvetica,
      color: COLORS.lightGray,
    })
  })

  // ── INVOICE label
  page.drawText('INVOICE', {
    x: 40,
    y: height - 100,
    size: 32,
    font: helveticaBold,
    color: COLORS.purple,
  })

  // Invoice number
  page.drawText(invoice.invoice_number, {
    x: 40,
    y: height - 130,
    size: 11,
    font: helvetica,
    color: COLORS.lightGray,
  })

  // ── Status badge
  const statusColor = {
    paid: COLORS.green,
    overdue: COLORS.red,
    sent: COLORS.purple,
    draft: COLORS.gray,
    cancelled: COLORS.red,
  }[invoice.status] ?? COLORS.gray

  page.drawRectangle({
    x: width - 110,
    y: height - 125,
    width: 70,
    height: 22,
    color: statusColor,
    borderRadius: 4,
  })
  page.drawText(invoice.status.toUpperCase(), {
    x: width - 100,
    y: height - 117,
    size: 8,
    font: helveticaBold,
    color: COLORS.white,
  })

  // ── Dates section
  const datesY = height - 190
  page.drawText('Issue Date', { x: 40, y: datesY, size: 9, font: helveticaBold, color: COLORS.gray })
  page.drawText(formatDate(invoice.issue_date), { x: 40, y: datesY - 14, size: 10, font: helvetica, color: COLORS.black })

  if (invoice.due_date) {
    page.drawText('Due Date', { x: 160, y: datesY, size: 9, font: helveticaBold, color: COLORS.gray })
    page.drawText(formatDate(invoice.due_date), { x: 160, y: datesY - 14, size: 10, font: helvetica, color: COLORS.black })
  }

  // ── Bill To
  const billY = datesY - 60
  page.drawText('BILL TO', { x: 40, y: billY, size: 9, font: helveticaBold, color: COLORS.purple })

  const client = invoice.client
  const clientLines = [
    client.company_name || client.name,
    client.company_name ? client.name : '',
    client.email,
    client.phone,
    client.address,
    client.gst_number ? `GST: ${client.gst_number}` : '',
  ].filter(Boolean)

  clientLines.forEach((line, i) => {
    page.drawText(line, {
      x: 40,
      y: billY - 15 - i * 14,
      size: 10,
      font: i === 0 ? helveticaBold : helvetica,
      color: i === 0 ? COLORS.black : COLORS.gray,
    })
  })

  // ── Items table
  const tableTop = billY - 15 - clientLines.length * 14 - 30
  const tableStartY = tableTop

  // Table header background
  page.drawRectangle({
    x: 40,
    y: tableStartY - 26,
    width: width - 80,
    height: 26,
    color: COLORS.navy,
  })

  const cols = { desc: 40, qty: 350, rate: 420, amount: 490 }

  // Header text
  page.drawText('Description', { x: cols.desc + 8, y: tableStartY - 17, size: 9, font: helveticaBold, color: COLORS.white })
  page.drawText('Qty', { x: cols.qty, y: tableStartY - 17, size: 9, font: helveticaBold, color: COLORS.white })
  page.drawText('Rate', { x: cols.rate, y: tableStartY - 17, size: 9, font: helveticaBold, color: COLORS.white })
  page.drawText('Amount', { x: cols.amount, y: tableStartY - 17, size: 9, font: helveticaBold, color: COLORS.white })

  // Items
  let currentY = tableStartY - 26

  invoice.invoice_items.forEach((item, i) => {
    const rowY = currentY - 26 - i * 28
    const bgColor = i % 2 === 0 ? rgb(0.97, 0.97, 0.98) : COLORS.white

    page.drawRectangle({ x: 40, y: rowY, width: width - 80, height: 28, color: bgColor })

    // Description (word-wrap basic)
    const desc = item.description.length > 55 ? item.description.substring(0, 52) + '...' : item.description
    page.drawText(desc, { x: cols.desc + 8, y: rowY + 9, size: 9, font: helvetica, color: COLORS.black })

    page.drawText(String(item.quantity), { x: cols.qty, y: rowY + 9, size: 9, font: helvetica, color: COLORS.gray })
    page.drawText(formatCurrency(item.unit_price, settings.currency), { x: cols.rate, y: rowY + 9, size: 9, font: helvetica, color: COLORS.gray })
    page.drawText(formatCurrency(item.amount, settings.currency), { x: cols.amount, y: rowY + 9, size: 9, font: helveticaBold, color: COLORS.black })
  })

  // ── Totals section
  const totalsY = currentY - 26 - invoice.invoice_items.length * 28 - 20
  const totalsX = width - 200

  // Separator line
  page.drawLine({
    start: { x: totalsX - 20, y: totalsY + 15 },
    end: { x: width - 40, y: totalsY + 15 },
    thickness: 0.5,
    color: COLORS.lightGray,
  })

  page.drawText('Subtotal:', { x: totalsX, y: totalsY, size: 10, font: helvetica, color: COLORS.gray })
  page.drawText(formatCurrency(invoice.subtotal, settings.currency), {
    x: width - 40 - helveticaBold.widthOfTextAtSize(formatCurrency(invoice.subtotal, settings.currency), 10),
    y: totalsY, size: 10, font: helveticaBold, color: COLORS.black
  })

  if (invoice.tax_percentage > 0) {
    page.drawText(`Tax (${invoice.tax_percentage}%):`, { x: totalsX, y: totalsY - 18, size: 10, font: helvetica, color: COLORS.gray })
    page.drawText(formatCurrency(invoice.tax_amount, settings.currency), {
      x: width - 40 - helveticaBold.widthOfTextAtSize(formatCurrency(invoice.tax_amount, settings.currency), 10),
      y: totalsY - 18, size: 10, font: helveticaBold, color: COLORS.black
    })
  }

  // Total box
  const totalBoxY = totalsY - (invoice.tax_percentage > 0 ? 50 : 30)
  page.drawRectangle({ x: totalsX - 20, y: totalBoxY - 8, width: width - totalsX + 20 - 40, height: 34, color: COLORS.navy, borderRadius: 6 })
  page.drawText('Total Due:', { x: totalsX - 10, y: totalBoxY + 6, size: 11, font: helveticaBold, color: COLORS.lightGray })
  const totalStr = formatCurrency(invoice.total, settings.currency)
  page.drawText(totalStr, {
    x: width - 50 - helveticaBold.widthOfTextAtSize(totalStr, 14),
    y: totalBoxY + 6, size: 14, font: helveticaBold, color: COLORS.purple
  })

  // ── Bank Details
  if (settings.bank_account || settings.upi_id) {
    const bankY = totalBoxY - 50
    page.drawText('Payment Details', { x: 40, y: bankY, size: 10, font: helveticaBold, color: COLORS.navy })

    const bankLines = [
      settings.bank_name && `Bank: ${settings.bank_name}`,
      settings.bank_account && `Account: ${settings.bank_account}`,
      settings.bank_ifsc && `IFSC: ${settings.bank_ifsc}`,
      settings.upi_id && `UPI: ${settings.upi_id}`,
    ].filter(Boolean) as string[]

    bankLines.forEach((line, i) => {
      page.drawText(line, { x: 40, y: bankY - 14 - i * 13, size: 9, font: helvetica, color: COLORS.gray })
    })
  }

  // ── Notes
  if (invoice.notes) {
    const notesY = 80
    page.drawText('Notes', { x: 40, y: notesY, size: 9, font: helveticaBold, color: COLORS.gray })
    page.drawText(invoice.notes.substring(0, 200), { x: 40, y: notesY - 14, size: 8, font: helvetica, color: COLORS.gray })
  }

  // ── Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 36, color: COLORS.navy })
  const footerText = `Thank you for your business! • ${settings.agency_name}`
  page.drawText(footerText, {
    x: width / 2 - helvetica.widthOfTextAtSize(footerText, 8) / 2,
    y: 13, size: 8, font: helvetica, color: COLORS.lightGray
  })

  return doc.save()
}
