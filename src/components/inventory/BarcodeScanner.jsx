import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scan, X } from "lucide-react";

export default function BarcodeScanner({ onScan, isOpen, onClose }) {
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && barcode) {
      onScan(barcode);
      setBarcode("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#1e3a5f]/10 rounded-xl">
              <Scan className="w-6 h-6 text-[#1e3a5f]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Scan Barcode</h3>
              <p className="text-sm text-slate-500">Use scanner or enter manually</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Scan or type barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-14 text-lg text-center font-mono tracking-wider"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (barcode) {
                  onScan(barcode);
                  setBarcode("");
                }
              }}
              disabled={!barcode}
              className="flex-1 bg-[#1e3a5f]"
            >
              Search
            </Button>
          </div>

          <div className="text-center text-sm text-slate-500 pt-2">
            <p className="font-medium mb-1">Quick Tips:</p>
            <p>• Use a USB barcode scanner for instant scanning</p>
            <p>• Press Enter after manual entry</p>
          </div>
        </div>
      </Card>
    </div>
  );
}