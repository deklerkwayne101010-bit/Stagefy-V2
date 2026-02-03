import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Stagefy</h1>
        <p className="text-gray-400 mb-8">Real Estate Media Platform</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
