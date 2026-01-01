import { getCompanyLedgers, getWallets } from '@/lib/finance-data';
import { getDestinationCompanies } from '@/lib/admin-data'; 
import FinanceClientView from './FinanceClientView';

export default async function FinancePage() {
  // Fetch all necessary data in parallel
  const [ledgers, wallets, companies] = await Promise.all([
     getCompanyLedgers(),
     getWallets(),
     getDestinationCompanies()
  ]);

  return (
    <div className="p-4 md:p-8">
       <FinanceClientView 
          ledgers={ledgers} 
          wallets={wallets} 
          companies={companies} 
       />
    </div>
  );
}