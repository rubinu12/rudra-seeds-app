export const dynamic = 'force-dynamic';
import { 
  getWalletData, 
  getCompanyTradeBook, 
  getHarvestRegister,
  getModalData
} from "./actions";
import FinanceClientView from "./FinanceClientView";

// Force dynamic because we are dealing with live financial data


export default async function FinancePage() {
  // Parallel Data Fetching for "Mind Blowing" Speed
  const [wallet, trade, harvest, modalData] = await Promise.all([
    getWalletData(),
    getCompanyTradeBook(),
    getHarvestRegister(),
    getModalData()
  ]);

  return (
    <main className="p-6 md:p-10 max-w-[1600px] mx-auto">
      <FinanceClientView 
        walletData={wallet} 
        tradeData={trade} 
        harvestData={harvest}
        modalData={modalData}
      />
    </main>
  );
}