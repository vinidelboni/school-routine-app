export default function DirectionLoading() {
  return <div aria-label="Carregando painel" aria-busy="true" className="animate-pulse">
    <div className="h-3 w-28 rounded-full bg-[#dce6f2]" /><div className="mt-4 h-10 w-72 max-w-full rounded-xl bg-[#e4ebf4]" /><div className="mt-3 h-4 w-96 max-w-full rounded-full bg-[#edf1f6]" />
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 rounded-2xl border border-[#e4eaf2] bg-white" />)}</div>
  </div>;
}
