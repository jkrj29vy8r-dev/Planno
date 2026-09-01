"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { categoryOptions } from "@/lib/categories";
import { updateMerchantProfileAction } from "@/lib/actions/merchant";
import type { Tables } from "@/types/database.types";

export function MerchantProfileForm({ merchant }: { merchant: Tables<"merchants"> }) {
  const [businessName, setBusinessName] = React.useState(merchant.business_name);
  const [category, setCategory] = React.useState(merchant.category);
  const [city, setCity] = React.useState(merchant.city ?? "");
  const [address, setAddress] = React.useState(merchant.address ?? "");
  const [phone, setPhone] = React.useState(merchant.phone ?? "");
  const [description, setDescription] = React.useState(merchant.description ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const result = await updateMerchantProfileAction(merchant.id, {
        businessName,
        category,
        city,
        address,
        phone,
        description,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    } catch {
      // A thrown/rejected action call (offline, or a stale Server
      // Action reference after a redeploy) skips the {error} branch
      // above -- without this "Salvează modificările" would spin
      // forever with no way to retry.
      setError("Nu am putut salva modificările. Verifică conexiunea și încearcă din nou.");
    } finally {
      setSaving(false);
    }
  }

  function onFieldChange<T extends (value: string) => void>(setter: T) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setter(event.target.value);
      setSaved(false);
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Numele afacerii"
          value={businessName}
          onChange={onFieldChange(setBusinessName)}
          required
        />
        <Select label="Categorie" value={category} onChange={onFieldChange(setCategory)} required>
          {categoryOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Oraș" value={city} onChange={onFieldChange(setCity)} required />
        <Input
          label="Telefon (opțional)"
          type="tel"
          value={phone}
          onChange={onFieldChange(setPhone)}
          placeholder="07xx xxx xxx"
        />
      </div>

      <Input
        label="Adresă (opțional)"
        value={address}
        onChange={onFieldChange(setAddress)}
        placeholder="Str. Republicii 12"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="merchant-description" className="text-sm font-medium text-foreground/90">
          Descriere (opțional)
        </label>
        <textarea
          id="merchant-description"
          value={description}
          onChange={onFieldChange(setDescription)}
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all duration-150 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={saving}>
          {saved ? "Salvat" : "Salvează modificările"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}
