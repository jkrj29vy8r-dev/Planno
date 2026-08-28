import { Planni } from "@/components/planni";

export default function MerchantLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Planni state="loading" size={140} message="Pregătim pagina comerciantului..." />
    </div>
  );
}
