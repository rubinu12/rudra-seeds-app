// @/components/admin/cycles/new/PaymentSection.tsx
"use client";

import { Input } from '@/components/ui/FormInputs';
import { useMemo } from 'react';

type Props = {
    cycleState: [any, Function];
    totalCost: number;
    seedPrice: number;
    isFormValid: boolean;
    handleClear: () => void;
    state: { message: string; success: boolean; };
}

export const PaymentSection = ({ cycleState, totalCost, seedPrice, isFormValid, handleClear, state }: Props) => {
    const [cycleData, setCycleData] = cycleState;

    const formattedCost = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalCost);

    const amountRemaining = useMemo(() => {
        if (cycleData.paymentChoice === 'Partial' && cycleData.amountPaid > 0) {
            const remaining = totalCost - cycleData.amountPaid;
            return remaining > 0 ? remaining : 0;
        }
        return 0;
    }, [totalCost, cycleData.paymentChoice, cycleData.amountPaid]);

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value, type } = e.target;
        setCycleData((prev: any) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    return (
        <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
            <p className="text-base text-on-surface-variant">Total Amount</p>
            <p className="text-5xl font-light text-on-surface leading-tight mt-2">{formattedCost}</p>

            {cycleData.bags > 0 && (
                <p className="text-sm text-on-surface-variant mt-1 mb-6">
                    ({cycleData.bags} bags @ ₹{seedPrice.toFixed(2)}/bag)
                </p>
            )}

            <div className="flex items-center gap-6 my-8">
                <Radio id="paid" name="paymentChoice" value="Paid" label="Paid" checked={cycleData.paymentChoice === 'Paid'} onChange={handleChange} />
                <Radio id="credit" name="paymentChoice" value="Credit" label="Credit" checked={cycleData.paymentChoice === 'Credit'} onChange={handleChange} />
                <Radio id="partial" name="paymentChoice" value="Partial" label="Partial" checked={cycleData.paymentChoice === 'Partial'} onChange={handleChange} />
            </div>

            {cycleData.paymentChoice === 'Partial' && (
                <div className="space-y-4 mb-8 transition-all duration-300">
                    <Input
                        type="number"
                        id="amountPaid"
                        name="amountPaid"
                        label="Amount Paid"
                        value={cycleData.amountPaid || ''}
                        onChange={handleChange}
                        required
                    />
                    {cycleData.amountPaid > 0 && (
                        <p className="text-sm text-on-surface-variant">
                            Remaining: <span className="font-medium text-error">₹{amountRemaining.toFixed(2)}</span>
                        </p>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-4">
                {/* === ADDED .btn class below === */}
                <button
                    type="submit"
                    className="btn w-full h-[50px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg hover:-translate-y-px transition-all disabled:bg-on-surface-variant/40 disabled:shadow-none disabled:cursor-not-allowed"
                    disabled={!isFormValid}
                >
                    Save & Create Cycle
                </button>
                {/* === ADDED .btn class below === */}
                <button
                    type="button"
                    onClick={handleClear}
                    className="btn w-full h-[50px] text-base font-medium rounded-full border border-outline text-primary hover:bg-primary/10 transition-colors"
                >
                    Cancel
                </button>
            </div>

            {state?.message && (
                <p className={`mt-4 text-center text-sm font-medium ${state.success ? 'text-green-600' : 'text-error'}`}>
                    {state.message}
                </p>
            )}
        </div>
    )
}

// *** Reusable Radio component with CORRECTED styling ***

// *** Alternative Radio component definition ***
// Make sure this exact code replaces the old Radio component definition
// at the bottom of BOTH SowingSection.tsx AND PaymentSection.tsx

const Radio = ({ id, label, ...props }: { id: string, label: string } & React.ComponentProps<'input'>) => (
    <label htmlFor={id} className="flex items-center cursor-pointer text-on-surface">
        <input id={id} type="radio" className="sr-only peer" {...props} />
        {/* Outer circle - Still uses peer-checked for border */}
        <div className="w-5 h-5 border-2 border-outline rounded-full flex items-center justify-center peer-checked:border-primary transition-colors">
            {/* Inner circle - Uses CSS variable for transform */}
            <div
                style={{ '--radio-scale': '0' } as React.CSSProperties} // Default scale variable
                // Apply base styles, transition, and set scale using the variable
                // On peer-checked, update the CSS variable --radio-scale to 1
                className="w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-150 ease-in-out scale-[var(--radio-scale)] peer-checked:[--radio-scale:1]"
            ></div>
        </div>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);















