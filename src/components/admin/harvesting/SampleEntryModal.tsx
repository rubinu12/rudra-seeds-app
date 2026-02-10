"use client";

import { useState } from "react";
import Modal from "@/src/components/ui/Modal";
import {
  ChevronRight,
  FlaskConical,
  RefreshCw,
  LoaderCircle,
  ArrowLeft,
  Save,
} from "lucide-react";
import {
  CycleForSampleEntry,
  submitAdminSampleData,
} from "@/src/app/admin/actions/sample-actions";
import FloatingLabelInput from "@/src/components/ui/FloatingLabelInput"; // Standardized Input
import FloatingLabelSelect from "@/src/components/ui/FloatingLabelSelect"; // Standardized Select

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForSampleEntry[];
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
};

export default function SampleEntryModal({
  isOpen,
  onClose,
  cycles,
  onRefresh,
  isRefreshing,
}: Props) {
  const [selectedCycle, setSelectedCycle] =
    useState<CycleForSampleEntry | null>(null);

  const ModalHeader = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {selectedCycle && (
          <button
            onClick={() => setSelectedCycle(null)}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
        )}
        <h2 className="text-xl font-medium text-on-surface">
          {selectedCycle
            ? `Quality Entry: ${selectedCycle.farmer_name}`
            : "Pending Sample Entry"}
        </h2>
      </div>
      {!selectedCycle && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full text-on-surface-variant hover:bg-black/10 transition-colors"
        >
          {isRefreshing ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ModalHeader}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {!selectedCycle ? (
          // LIST VIEW
          cycles.length > 0 ? (
            cycles.map((cycle) => (
              <button
                key={cycle.crop_cycle_id}
                onClick={() => setSelectedCycle(cycle)}
                className="w-full text-left p-4 rounded-xl bg-surface hover:bg-primary/5 border border-outline/20 transition-all group"
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-on-surface text-base truncate">
                      {cycle.farmer_name}
                    </p>
                    <p className="text-sm text-on-surface-variant truncate">
                      {cycle.seed_variety}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary shrink-0">
                    <FlaskConical className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-tight">
                      Add Details
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-on-surface-variant py-8 font-medium">
              {isRefreshing ? "Refreshing list..." : "No pending samples."}
            </p>
          )
        ) : (
          // FORM VIEW (Replacing the Redirection)
          <SampleFormEmbedded
            cycle={selectedCycle}
            onComplete={() => {
              setSelectedCycle(null);
              onRefresh();
            }}
          />
        )}
      </div>
    </Modal>
  );
}

function SampleFormEmbedded({
  cycle,
  onComplete,
}: {
  cycle: CycleForSampleEntry;
  onComplete: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    formData.append("cropCycleId", cycle.crop_cycle_id.toString());

    const res = await submitAdminSampleData(formData);
    if (res.success) {
      onComplete();
    } else {
      setErrorMsg(res.message ?? "");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fadeIn py-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        <FloatingLabelInput
          label="Moisture (%)"
          name="moisture"
          type="number"
          step="0.01"
          required
          id={""}
        />
        <FloatingLabelInput
          label="Purity (%)"
          name="purity"
          type="number"
          step="0.01"
          required
          id={""}
        />
        <FloatingLabelInput
          label="Dust (%)"
          name="dust"
          type="number"
          step="0.01"
          required
          id={""}
        />

        <FloatingLabelSelect label="Color Grade" name="colors" required id={""}>
          <option value="White">White (સફેદ)</option>
          <option value="Good">Good (સારો)</option>
          <option value="Excellent">Excellent (ઉત્તમ)</option>
        </FloatingLabelSelect>

        <FloatingLabelSelect
          label="Non-Seed (બિન-બીજ)"
          name="non_seed"
          required
          className="col-span-2"
          id={""}
        >
          <option value="Rare">Rare (નહિવત્)</option>
          <option value="Less">Less (ઓછું)</option>
          <option value="High">High (વધુ)</option>
        </FloatingLabelSelect>
      </div>

      <FloatingLabelInput
        label="Temporary Price (Admin Only)"
        name="temporary_price_per_man"
        type="number"
        step="0.01"
        placeholder=" " // Required for float label
        id={""}
      />

      <div className="space-y-1">
        <label className="text-xs font-medium text-on-surface-variant px-1">
          Remarks
        </label>
        <textarea
          name="remarks"
          rows={2}
          className="w-full p-3 rounded-xl border border-outline/30 bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
          placeholder="Any notes about sample quality..."
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500 font-medium px-1">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
      >
        {isSaving ? (
          <LoaderCircle className="animate-spin w-5 h-5" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        Confirm & Save Sample
      </button>
    </form>
  );
}
