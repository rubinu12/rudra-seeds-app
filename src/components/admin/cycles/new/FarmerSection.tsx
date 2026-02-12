"use client";

import React from "react";
import {
  User,
  Tractor,
  PlusCircle,
  LoaderCircle,
  X,
  Search,
  Check,
  Trash2,
} from "lucide-react";
import type { FarmerDetails, Farm, BankAccount } from "@/src/lib/definitions";
import { Input, Textarea } from "@/src/components/ui/FormInputs";
import SearchableSelect from "@/src/components/ui/SearchableSelect";

// Same types as before, strictly defined
export type FarmerData = {
  id: string;
  name: string;
  mobile: string;
  aadhar: string;
  address: string;
};

export type FarmData = {
  id: string;
  location: string;
  area: string;
  villageId: string;
};

export type BankAccountState = {
  id: string;
  name: string;
  confirmName: string;
  number: string;
  ifsc: string;
  bankName: string;
};

type Option = { value: string; label: string };

type Props = {
  farmerState: [FarmerData, React.Dispatch<React.SetStateAction<FarmerData>>];
  farmState: [FarmData, React.Dispatch<React.SetStateAction<FarmData>>];
  newBankAccounts: BankAccountState[];
  setNewBankAccounts: React.Dispatch<React.SetStateAction<BankAccountState[]>>;
  searchResults: Pick<FarmerDetails, "farmer_id" | "name" | "mobile_number">[];
  isLoading: boolean;
  existingFarms: Farm[];
  existingAccounts: BankAccount[];
  handleSelectFarmer: (farmer: Pick<FarmerDetails, "farmer_id" | "name" | "mobile_number">) => void;
  handleClear: () => void;
  isSearchEnabled: boolean;
  setIsSearchEnabled: (enabled: boolean) => void;
  villageOptions: Option[];
  addBankAccount: () => void;
  selectedFarmId: string;
  setSelectedFarmId: (id: string) => void;
  selectedAccountIds: string[];
  setSelectedAccountIds: (ids: string[]) => void;
  showNewFarmForm: boolean;
  handleToggleNewFarmForm: () => void;
  showNewBankAccountForm: boolean;
  handleToggleNewAccountForm: () => void;
};

export const FarmerSection = ({
  farmerState,
  farmState,
  newBankAccounts,
  setNewBankAccounts,
  searchResults,
  isLoading,
  existingFarms,
  existingAccounts,
  handleSelectFarmer,
  handleClear,
  isSearchEnabled,
  setIsSearchEnabled,
  villageOptions,
  addBankAccount,
  selectedFarmId,
  setSelectedFarmId,
  selectedAccountIds,
  setSelectedAccountIds,
  showNewFarmForm,
  handleToggleNewFarmForm,
  showNewBankAccountForm,
  handleToggleNewAccountForm,
}: Props) => {
  const [farmerData, setFarmerData] = farmerState;
  const [farmData, setFarmData] = farmState;

  const handleFarmerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFarmerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFarmData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewBankChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newAccounts = [...newBankAccounts];
    newAccounts[index] = {
      ...newAccounts[index],
      [name]: value,
    };
    setNewBankAccounts(newAccounts);
  };

  const removeBankAccount = (indexToRemove: number) => {
    setNewBankAccounts((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleAccountSelection = (accountId: string) => {
    setSelectedAccountIds(
      selectedAccountIds.includes(accountId)
        ? selectedAccountIds.filter((id) => id !== accountId)
        : [...selectedAccountIds, accountId],
    );
  };

  const isExistingFarmer = isSearchEnabled && farmerData.id;

  const farmOptions = existingFarms.map((farm) => ({
    value: String(farm.farm_id),
    label: farm.location_name,
  }));

  const accountOptions = existingAccounts.map((account) => ({
    value: String(account.account_id),
    label: `${account.account_name} - ****${String(account.account_no).slice(-4)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* ... Content remains same, stripped of error lines ... */}
      {/* This component is large, assuming you have the JSX from previous step but needed 'any' fix */}
      {/* I am returning the FULL corrected file to be safe */}
      
      {/* --- Farmer Details Section --- */}
      <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 grid place-items-center rounded-2xl bg-primary-container shrink-0">
              <User className="w-6 h-6 text-on-primary-container" />
            </div>
            <h2 className="text-[1.75rem] font-normal text-on-surface">
              Farmer Details
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Search className="w-5 h-5 text-on-surface-variant" />
            <label
              htmlFor="search-toggle"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="search-toggle"
                className="sr-only peer"
                checked={isSearchEnabled}
                onChange={(e) => setIsSearchEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-outline rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative md:col-span-2">
            <Input
              type="tel"
              id="mobile"
              name="mobile"
              label={isSearchEnabled ? "Search by Phone No." : "Phone No."}
              value={farmerData.mobile}
              onChange={handleFarmerChange}
              required
              readOnly={!!farmerData.id}
            />
            <div className="absolute top-0 right-4 h-full flex items-center z-10">
              {isLoading && (
                <LoaderCircle className="animate-spin text-on-surface-variant" />
              )}
              {farmerData.id && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full hover:bg-black/10"
                >
                  <X className="text-on-surface-variant" />
                </button>
              )}
            </div>
            {isSearchEnabled && searchResults.length > 0 && !farmerData.id && (
              <div className="absolute z-20 w-full mt-1 bg-surface-container border border-outline rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((f) => (
                  <div
                    key={f.farmer_id}
                    onClick={() => handleSelectFarmer(f)}
                    className="px-4 py-3 cursor-pointer hover:bg-primary/10"
                  >
                    <p className="font-medium text-on-surface">{f.name}</p>
                    <p className="text-sm text-on-surface-variant">
                      {f.mobile_number}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Input
            type="text"
            id="name"
            name="name"
            label="Name of Farmer"
            value={farmerData.name}
            onChange={handleFarmerChange}
            required
          />
          <Input
            type="text"
            id="aadhar"
            name="aadhar"
            label="Aadhar No. of Farmer"
            value={farmerData.aadhar}
            onChange={handleFarmerChange}
            required
          />
          <Textarea
            id="address"
            name="address"
            label="Home Address"
            value={farmerData.address}
            onChange={handleFarmerChange}
            required
            className="md:col-span-2"
          />
        </div>
      </div>

      {/* --- Farm Details Section --- */}
      <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 grid place-items-center rounded-2xl bg-tertiary-container">
              <Tractor className="w-6 h-6 text-on-tertiary-container" />
            </div>
            <h2 className="text-[1.75rem] font-normal text-on-surface">
              Farm Details
            </h2>
          </div>
          {isExistingFarmer && (
            <button
              type="button"
              onClick={handleToggleNewFarmForm}
              className="inline-flex items-center justify-center px-4 py-2 text-sm border border-outline text-primary font-medium rounded-full hover:bg-primary/10 transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {showNewFarmForm ? "Cancel" : "Add New Farm"}
            </button>
          )}
        </div>

        {isExistingFarmer && !showNewFarmForm ? (
          <SearchableSelect
            id="farm_id"
            name="farm_id"
            label="Choose an existing farm"
            options={farmOptions}
            value={selectedFarmId}
            onChange={setSelectedFarmId}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              id="villageId"
              name="villageId"
              label="Village"
              options={villageOptions}
              value={farmData.villageId}
              onChange={(value: string) =>
                setFarmData((prev) => ({ ...prev, villageId: value }))
              }
            />
            <Input
              type="number"
              id="area"
              name="area"
              label="Area of Farm (Vigha)"
              value={farmData.area}
              onChange={handleFarmChange}
              onWheel={(e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()}
              required
            />
            <Textarea
              id="location"
              name="location"
              label="Farm Address"
              value={farmData.location}
              onChange={handleFarmChange}
              required
              className="md:col-span-2"
            />
          </div>
        )}
      </div>

      {/* --- Bank Details Section --- */}
      <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 grid place-items-center rounded-2xl bg-primary-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24"
                fill="none"
                stroke="#21005D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h2 className="text-[1.75rem] font-normal text-on-surface">
              Bank Details
            </h2>
          </div>
          {isExistingFarmer && (
            <button
              type="button"
              onClick={handleToggleNewAccountForm}
              className="inline-flex items-center justify-center px-4 py-2 text-sm border border-outline text-primary font-medium rounded-full hover:bg-primary/10 transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {showNewBankAccountForm ? "Cancel New" : "Add New Account"}
            </button>
          )}
        </div>

        {isExistingFarmer && (
          <div className="space-y-2 border-b border-outline/30 pb-6 mb-6">
            <p className="text-sm text-on-surface-variant">
              Select existing accounts:
            </p>
            {accountOptions.length > 0 ? (
              accountOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 rounded-lg hover:bg-primary/10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={selectedAccountIds.includes(option.value)}
                    onChange={() => handleAccountSelection(option.value)}
                  />
                  <div className="w-5 h-5 border-2 border-outline rounded flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary">
                    <Check className="w-3 h-3 text-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                  <span className="ml-3 text-on-surface">{option.label}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-2">
                No existing accounts found.
              </p>
            )}
          </div>
        )}

        {(!isExistingFarmer || showNewBankAccountForm) && (
          <>
            {newBankAccounts.map((account, index) => {
              const isMismatch =
                account.name &&
                account.confirmName &&
                account.name !== account.confirmName;

              return (
                <div
                  key={index}
                  className="relative border-b border-outline/30 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0"
                >
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeBankAccount(index)}
                      className="absolute top-0 right-0 p-2 text-error hover:bg-error/10 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-sm font-medium text-primary mb-2">
                    New Account #{index + 1}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      id={`name_bank_new_${index}`}
                      name="name"
                      label="Name in Bank Account"
                      value={account.name}
                      onChange={(e) => handleNewBankChange(index, e)}
                      required
                    />

                    <div className="relative">
                      <Input
                        type="text"
                        id={`name_confirm_new_${index}`}
                        name="confirmName"
                        label="Confirm Name"
                        value={account.confirmName || ""}
                        onChange={(e) => handleNewBankChange(index, e)}
                        required
                        className={
                          isMismatch
                            ? "border-error text-error focus-within:border-error"
                            : ""
                        }
                      />
                      {isMismatch && (
                        <p className="absolute -bottom-5 left-1 text-xs text-error font-medium animate-pulse">
                          Names do not match!
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <Input
                      type="text"
                      id={`number_new_${index}`}
                      name="number"
                      label="Bank Account No."
                      value={account.number}
                      onChange={(e) => handleNewBankChange(index, e)}
                      required
                    />
                    <Input
                      type="text"
                      id={`ifsc_new_${index}`}
                      name="ifsc"
                      label="IFSC Code"
                      value={account.ifsc}
                      onChange={(e) => handleNewBankChange(index, e)}
                      required
                    />
                    <Input
                      type="text"
                      id={`bankName_new_${index}`}
                      name="bankName"
                      label="Bank Name"
                      value={account.bankName}
                      onChange={(e) => handleNewBankChange(index, e)}
                      required
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end mt-2 ">
              <button
                type="button"
                onClick={addBankAccount}
                className="btn inline-flex items-center justify-center px-6 py-3 border border-outline text-primary font-medium rounded-full hover:bg-primary/10 transition-colors "
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Another Account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};