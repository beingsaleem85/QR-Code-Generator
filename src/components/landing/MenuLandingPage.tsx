import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";
import { Card } from "@/components/ui/Card";

interface MenuLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface MenuItemPayload {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  photo?: { path?: string; fileName?: string };
}

const UNCATEGORIZED = "";

export async function MenuLandingPage({ payloadData }: MenuLandingPageProps) {
  const title = typeof payloadData.title === "string" ? payloadData.title : undefined;
  const description =
    typeof payloadData.description === "string" ? payloadData.description : undefined;
  const items = (Array.isArray(payloadData.items) ? payloadData.items : []) as MenuItemPayload[];

  const resolved = await Promise.all(
    items.map(async (item) => ({
      ...item,
      photoUrl: item.photo?.path ? await createSignedAssetUrl("qr-gallery", item.photo.path) : null,
    })),
  );

  const groups = new Map<string, typeof resolved>();
  for (const item of resolved) {
    const key = item.category?.trim() || UNCATEGORIZED;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="text-center">
          {title ? <p className="text-xl font-semibold text-foreground">{title}</p> : null}
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>

        {items.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This menu isn&apos;t available right now.
            </p>
          </Card>
        ) : (
          Array.from(groups.entries()).map(([category, groupItems]) => (
            <div key={category || "uncategorized"} className="flex flex-col gap-2">
              {category ? (
                <p className="text-sm font-semibold text-foreground">{category}</p>
              ) : null}
              {groupItems.map((item, index) => (
                <Card key={`${item.name}-${index}`} className="flex gap-3 p-3">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL.
                    <img
                      src={item.photoUrl}
                      alt={item.name ?? ""}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {item.price ? (
                        <span className="shrink-0 text-sm text-muted-foreground">{item.price}</span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
