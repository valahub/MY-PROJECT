import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  description?: string;
  comingSoon?: string[];
}

export function PlaceholderDashboard({ title, description, comingSoon }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>

      {comingSoon && comingSoon.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coming in upcoming phases</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {comingSoon.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
