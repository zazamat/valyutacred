"use client";

import React, { useMemo, useState } from "react";
import {
  Calculator,
  ShieldCheck,
  Landmark,
  ArrowRight,
  CheckCircle2,
  Users,
  BadgePercent,
  Newspaper,
  ExternalLink,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const BANKS = [
  {
    id: "kapital-bank",
    name: "Kapital Bank",
    products: [
      { id: "cash", name: "Nağd kredit", rate: 15.9, min: 1000, max: 30000, months: 48 },
      { id: "auto", name: "Avtokredit", rate: 12.5, min: 5000, max: 100000, months: 60 },
    ],
  },
  {
    id: "abb",
    name: "ABB",
    products: [
      { id: "cash", name: "Nağd kredit", rate: 14.9, min: 1000, max: 40000, months: 60 },
      { id: "business", name: "Biznes krediti", rate: 17.5, min: 5000, max: 150000, months: 36 },
    ],
  },
  {
    id: "unibank",
    name: "Unibank",
    products: [
      { id: "cash", name: "Nağd kredit", rate: 16.2, min: 500, max: 25000, months: 48 },
      { id: "mortgage", name: "İpoteka", rate: 10, min: 30000, max: 250000, months: 240 },
    ],
  },
];

const HERO_STATS = [
  { value: "N", label: "kredit məhsulu" },
  { value: "N", label: "təşkilat" },
  { value: "N", label: "müraciət" },
  { value: "24/7", label: "müraciət imkanı" },
];

const FEATURED_NEWS = {
  tag: "Günün xəbəri",
  bank: "Unibank",
  title: "Unibank 10% ilə ipoteka krediti təklif edir",
  excerpt:
    "Bank yeni kampaniya çərçivəsində ipoteka məhsulu üzrə daha aşağı faiz, çevik müddət və sürətli ilkin baxılma imkanı təqdim edir. Davamını popup pəncərəsində oxuya bilərsiniz.",
  image:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  sourceUrl: "#",
  content:
    "Unibank yeni ipoteka təklifi ilə mənzil maliyyələşdirilməsi üzrə daha sərfəli şərtlər təqdim etdiyini açıqlayıb. Kampaniya çərçivəsində müştərilər daha aşağı faiz dərəcəsi, uzunmüddətli ödəmə planı və sürətli ilkin baxılma imkanından yararlana bilərlər. Bu təklif xüsusilə mənzil almağı planlaşdıran və aylıq ödənişini daha optimallaşdırılmış formada qurmaq istəyən istifadəçilər üçün nəzərdə tutulub. Platforma daxilində bu tip xəbərlər həm istifadəçiyə bazardakı təklifləri göstərir, həm də banklar üçün əlavə görünürlük yaradır.",
};

function formatMoney(value) {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function calculateMonthlyPayment(principal, annualRate, months) {
  if (!principal || !months) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

export default function ValyutaCredHomepage() {
  const [bankId, setBankId] = useState("kapital-bank");
  const [productId, setProductId] = useState("cash");
  const [amount, setAmount] = useState("12000");
  const [months, setMonths] = useState("24");
  const [leadType, setLeadType] = useState("exclusive");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isNewsOpen, setIsNewsOpen] = useState(false);

  const selectedBank = useMemo(() => {
    return BANKS.find((bank) => bank.id === bankId) ?? BANKS[0];
  }, [bankId]);

  const selectedProduct = useMemo(() => {
    return (
      selectedBank.products.find((product) => product.id === productId) ??
      selectedBank.products[0]
    );
  }, [selectedBank, productId]);

  const numericAmount = Number(amount) || selectedProduct.min;
  const numericMonths = Number(months) || selectedProduct.months;
  const payment = calculateMonthlyPayment(
    numericAmount,
    selectedProduct.rate,
    numericMonths
  );
  const totalPayment = payment * numericMonths;

  const handleBankChange = (value) => {
    setBankId(value);
    const nextBank = BANKS.find((bank) => bank.id === value);
    if (nextBank) {
      const nextProduct = nextBank.products[0];
      setProductId(nextProduct.id);
      setAmount(String(nextProduct.min));
      setMonths(String(Math.min(nextProduct.months, 24)));
    }
  };

  const handleProductChange = (value) => {
    setProductId(value);
    const nextProduct = selectedBank.products.find(
      (product) => product.id === value
    );
    if (nextProduct) {
      setAmount(String(nextProduct.min));
      setMonths(String(Math.min(nextProduct.months, 24)));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-sm">
              ₼
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-emerald-700">
                ValyutaCred
              </div>
              <div className="text-xs text-slate-500">
                Kredit müqayisə və müraciət platforması
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#calculator" className="transition hover:text-emerald-700">
              Kalkulyator
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-emerald-700"
            >
              Necə işləyir
            </a>
            <a
              href="#featured-news"
              className="transition hover:text-emerald-700"
            >
              Günün xəbəri
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden rounded-xl md:inline-flex">
              Daxil ol
            </Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
              Müraciət et
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_left,rgba(59,130,246,0.08),transparent_25%)]" />
          <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center pt-4 lg:pt-8">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Kredit axtarışı və müraciət üçün vahid platforma
              </div>

              <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Krediti seç, hesabla və müraciəti dərhal göndər
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Əsas məhsulumuz sadədir: uyğun bank və kredit növünü seçirsiniz,
                aylıq ödənişi görürsünüz və müraciətinizi bir axında tamamlayırsınız.
              </p>

              <div className="mt-8 grid max-w-xl gap-3">
                {[
                  "Bank və kredit məhsulunu seç",
                  "Aylıq ödənişi dərhal gör",
                  "Yalnız seçdiyin banka və ya digər banklara müraciət et",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-slate-200"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-2xl bg-emerald-600 px-6 hover:bg-emerald-700"
                >
                  Kalkulyatora başla <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl px-6">
                  Necə işləyir
                </Button>
              </div>
            </div>

            <Card
              id="calculator"
              className="rounded-3xl border-slate-200 bg-white shadow-xl shadow-slate-200/60"
            >
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Kredit kalkulyatoru
                    </h2>
                    <p className="text-sm text-slate-500">
                      Şərtləri seçin, nəticəni dərhal görün
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Bank</Label>
                      <Select value={bankId} onValueChange={handleBankChange}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Bank seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Kredit növü</Label>
                      <Select value={productId} onValueChange={handleProductChange}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Kredit növü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedBank.products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Məbləğ (AZN)</Label>
                      <Input
                        className="h-12 rounded-xl"
                        type="number"
                        value={amount}
                        min={selectedProduct.min}
                        max={selectedProduct.max}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <div className="text-xs text-slate-500">
                        Aralıq: {formatMoney(selectedProduct.min)} –{" "}
                        {formatMoney(selectedProduct.max)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Müddət (ay)</Label>
                      <Input
                        className="h-12 rounded-xl"
                        type="number"
                        value={months}
                        min={1}
                        max={selectedProduct.months}
                        onChange={(e) => setMonths(e.target.value)}
                      />
                      <div className="text-xs text-slate-500">
                        Maksimum müddət: {selectedProduct.months} ay
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
                    <div>
                      <div className="text-sm text-slate-500">İllik faiz</div>
                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {selectedProduct.rate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Aylıq ödəniş</div>
                      <div className="mt-1 text-xl font-bold text-emerald-700">
                        {formatMoney(payment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Cəmi ödəniş</div>
                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {formatMoney(totalPayment)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Kimdən təklif almaq istəyirsiniz?
                    </div>
                    <RadioGroup
                      value={leadType}
                      onValueChange={setLeadType}
                      className="grid gap-3"
                    >
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                        <RadioGroupItem
                          value="exclusive"
                          id="exclusive"
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Yalnız seçdiyim bankdan
                          </div>
                          <div className="text-sm text-slate-500">
                            Müraciət yalnız seçdiyiniz bank üçün nəzərdə tutulur.
                          </div>
                        </div>
                      </label>

                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                        <RadioGroupItem value="shared" id="shared" className="mt-1" />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Digər banklardan da təklif almaq istəyirəm
                          </div>
                          <div className="text-sm text-slate-500">
                            Məlumatlarınız seçiminizə uyğun olaraq banklara təqdim
                            oluna bilər.
                          </div>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ad və soyad</Label>
                      <Input
                        className="h-12 rounded-xl"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Məs: Əhməd Əhmədov"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        className="h-12 rounded-xl"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+994 50 000 00 00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      className="h-12 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@example.com"
                    />
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    Göstərilən nəticə təxmini hesablamadır. Yekun kredit şərtləri
                    bankın daxili qiymətləndirməsinə əsasən dəyişə bilər.
                  </div>

                  <Button
                    size="lg"
                    className="h-12 rounded-2xl bg-emerald-600 text-base hover:bg-emerald-700"
                  >
                    Müraciəti göndər
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {HERO_STATS.map((item) => (
                <Card key={item.label} className="rounded-2xl border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-2xl font-extrabold text-emerald-700">
                      {item.value}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="featured-news" className="border-b bg-slate-50/70">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Günün xəbəri
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  Bank məhsulu üzrə seçilmiş sponsorlu xəbər
                </h2>
              </div>
            </div>

            <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-lg shadow-slate-200/60">
              <CardContent className="p-0">
                <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="p-6 sm:p-8">
                    <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {FEATURED_NEWS.bank}
                    </div>

                    <h3 className="line-clamp-2 text-2xl font-extrabold leading-tight text-slate-950">
                      {FEATURED_NEWS.title}
                    </h3>

                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
                      {FEATURED_NEWS.excerpt}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        className="rounded-2xl bg-slate-900 hover:bg-slate-800"
                        onClick={() => setIsNewsOpen(true)}
                      >
                        Davamını oxu
                      </Button>
                    </div>
                  </div>

                  <div className="relative min-h-[320px] bg-slate-100 md:min-h-full">
                    <img
                      src={FEATURED_NEWS.image}
                      alt={FEATURED_NEWS.title}
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Necə işləyir
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              3 addımda müraciət prosesi
            </h2>
            <p className="mt-3 text-slate-600">
              İstifadəçidən banka qədər bütün axın sadə, aydın və idarə olunan
              şəkildə qurulur.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Landmark,
                title: "Bank və məhsul seçin",
                text: "Uyğun bankı və kredit növünü seçin, məbləği və müddəti təyin edin.",
              },
              {
                icon: BadgePercent,
                title: "Aylıq ödənişi görün",
                text: "Faiz dərəcəsinə əsasən aylıq və ümumi ödəniş məbləği dərhal hesablanır.",
              },
              {
                icon: Users,
                title: "Müraciəti tamamlayın",
                text: "Formanı doldurun və yalnız seçdiyiniz banka və ya digər banklara açıq müraciət edin.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="mb-2 text-sm font-bold text-emerald-700">
                      Addım {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="text-lg font-bold text-emerald-700">ValyutaCred</div>
            <p className="mt-3 max-w-xs text-sm leading-7 text-slate-600">
              Kredit müraciətlərini sadələşdirən və banklarla istifadəçi arasında
              strukturlaşdırılmış axın yaradan platforma.
            </p>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Platforma
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <a href="#calculator" className="block hover:text-emerald-700">
                Kalkulyator
              </a>
              <a href="#how-it-works" className="block hover:text-emerald-700">
                Necə işləyir
              </a>
              <a href="#featured-news" className="block hover:text-emerald-700">
                Günün xəbəri
              </a>
              <a href="#" className="block hover:text-emerald-700">
                Əlaqə
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Hüquqi
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <a href="#" className="block hover:text-emerald-700">
                Məxfilik siyasəti
              </a>
              <a href="#" className="block hover:text-emerald-700">
                İstifadəçi razılaşması
              </a>
              <a href="#" className="block hover:text-emerald-700">
                Cookie siyasəti
              </a>
              <a href="#" className="block hover:text-emerald-700">
                FAQ
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Əlaqə
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div>Bakı, Azərbaycan</div>
              <div>info@valyutacred.az</div>
              <div>+994 12 000 00 00</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-4 py-5 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © 2026 ValyutaCred. Bütün hüquqlar qorunur.
        </div>
      </footer>

      {isNewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sm:px-8">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {FEATURED_NEWS.bank}
                </div>
                <h3 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                  {FEATURED_NEWS.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsNewsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6 sm:px-8">
              <div className="rounded-3xl bg-gradient-to-r from-emerald-50 to-sky-50 p-6">
                <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                  Sponsorlu kontent
                </div>
                <p className="mt-4 text-base leading-8 text-slate-700">
                  {FEATURED_NEWS.content}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={FEATURED_NEWS.sourceUrl} target="_blank" rel="noreferrer">
                    Orijinal xəbəri oxu <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
