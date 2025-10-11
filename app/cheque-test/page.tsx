'use client';

import { useState } from 'react';

// --- Helper Function to Convert Number to Words (Indian System) ---
function numberToWordsIn(num: number | string): { line1: string; line2: string } {
  const numAsStr = typeof num === 'string' ? num : String(num);
  const [integerPart, decimalPart] = numAsStr.split('.');
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const toWords = (n: string): string => {
    let words = '';
    if (n.length > 9) return 'Number too large';
    const num = parseInt(n, 10);
    if (isNaN(num)) return '';
    words += numToWords(Math.floor(num / 10000000), 'Crore ');
    words += numToWords(Math.floor((num / 100000) % 100), 'Lakh ');
    words += numToWords(Math.floor((num / 1000) % 100), 'Thousand ');
    words += numToWords(Math.floor((num / 100) % 10), 'Hundred ');
    if (num > 100 && num % 100 !== 0) words += 'and ';
    words += numToWords(num % 100, '');
    return words.trim();
  };
  const numToWords = (n: number, s: string): string => {
    if (n === 0) return '';
    let str = '';
    if (n < 20) { str = a[n]; } else { str = b[Math.floor(n / 10)] + ' ' + a[n % 10]; }
    return str.trim() + ' ' + s;
  };
  let words = toWords(integerPart);
  if (words) { words = `${words} Rupees`; }
  if (decimalPart && parseInt(decimalPart, 10) > 0) { words += ` and ${toWords(decimalPart)} Paise`; }
  words += ' Only';
  const wordsArray = words.split(' ');
  let line1 = '';
  let line2 = '';
  const charLimit = 60;
  let currentLine = '';
  for (const word of wordsArray) {
    if ((currentLine + word).length > charLimit && !line1) {
      line1 = currentLine.trim();
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (line1) { line2 = currentLine.trim(); } else { line1 = currentLine.trim(); }
  return { line1, line2 };
}

// --- The Main Page Component ---
export default function ChequePrintPage() {
  const [payeeName, setPayeeName] = useState('RUDRA SEEDS AND ORGANISER');
  const [amount, setAmount] = useState('123456.78');
  const [date, setDate] = useState('10102025');
  const [includeAcPayee, setIncludeAcPayee] = useState(true);

  const amountInWords = numberToWordsIn(amount);

  return (
    <>
      <div className="controls">
        <h2>Cheque Details</h2>
        <div className="input-group"><label>Payee Name</label><input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} /></div>
        <div className="input-group"><label>Amount</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="input-group"><label>Date (DDMMYYYY)</label><input type="text" maxLength={8} value={date} onChange={(e) => setDate(e.target.value.replace(/\D/g, ''))} /></div>
        <div className="input-group">
          <label>
            <input 
              type="checkbox" 
              checked={includeAcPayee} 
              onChange={(e) => setIncludeAcPayee(e.target.checked)} 
            /> 
            Include A/C Payee
          </label>
        </div>
        <button onClick={() => window.print()}>Print Cheque</button>
      </div>

      <div className="cheque">
        {/* Simplified A/C Payee Section */}
        {includeAcPayee && (
          <div className="ac-payee-container">
            <div className="ac-payee-text-with-lines">A/C Payee</div>
          </div>
        )}

        <div className="date-field">{date.split('').map((char, index) => <span key={index}>{char}</span>)}</div>
        <div className="payee-field">{`** ${payeeName} **`}</div>
        <div className="amount-words-1">{amountInWords.line1}</div>
        <div className="amount-words-2">{amountInWords.line2}</div>
        <div className="amount-figures">{`** ${parseFloat(amount || "0").toFixed(2)} /-`}</div>
      </div>

      <style jsx global>{`
        body { font-family: 'Courier New', Courier, monospace; font-size: 14px; }
        .controls { max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; margin-bottom: 5px; }
        .input-group input[type="text"], .input-group input[type="number"] { width: 100%; padding: 8px; box-sizing: border-box; }
        .input-group input[type="checkbox"] { margin-right: 8px; }

        button { width: 100%; padding: 10px; background-color: #0070f3; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .cheque { position: absolute; left: -9999px; top: -9999px; width: 205mm; height: 92mm; }
        
        /* Date & Amount Styles (from previous iteration) */
        .date-field { position: absolute; top: 7mm; left: 162mm; letter-spacing: 3mm; font-weight: bold; }
        .payee-field { position: absolute; top: 19mm; left: 19mm; font-weight: bold; }
        .amount-words-1 { position: absolute; top: 28mm; left: 30mm; }
        .amount-words-2 { position: absolute; top: 36mm; left: 15mm; }
        .amount-figures { position: absolute; top: 35mm; left: 158mm; font-weight: bold; }

        /* === SIMPLIFIED & MORE RELIABLE A/C PAYEE STYLES === */
        .ac-payee-container {
          position: absolute;
          top: 15mm;
          left: 3mm;
          transform: rotate(-45deg);
          transform-origin: top left;
        }

        .ac-payee-text-with-lines {
          /* Lines are created using borders */
          border-top: 0.5mm solid #333;
          border-bottom: 0.5mm solid #333;
          
          /* Padding creates space between text and lines */
          padding: 1mm 0;
          
          width: 25mm;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          color: #333;
        }
        
        @media print {
          .controls { display: none; }
          .cheque { position: absolute; top: 0; left: 0; }
        }
        
        @page {
          size: 205mm 92mm;
          margin: 0;
        }
      `}</style>
    </>
  );
}