import { Card } from "@/components/ui/Card";

interface SummaryCard {
  label: string;
  value: string;
}

interface AnalyticsSummaryCardsProps {
  cards: SummaryCard[];
}

export function AnalyticsSummaryCards({ cards }: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-3">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="text-lg font-semibold text-foreground">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}
