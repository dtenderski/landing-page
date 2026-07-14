const SCALEV_API_URL = "https://api.scalev.id/v2";

export interface ScalevProductResult {
  id: number;
  slug: string;
  name: string;
  checkoutUrl: string;
}

export async function createScalevProduct(params: {
  name: string;
  description?: string;
  price: number;
  variantName?: string;
}): Promise<ScalevProductResult> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) throw new Error("SCALEV_API_KEY tidak ditemukan di environment.");

  const body = {
    name: params.name,
    public_name: params.name,
    description: params.description || params.name,
    item_type: "digital",
    status: "active",
    variants: [{ name: params.variantName || params.name, price: params.price }],
  };

  const res = await fetch(`${SCALEV_API_URL}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;
  if (!res.ok || json.code !== 200) {
    const errMsg = JSON.stringify(json?.error || json?.status || json);
    throw new Error(`Scalev API error: ${errMsg}`);
  }

  const product = json.data;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    checkoutUrl: `https://app.scalev.com/checkout/${product.slug}`,
  };
}
