// src/components/admin/KeyMetrics.tsx
export default function KeyMetrics() {
  return (
    <div>
      <h3 className="text-base font-medium text-primary mb-2">Key Metrics</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="btn p-4 col-span-1 rounded-m3-large shadow-m3-subtle text-white bg-gradient-to-br from-purple-500 to-indigo-600">
          <h4 className="text-sm font-medium opacity-80">Stock</h4>
          <p className="text-3xl mt-2">View</p>
        </div>
        <div className="btn p-4 col-span-1 rounded-m3-large shadow-m3-subtle text-white bg-gradient-to-br from-sky-500 to-blue-600">
          <h4 className="text-sm font-medium opacity-80">Farmers Registered</h4>
          <p className="text-3xl mt-2">850</p>
        </div>
        <div className="btn p-4 col-span-1 rounded-m3-large shadow-m3-subtle text-white bg-gradient-to-br from-amber-500 to-orange-600">
          <h4 className="text-sm font-medium opacity-80">Area Sown</h4>
          <p className="text-3xl mt-2">6,200 <span className="text-lg">Vigha</span></p>
        </div>
        <div className="btn p-4 col-span-2 rounded-m3-large shadow-m3-subtle text-white bg-gradient-to-br from-teal-500 to-cyan-600">
          <h4 className="text-sm font-medium opacity-80">Top Seed Variety</h4>
          <p className="text-xl">T-91 (Lokwan)</p>
          <p className="text-sm opacity-90">200 bags to 45 farmers</p>
        </div>
        <div className="btn p-4 col-span-1 rounded-m3-large shadow-m3-subtle text-white bg-gradient-to-br from-rose-500 to-pink-600">
          <h4 className="text-sm font-medium opacity-80">On Credit</h4>
          <p className="text-3xl mt-2">42</p>
        </div>
      </div>
    </div>
  );
}