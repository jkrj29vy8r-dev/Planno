"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { Planni } from "@/components/planni";

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

type BookingFlowState = "form" | "error" | "loading" | "success";

export default function Home() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [flowState, setFlowState] = React.useState<BookingFlowState>("form");
  const [name, setName] = React.useState("Ana Popescu");

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // Reset once the close animation has had time to play, so the
      // content doesn't visibly jump back to the form mid-exit.
      setTimeout(() => setFlowState("form"), 250);
    }
  };

  const handleConfirmBooking = () => {
    if (!name.trim()) {
      setFlowState("error");
      return;
    }
    setFlowState("loading");
    setTimeout(() => {
      setFlowState("success");
      setTimeout(() => setModalOpen(false), 1600);
    }, 1300);
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
          className="flex flex-col items-center gap-10 sm:flex-row sm:justify-between"
        >
          <div className="flex flex-col items-start gap-5">
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
          </div>

          <Planni state="welcome" size={168} message="" className="hidden shrink-0 sm:flex" />
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
          <h2 className="text-sm font-medium text-muted-foreground">Rezervările mele</h2>
          <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <Planni state="empty-state" size={128} message="" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Nicio rezervare încă</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Când rezervi un serviciu, îl vei găsi aici — programări viitoare și istoric,
                tot într-un singur loc.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              Rezervă prima ta programare
            </Button>
          </Card>
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

      <Modal open={modalOpen} onOpenChange={handleModalOpenChange}>
        <AnimatePresence mode="wait">
          {flowState === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ModalHeader>
                <ModalTitle>Confirmă programarea</ModalTitle>
                <ModalDescription>Tuns clasic — 45 min, mâine la 14:00, Salon Bella.</ModalDescription>
              </ModalHeader>

              <Input
                label="Nume"
                placeholder="Numele tău"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <ModalFooter>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Anulează
                </Button>
                <Button onClick={handleConfirmBooking}>Confirmă</Button>
              </ModalFooter>
            </motion.div>
          )}

          {flowState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-4 py-2 text-center"
            >
              <Planni state="error" size={120} message="" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Numele lipsește</p>
                <p className="text-sm text-muted-foreground">
                  Te rugăm completează-ți numele ca să putem confirma programarea.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFlowState("form")}>
                Încearcă din nou
              </Button>
            </motion.div>
          )}

          {flowState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center py-6"
            >
              <Planni state="loading" size={120} />
            </motion.div>
          )}

          {flowState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center py-4"
            >
              <Planni
                state="success"
                size={120}
                message="Rezervare confirmată! Te așteptăm mâine la 14:00."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
}
