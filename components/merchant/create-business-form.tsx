"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { categoryOptions } from "@/lib/categories";
import { createMerchantAction } from "@/lib/actions/merchant";

/**
 * The one-time step between a merchant-role signup and a real
 * dashboard. Only what the storefront actually needs to not look
 * empty on day one is required (name, category, city); contact
 * details are optional here since there's no settings page yet to
 * edit them from -- forcing them now would just be friction with no
 * later fallback. Working hours, logo, and cover photo all keep the
 * schema's own defaults and are editable from the dashboard afterward.
 */
export function CreateBusinessForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const result = await createMerchantAction({
        businessName,
        category,
        city,
        address,
        phone,
        email,
        description,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch {
      setError("Nu am putut crea afacerea. Verifică conexiunea și încearcă din nou.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-5 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Numele afacerii"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          placeholder="Gentleman's Barber Club"
          required
        />
        <Select
          label="Categorie"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        >
          <option value="" disabled>
            Alege o categorie
          </option>
          {categoryOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Oraș"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Roman"
        required
      />

      <Input
        label="Adresă (opțional)"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="Str. Republicii 12"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Telefon (opțional)"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="07xx xxx xxx"
        />
        <Input
          label="Email (opțional)"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="contact@afacerea-ta.ro"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="business-description" className="text-sm font-medium text-foreground/90">
          Descriere (opțional)
        </label>
        <textarea
          id="business-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Câteva rânduri despre afacerea ta..."
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all duration-150 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" isLoading={saving}>
        Creează afacerea
      </Button>
    </form>
  );
}
