import { addFarmer } from "./actions";

export default function AddFarmerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="mb-8 text-2xl font-semibold">Add a New Farmer</h1>
      
      {/* THIS IS THE IMPORTANT PART: Notice there is NO onSubmit prop here. */}
      <form action={addFarmer} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-2 block">Farmer Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="rounded border p-2 text-black"
            required
          />
        </div>
        <div>
          <label htmlFor="mobile" className="mb-2 block">Mobile Number</label>
          <input
            type="text"
            id="mobile"
            name="mobile"
            className="rounded border p-2 text-black"
            required
          />
        </div>
        <div>
          <label htmlFor="village" className="mb-2 block">Village</label>
          <input
            type="text"
            id="village"
            name="village"
            className="rounded border p-2 text-black"
            required
          />
        </div>

        <button 
          type="submit"
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Farmer
        </button>
      </form>
    </main>
  );
}