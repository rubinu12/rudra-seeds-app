// @/components/admin/cycles/new/PaymentSection.tsx
"use client";

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
    
    // Format the currency for display
    const formattedCost = new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalCost);

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setCycleData((prev: any) => ({ ...prev, [name]: value }));
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
                <Radio 
                    id="paid"
                    name="payment"
                    value="Paid"
                    label="Paid"
                    checked={cycleData.payment === 'Paid'}
                    onChange={handleChange}
                />
                <Radio 
                    id="credit"
                    name="payment"
                    value="Credit"
                    label="Credit"
                    checked={cycleData.payment === 'Credit'}
                    onChange={handleChange}
                />
            </div>
            
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

// Reusable Radio component for consistency
const Radio = ({ id, label, ...props }: { id: string, label: string } & React.ComponentProps<'input'>) => (
    <label htmlFor={id} className="flex items-center cursor-pointer text-on-surface">
        <input id={id} type="radio" className="sr-only peer" {...props} />
        <div className="w-5 h-5 border-2 border-outline rounded-full flex items-center justify-center peer-checked:border-primary">
            <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
        </div>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);