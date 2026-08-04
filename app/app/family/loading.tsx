export default function FamilyLoading() {
  return <div aria-label="Carregando conteúdo" aria-busy="true" className="animate-pulse px-1 py-2">
    <div className="h-2.5 w-20 rounded-full bg-[#dce6f2]" /><div className="mt-3 h-8 w-52 rounded-xl bg-[#e4ebf4]" /><div className="mt-3 h-3 w-40 rounded-full bg-[#e8edf4]" />
    <div className="mt-7 grid gap-3"><div className="h-16 rounded-2xl bg-white" /><div className="h-16 rounded-2xl bg-white" /></div>
    <div className="mt-8 grid grid-cols-3 gap-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="mx-auto h-[4.85rem] w-[4.85rem] rounded-full bg-[#dce9f8]" />)}</div>
  </div>;
}
