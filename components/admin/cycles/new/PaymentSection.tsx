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
        if (cycleData.payment === 'Partial' && cycleData.amountPaid > 0) {
            const remaining = totalCost - cycleData.amountPaid;
            return remaining > 0 ? remaining : 0;
        }
        return 0;
    }, [totalCost, cycleData.payment, cycleData.amountPaid]);

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
                <Radio id="paid" name="payment" value="Paid" label="Paid" checked={cycleData.payment === 'Paid'} onChange={handleChange} />
                <Radio id="credit" name="payment" value="Credit" label="Credit" checked={cycleData.payment === 'Credit'} onChange={handleChange} />
                <Radio id="partial" name="payment" value="Partial" label="Partial" checked={cycleData.payment === 'Partial'} onChange={handleChange} />
            </div>

            {cycleData.payment === 'Partial' && (
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
                <button 
                    type="submit" 
                    className="w-full h-[50px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg hover:-translate-y-px transition-all disabled:bg-on-surface-variant/40 disabled:shadow-none disabled:cursor-not-allowed" 
                    disabled={!isFormValid}
                >
                    Save & Create Cycle
                </button>
                <button 
                    type="button" 
                    onClick={handleClear} 
                    className="w-full h-[50px] text-base font-medium rounded-full border border-outline text-primary hover:bg-primary/10 transition-colors"
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

const Radio = ({ id, label, ...props }: { id: string, label: string } & React.ComponentProps<'input'>) => (
    <label htmlFor={id} className="flex items-center cursor-pointer text-on-surface">
        <input id={id} type="radio" className="peer sr-only" {...props} />
        <div className="w-5 h-5 border-2 border-outline rounded-full flex items-center justify-center peer-checked:border-primary">
            <div className="w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform"></div>
        </div>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);