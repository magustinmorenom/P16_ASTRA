import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export default function LayoutPublico({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={instrumentSerif.variable} data-tema="oscuro">
      {children}
    </div>
  );
}
