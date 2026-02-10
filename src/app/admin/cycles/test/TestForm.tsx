// app/admin/cycles/test/TestForm.tsx
"use client";

import { useActionState, useState } from "react";
import type { Landmark, SeedVariety } from "@/src/lib/definitions";
import { createTestCycle } from "./actions";

export function TestForm({
  landmarks,
  seedVarieties,
}: {
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
}) {
  const [state, formAction] = useActionState(createTestCycle, { message: "" });
  const [landmarkId, setLandmarkId] = useState("");
  const [seedId, setSeedId] = useState("");

  // This handler will now be very fast because the data is already in the component.
  const handleLandmarkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(
      `[CLIENT LOG] User is selecting Landmark. Timestamp: ${Date.now()}`,
    );
    setLandmarkId(e.target.value);
    // This log should appear instantly after the one above.
    console.log(
      `[CLIENT LOG] Landmark state updated in browser. New value: ${e.target.value}. Timestamp: ${Date.now()}`,
    );
  };

  const handleVarietyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(
      `[CLIENT LOG] User is selecting Variety. Timestamp: ${Date.now()}`,
    );
    setSeedId(e.target.value);
    console.log(
      `[CLIENT LOG] Variety state updated in browser. New value: ${e.target.value}. Timestamp: ${Date.now()}`,
    );
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold">Dropdown Performance & Action Test</h1>
      <p className="mt-2 text-gray-600">
        This page isolates the dropdowns to diagnose lag. Check your browser and
        terminal consoles for logs.
      </p>

      <form action={formAction} className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="landmark_id"
            className="block text-sm font-medium text-gray-700"
          >
            Landmark (Loaded: {landmarks.length})
          </label>
          <select
            id="landmark_id"
            name="landmark_id"
            value={landmarkId}
            onChange={handleLandmarkChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
            required
          >
            <option value="">Select a landmark...</option>
            {landmarks.map((l) => (
              <option key={l.landmark_id} value={l.landmark_id}>
                {l.landmark_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="seed_id"
            className="block text-sm font-medium text-gray-700"
          >
            Seed Variety (Loaded: {seedVarieties.length})
          </label>
          <select
            id="seed_id"
            name="seed_id"
            value={seedId}
            onChange={handleVarietyChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
            required
          >
            <option value="">Select a variety...</option>
            {seedVarieties.map((s) => (
              <option key={s.seed_id} value={s.seed_id}>
                {s.variety_name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700"
        >
          Create Test Cycle Entry
        </button>

        {state.message && (
          <div className="mt-4 p-4 rounded-md bg-gray-100 text-center">
            <p className="font-semibold">Server Response:</p>
            <p className="text-sm text-gray-700">{state.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
