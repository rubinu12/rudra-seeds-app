// app/admin/payments/[cycleId]/process/page.tsx
import { notFound } from 'next/navigation';
import { getFarmerPaymentDetails } from '@/lib/payment-data'; // Import the data fetching function
import ProcessPaymentForm from './ProcessPaymentForm'; // Import the client component (to be created next)
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: {
    cycleId: string;
  };
};

export default async function ProcessPaymentPage({ params }: Props) {
  const cycleId = Number(params.cycleId);

  if (isNaN(cycleId)) {
    notFound(); // Invalid ID format
  }

  // Fetch data on the server
  const paymentDetails = await getFarmerPaymentDetails(cycleId);

  if (!paymentDetails) {
    // Could happen if cycle ID doesn't exist, isn't 'Loaded', or is already paid
    // Provide a more informative message than just notFound()
    return (
        <div className="p-8 max-w-2xl mx-auto text-center">
             <Link href="/admin/dashboard" className="inline-flex items-center text-primary hover:underline mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold mb-4 text-error">Cannot Process Payment</h1>
            <p className="text-on-surface-variant">
                Could not retrieve payment details for Cycle ID <span className='font-bold'>{cycleId}</span>.
                The cycle may not exist, might not be in the 'Loaded' status, or payment might have already been processed.
            </p>
        </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Basic Header */}
       <header className="mb-6 flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-normal text-on-surface">
                  Process Farmer Payment
              </h1>
              <p className="text-on-surface-variant mt-1">
                  Cycle ID: {cycleId} - Farmer: {paymentDetails.farmer_name}
              </p>
          </div>
           <Link href="/admin/dashboard" className="btn text-sm border border-outline text-primary px-4 py-2 rounded-full inline-flex items-center gap-1 hover:bg-primary/10">
               <ArrowLeft className="w-4 h-4"/> Dashboard
           </Link>
      </header>

      {/* Pass fetched data to the client component */}
      <ProcessPaymentForm paymentDetails={paymentDetails} />
    </div>
  );
}