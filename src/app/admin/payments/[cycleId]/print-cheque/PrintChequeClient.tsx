// app/admin/payments/[cycleId]/print-cheque/PrintChequeClient.tsx
"use client";

import React, { useState } from "react";
import type {
  ChequePrintData,
} from "@/src/lib/payment-data";
import { ArrowLeft, ArrowRight, Printer } from "lucide-react"; // Import navigation icons

// --- Helper Function to Convert Number to Words (Copied from cheque-test) ---
function numberToWordsIn(num: number | string): {
  line1: string;
  line2: string;
} {
  // ... (numberToWordsIn function remains exactly the same as before) ...
  const numAsStr = typeof num === "string" ? num : String(num);
  const [integerPart, decimalPart] = numAsStr.split(".");
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const toWords = (n: string): string => {
    let words = "";
    if (!n || n === "0") return "";
    if (n.length > 9) return "Number too large";
    const num = parseInt(n, 10);
    if (isNaN(num) || num === 0) return "";
    words += numToWords(Math.floor(num / 10000000), "Crore ");
    words += numToWords(Math.floor((num / 100000) % 100), "Lakh ");
    words += numToWords(Math.floor((num / 1000) % 100), "Thousand ");
    words += numToWords(Math.floor((num / 100) % 10), "Hundred ");
    if (num > 100 && num % 100 !== 0) words += "and ";
    words += numToWords(num % 100, "");
    return words.trim();
  };
  const numToWords = (n: number, s: string): string => {
    if (n === 0) return "";
    let str = "";
    if (n < 20) {
      str = a[n];
    } else {
      str = b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    }
    return str.trim() + " " + s;
  };
  let words = toWords(integerPart);
  if (words) {
    words = `${words} Rupees`;
  }
  if (decimalPart && parseInt(decimalPart, 10) > 0) {
    // Ensure decimal part is treated correctly (e.g., .50 -> fifty)
    const paisePart = decimalPart.padEnd(2, "0").slice(0, 2); // Get first two decimal digits
    const paiseWords = toWords(paisePart);
    if (paiseWords) {
      words += (words ? " and " : "") + `${paiseWords} Paise`;
    }
  }
  if (words) {
    words += " Only";
  } else {
    words = "Zero Rupees Only";
  } // Handle zero amount case

  const wordsArray = words.split(" ");
  let line1 = "";
  let line2 = "";
  const charLimit = 60;
  let currentLine = "";
  for (const word of wordsArray) {
    if (
      (currentLine + word).length + (currentLine ? 1 : 0) > charLimit &&
      !line1
    ) {
      line1 = currentLine.trim();
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (line1) {
    line2 = currentLine.trim();
  } else {
    line1 = currentLine.trim();
  }
  return { line1, line2 };
}

// --- Client Component ---
type PrintChequeClientProps = {
  printData: ChequePrintData;
};

export default function PrintChequeClient({
  printData,
}: PrintChequeClientProps) {
  const [includeAcPayee, setIncludeAcPayee] = useState(true);
  const [currentChequeIndex, setCurrentChequeIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  // *** REMOVED dateStr calculation based on printData.payment_date ***
  // const dateStr = printData.payment_date || (()=>{ const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`; })();

  const totalCheques = printData.cheques.length;
  const currentCheque = printData.cheques[currentChequeIndex];

  // *** ADD Function to format YYYY-MM-DD to DDMMYYYY ***
  const formatDueDateForCheque = (isoDate: string | null): string => {
    if (!isoDate) {
      // Fallback if due_date is missing (shouldn't happen)
      const d = new Date();
      return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
    }
    try {
      // Split YYYY-MM-DD and rearrange
      const [year, month, day] = isoDate.split("-");
      return `${day}${month}${year}`;
    } catch {
      // Fallback for invalid format
      const d = new Date();
      return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
    }
  };
  // --- End Add ---

  const goToNextCheque = () =>
    setCurrentChequeIndex((prev) => (prev + 1) % totalCheques);
  const goToPrevCheque = () =>
    setCurrentChequeIndex((prev) => (prev - 1 + totalCheques) % totalCheques);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (!currentCheque)
    return (
      <div className="p-4 text-center text-error">
        Error: Cheque data not available.
      </div>
    );

  const amountInWords = numberToWordsIn(currentCheque.amount);
  // *** USE the new formatting function for the current cheque's due date ***
  const chequeDateStr = formatDueDateForCheque(currentCheque.due_date);

  return (
    <>
      {/* Controls Section (Unchanged) */}
      <div
        className={`controls p-4 max-w-md mx-auto my-4 border rounded shadow bg-white print:hidden ${isPrinting ? "invisible" : ""}`}
      >
        <h2 className="text-lg font-semibold mb-3">
          Print Cheque ({currentChequeIndex + 1} of {totalCheques})
        </h2>
        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded text-primary border-outline focus:ring-primary"
              checked={includeAcPayee}
              onChange={(e) => setIncludeAcPayee(e.target.checked)}
            />
            Include A/C Payee Marking
          </label>
        </div>
        {totalCheques > 1 && (
          <div className="flex justify-between mb-3">
            <button
              onClick={goToPrevCheque}
              className="btn text-sm border border-outline text-primary px-4 py-2 rounded-full inline-flex items-center gap-1 hover:bg-primary/10"
            >
              {" "}
              <ArrowLeft size={16} /> Prev{" "}
            </button>
            <button
              onClick={goToNextCheque}
              className="btn text-sm border border-outline text-primary px-4 py-2 rounded-full inline-flex items-center gap-1 hover:bg-primary/10"
            >
              {" "}
              Next <ArrowRight size={16} />{" "}
            </button>
          </div>
        )}
        <button
          onClick={handlePrint}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          {" "}
          <Printer size={18} /> Print Current Cheque{" "}
        </button>
        <button
          onClick={() => window.history.back()}
          className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 mt-2"
        >
          {" "}
          Back{" "}
        </button>
      </div>

      {/* Cheque Rendering Section (Only the current cheque) */}
      <div className="cheque-container">
        {" "}
        {/* Container helps with print isolation */}
        <div className="cheque">
          {" "}
          {/* This div has the exact dimensions */}
          {includeAcPayee && (
            <div className="ac-payee-container">
              {" "}
              <div className="ac-payee-text-with-lines">A/C Payee</div>{" "}
            </div>
          )}
          {/* *** CHANGE: Use chequeDateStr *** */}
          <div className="date-field">
            {chequeDateStr.split("").map((char, i) => (
              <span key={i}>{char}</span>
            ))}
          </div>
          {/* --- End Change --- */}
          <div className="payee-field">{` ${currentCheque.payee_name} `}</div>
          <div className="amount-words-1">{amountInWords.line1}</div>
          <div className="amount-words-2">{amountInWords.line2}</div>
          <div className="amount-figures">{` ${currentCheque.amount.toFixed(2)} /-`}</div>
        </div>
      </div>

      {/* EXACT Styles from cheque-test (Unchanged) */}
      <style jsx global>{`
        body {
          font-family: "Courier New", Courier, monospace;
          font-size: 14px;
        }
        /* Controls section styling */
        .controls {
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        .controls h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .controls label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 1rem;
        }
        .controls input[type="checkbox"] {
          margin-right: 8px;
        }
        .controls button {
          width: 100%;
          padding: 10px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 0.5rem;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        .controls button:last-child {
          background-color: #e5e7eb;
          color: #374151;
        }
        .controls .flex {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .controls .btn {
          width: auto;
          background-color: white;
          color: #0070f3;
          border: 1px solid #ccc;
          padding: 8px 16px;
          font-size: 14px;
        }

        /* Cheque dimensions and absolute positioning for printing */
        .cheque {
          /* Style for screen display - centered with border */
          position: relative;
          margin: 20px auto;
          border: 1px dashed #ccc;
          /* EXACT dimensions */
          width: 205mm;
          height: 92mm;
          overflow: hidden; /* Important */
        }

        /* EXACT field positioning and styles from cheque-test */
        .date-field {
          position: absolute;
          top: 6mm;
          left: 160.5mm;
          letter-spacing: 3mm;
          font-weight: bold;
          font-size: 12px;
        } /* Adjusted font size */
        .payee-field {
          position: absolute;
          top: 20mm;
          left: 19mm;
          font-weight: bold;
          font-size: 14px;
        } /* Adjusted font size */
        .amount-words-1 {
          position: absolute;
          top: 28mm;
          left: 30mm;
          font-size: 14px;
        } /* Adjusted font size */
        .amount-words-2 {
          position: absolute;
          top: 36mm;
          left: 15mm;
          font-size: 14px;
        } /* Adjusted font size */
        .amount-figures {
          position: absolute;
          top: 35mm;
          left: 158mm;
          font-weight: bold;
          font-size: 14px;
        } /* Adjusted font size */
        .ac-payee-container {
          position: absolute;
          top: 15mm;
          left: 3mm;
          transform: rotate(-45deg);
          transform-origin: top left;
        }
        .ac-payee-text-with-lines {
          border-top: 0.5mm solid #333;
          border-bottom: 0.5mm solid #333;
          padding: 1mm 0;
          width: 25mm;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          color: #333;
        }

        /* Print Styles */
        @media print {
          /* 2. THE FIX: Force the document to be 1px tall */
          /* This tricks the browser into thinking there is only 1 page of content */
          html,
          body {
            height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* 3. Hide everything and remove its alignment */
          body * {
            visibility: hidden;
          }

          /* 4. Resurrect the cheque */
          .cheque-container {
            visibility: visible !important;

            /* 'fixed' breaks it out of the 1px body constraint */
            position: fixed !important;

            left: 0 !important;
            top: 0 !important;
            z-index: 9999 !important;
            transform: translate(0, -5mm) !important;

            /* Ensure the cheque background covers any lines behind it */
            background: white !important;
          }

          /* 5. Ensure internal cheque items are visible */
          .cheque-container * {
            visibility: visible !important;
          }

          /* 6. Hide controls */
          .controls {
            display: none !important;
          }
        }

        @page {
          size: 205mm 92mm;
          margin: 0;
        }
      `}</style>
    </>
  );
}
