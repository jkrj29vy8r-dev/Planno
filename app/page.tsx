"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  LogOut,
  Mail,
  Scissors,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { ThemeToggle } from "@/components/theme-toggle";

const services = [
  {
    icon: Scissors,
    name: "Tuns clasic",
    description: "Tuns și styling, pentru orice ocazie.",
    duration: "45 min",
    price: "100 RON",
  },
  {
    icon: Sparkles,
    name: "Îngrijire barbă",
    description: "Conturare, ras clasic cu briciul, ulei de îngrijire.",
    duration: "30 min",
    price: "70 RON",
  },
  {
    icon: Clock,
    name: "Pachet complet",
    description: "Tuns, barbă și spălare — pentru o oră fără grabă.",
    duration: "75 min",
    price: "150 RON",
  },
];

export default function Home() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isBooking, setIsBooking] = React.useState(false);

  const handleConfirmBooking = () => {
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setModalOpen(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-[15px] font-semibold tracking-tight">Planno</span>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Dropdown>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon" magnetic={false} aria-label="Meniu cont">
                  <User className="size-4" />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Salon Bella</DropdownLabel>
                <DropdownItem icon={<User className="size-4" />}>Profil</DropdownItem>
                <DropdownItem icon={<Settings className="size-4" />}>Setări</DropdownItem>
                <DropdownSeparator />
                <DropdownItem icon={<LogOut className="size-4" />} destructive>
                  Deconectare
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-5"
        >
          <span className="rounded-full border border-border/40 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            Design system
          </span>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance">
            Rezervări, fără fricțiune.
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Componentele de bază ale platformei Planno — construite pentru claritate, viteză
            și o experiență care se simte la fel de bine la 2 dimineața cât și la prânz.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button size="lg" onClick={() => setModalOpen(true)}>
              Rezervă o programare
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline">
              Vezi documentația
            </Button>
          </div>
        </motion.section>

        <section className="mt-24 space-y-6">
          <h2 className="text-sm font-medium text-muted-foreground">Servicii</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {services.map((service) => (
              <Card key={service.name} hover>
                <CardHeader>
                  <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <service.icon className="size-4" />
                  </div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardFooter className="justify-between border-t border-border/40 pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {service.duration}
                  </span>
                  <span className="font-mono text-sm font-medium">{service.price}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-6">
          <h2 className="text-sm font-medium text-muted-foreground">Butoane</h2>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-6">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Anulează</Button>
              <Button variant="link">Link</Button>
              <Button isLoading>Se salvează</Button>
              <Button size="icon" variant="outline" aria-label="Căutare">
                <Search className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-24 space-y-6 pb-24">
          <h2 className="text-sm font-medium text-muted-foreground">Câmpuri</h2>
          <Card>
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <Input label="Nume complet" placeholder="Ana Popescu" />
              <Input
                label="Email"
                type="email"
                placeholder="ana@exemplu.ro"
                leftIcon={<Mail className="size-4" />}
              />
              <Input
                label="Data programării"
                type="date"
                leftIcon={<Calendar className="size-4" />}
                hint="Alege o zi din următoarele 30 de zile."
              />
              <Input label="Cod promoțional" placeholder="PLANNO10" error="Acest cod a expirat." />
            </CardContent>
          </Card>
        </section>
      </main>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalHeader>
          <ModalTitle>Confirmă programarea</ModalTitle>
          <ModalDescription>Tuns clasic — 45 min, mâine la 14:00, Salon Bella.</ModalDescription>
        </ModalHeader>

        <Input label="Nume" placeholder="Numele tău" defaultValue="Ana Popescu" />

        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isBooking}>
            Anulează
          </Button>
          <Button onClick={handleConfirmBooking} isLoading={isBooking}>
            Confirmă
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
