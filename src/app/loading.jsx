// src/app/loading.jsx
export default function RootLoading() {
    return (
        <div className="p-4 md:p-8 animate-pulse">
            <div className="h-8 w-40 bg-gray-800 rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="h-24 bg-gray-800 rounded-2xl" />
                <div className="h-24 bg-gray-800 rounded-2xl" />
                <div className="h-24 bg-gray-800 rounded-2xl" />
            </div>
            <div className="h-6 w-56 bg-gray-800 rounded-lg mb-4" />
            <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-800 rounded-xl" />
                ))}
            </div>
        </div>
    );
}