import { cn } from "@/utils/cn";

export function Card({ className, children }) {
  return (
    <section className={cn("card-glass rounded-2xl p-5 shadow-soft", className)}>
      {children}
    </section>
  );
}
