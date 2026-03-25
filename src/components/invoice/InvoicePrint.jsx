import React from "react";
import { format } from "date-fns";

export default function InvoicePrint({ sale, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 print:p-0" id="invoice-content">
          {/* Header */}
          <div className="text-center border-b-2 border-[#1e3a5f] pb-6 mb-6">
            <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">HOME FASHION</h1>
            <p className="text-sm text-slate-600">59, Vellammal Layout, Kamarajapuram West, Karur - 639002</p>
            <p className="text-sm text-slate-600">Phone: 99429-44744 | Email: karurhomefashion@gmail.com</p>
            <p className="text-sm text-slate-600">GSTIN: 33BBRPD7436E1ZP</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-[#1e3a5f] mb-2">Bill To:</h3>
              <p className="font-medium">{sale.customer_name}</p>
              {sale.customer_phone && <p className="text-sm text-slate-600">{sale.customer_phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Invoice No: <span className="font-semibold text-slate-900">{sale.invoice_number}</span></p>
              <p className="text-sm text-slate-600">Date: <span className="font-semibold text-slate-900">{format(new Date(sale.sale_date || sale.created_date), "dd MMM yyyy, HH:mm")}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="text-left p-2 text-sm">#</th>
                <th className="text-left p-2 text-sm">Item</th>
                <th className="text-center p-2 text-sm">Qty</th>
                <th className="text-right p-2 text-sm">Rate</th>
                <th className="text-right p-2 text-sm">GST</th>
                <th className="text-right p-2 text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 text-sm">{index + 1}</td>
                  <td className="p-2 text-sm">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </td>
                  <td className="p-2 text-sm text-center">{item.quantity}</td>
                  <td className="p-2 text-sm text-right">₹{item.unit_price?.toLocaleString()}</td>
                  <td className="p-2 text-sm text-right">₹{item.gst_amount?.toLocaleString()}</td>
                  <td className="p-2 text-sm text-right font-medium">₹{item.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">₹{sale.subtotal?.toLocaleString()}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount ({sale.discount_percent}%):</span>
                  <span>-₹{sale.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">CGST:</span>
                <span className="font-medium">₹{sale.cgst_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">SGST:</span>
                <span className="font-medium">₹{sale.sgst_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-[#1e3a5f] pt-2">
                <span>Grand Total:</span>
                <span className="text-[#1e3a5f]">₹{sale.grand_total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Payment:</span>
                <span className="font-medium uppercase">{sale.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-slate-600">
            <p className="font-medium mb-2">Thank you for your business!</p>
            <p className="text-xs">This is a computer-generated invoice and does not require signature</p>
          </div>
        </div>

        {/* Print Actions */}
        <div className="flex justify-end gap-3 p-6 border-t print:hidden bg-slate-50">
          <button onClick={onClose} className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
            Close
          </button>
          <button onClick={handlePrint} className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f] transition-colors">
            Print Invoice
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}