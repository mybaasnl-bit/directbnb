import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">
            Direct<span className="text-brand">BnB</span>
          </span>
        </div>

        {/* 404 */}
        <div className="text-8xl font-bold text-brand/20 leading-none mb-6 select-none">
          404
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Pagina niet gevonden
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          De pagina die u zoekt bestaat niet of is verplaatst.
          Controleer de URL of ga terug naar het dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/nl/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Terug naar dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Naar homepage
          </Link>
        </div>

      </div>
    </div>
  );
}
