"use client";
import React from "react";
import {
  CreditCard,
  Banknote,
  Coins,
  CheckCircle2,
  Save,
  LucideIcon,
} from "lucide-react";
import { Input } from "@/src/components/ui/FormInputs";

// UPDATED TYPE DEFINITION TO MATCH SOWING SECTION
export type CycleData = {
  landmarkId: string;
  seedId: string;
  bags: number;
  date: string;
  goods_collection_method: string;
  paymentChoice: string;
  amountPaid: number;
  lot_no: string; // Added this to match SowingSection
};

type Props = {
  cycleState: [CycleData, React.Dispatch<React.SetStateAction<CycleData>>];
  totalCost: number;
  isFormValid: boolean;
  onAddToQueue: () => void;
};

export const PaymentSection = ({
  cycleState,
  totalCost,
  isFormValid,
  onAddToQueue,
}: Props) => {
  const [cycleData, setCycleData] = cycleState;

  const handlePaymentChoiceChange = (choice: string) => {
    // Explicit typing for prev
    setCycleData((prev: CycleData) => ({ ...prev, paymentChoice: choice }));
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Explicit typing for prev
    setCycleData((prev: CycleData) => ({
      ...prev,
      amountPaid: Number(e.target.value),
    }));
  };

  const amountRemaining =
    cycleData.paymentChoice === "Paid"
      ? 0
      : cycleData.paymentChoice === "Credit"
        ? totalCost
        : Math.max(0, totalCost - cycleData.amountPaid);

  type RadioCardProps = {
    value: string;
    label: string;
    icon: LucideIcon;
  };

  const RadioCard = ({ value, label, icon: Icon }: RadioCardProps) => {
    const isSelected = cycleData.paymentChoice === value;
    return (
      <label
        className={`
                relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-outline/20 hover:border-outline/40 hover:bg-surface-container-high bg-surface"
                }
            `}
      >
        <input
          type="radio"
          name="payment_choice"
          value={value}
          checked={isSelected}
          onChange={() => handlePaymentChoiceChange(value)}
          className="sr-only"
        />
        <div
          className={`
                    p-3 rounded-full transition-colors
                    ${isSelected ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"}
                `}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm ${isSelected ? "text-primary" : "text-on-surface-variant"}`}
          >
            {label}
          </span>
          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
        </div>
      </label>
    );
  };

  return (
    <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 grid place-items-center rounded-2xl bg-secondary-container">
              <CreditCard className="w-6 h-6 text-on-secondary-container" />
            </div>
            <div>
              <h2 className="text-[1.75rem] font-normal text-on-surface">
                Payment
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Cost
            </p>
            <p className="text-xl font-bold text-primary">
              ₹{totalCost.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <RadioCard value="Paid" label="Paid" icon={Banknote} />
          <RadioCard value="Credit" label="Credit" icon={CreditCard} />
          <RadioCard value="Partial" label="Partial" icon={Coins} />
        </div>

        {cycleData.paymentChoice === "Partial" && (
          <div className="animate-fadeIn mb-6 p-4 bg-surface rounded-xl border border-outline/20">
            <Input
              type="number"
              id="amount_paid"
              name="amount_paid"
              label="Amount Paid Now (₹)"
              value={cycleData.amountPaid}
              onChange={handleAmountPaidChange}
              onWheel={(e) => e.currentTarget.blur()}
              min={0}
              max={totalCost}
              required
            />
            <div className="flex justify-between items-center mt-3 px-1">
              <span className="text-xs text-on-surface-variant">
                Balance Due:
              </span>
              <span className="text-sm font-bold text-error">
                ₹{amountRemaining.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-6 border-t border-outline/20">
        <button
          type="button"
          onClick={onAddToQueue}
          disabled={!isFormValid}
          className="w-full h-14 flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl font-medium text-lg hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
        >
          <Save className="w-5 h-5" />
          {isFormValid ? "Add to Queue" : "Fill Details to Add"}
        </button>
        <p className="text-xs text-center text-on-surface-variant mt-2">
          Entry will be added to the pending list below.
        </p>
      </div>
    </div>
  );
};