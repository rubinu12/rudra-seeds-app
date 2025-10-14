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
    const formattedCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCost);

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setCycleData((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="form-section-card">
            <p className="text-on-surface-variant">Total Amount</p>
            <p className="text-5xl font-light text-on-surface leading-tight mt-1">{formattedCost}</p>
            {cycleData.bags > 0 && <p className="text-sm text-on-surface-variant mt-1">({cycleData.bags} bags @ ₹ {seedPrice.toFixed(2)}/bag)</p>}
            <div className="flex gap-8 my-6">
                <label className="flex items-center cursor-pointer"><input type="radio" name="payment" value="Paid" checked={cycleData.payment === 'Paid'} onChange={handleChange} className="sr-only peer" /><div className="radio-custom"></div><span className="ml-2">Paid</span></label>
                <label className="flex items-center cursor-pointer"><input type="radio" name="payment" value="Credit" checked={cycleData.payment === 'Credit'} onChange={handleChange} className="sr-only peer" /><div className="radio-custom"></div><span className="ml-2">Credit</span></label>
            </div>
            <div className="flex flex-col gap-4">
                <button type="submit" className="btn btn-primary" style={{height: '50px', fontSize: '1rem'}} disabled={!isFormValid}>Save & Create Cycle</button>
                <button type="button" onClick={handleClear} className="btn btn-secondary" style={{height: '50px', fontSize: '1rem'}}>Cancel</button>
            </div>
            {state?.message && <p className={`mt-4 text-center text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>}
        </div>
    )
}