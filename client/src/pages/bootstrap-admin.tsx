import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function BootstrapAdmin() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/bootstrap-superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bootstrap-token": token },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: data.message || "Berhasil! Silakan logout & login ulang." });
      } else {
        let msg = data.error || `Error ${res.status}`;
        if (data.debug) {
          msg += `\n\n🔍 Debug info:\n• Token yang Anda kirim: ${data.debug.providedLength} karakter (mulai "${data.debug.providedFirst3}…", akhir "…${data.debug.providedLast3}")\n• Token di server: ${data.debug.expectedLength} karakter (mulai "${data.debug.expectedFirst3}…", akhir "…${data.debug.expectedLast3}")`;
          if (data.debug.providedLength !== data.debug.expectedLength) {
            msg += `\n\n⚠️ Panjang berbeda ${Math.abs(data.debug.providedLength - data.debug.expectedLength)} karakter — kemungkinan ada karakter ter-skip/ter-tambah saat paste.`;
          }
        }
        setResult({ ok: false, message: msg });
      }
    } catch (err: any) {
      setResult({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-600 flex items-center justify-center mb-3">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl">Bootstrap Super Admin</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Promote sebuah akun jadi superadmin. Butuh token rahasia yang tersimpan di server.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email user yang akan dipromote</Label>
              <Input
                id="email"
                type="email"
                placeholder="penshopx@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="token">Bootstrap Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Paste token rahasia di sini"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="off"
                data-testid="input-token"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Token sama dengan yang Anda set di Replit Secrets sebagai <code>BOOTSTRAP_ADMIN_TOKEN</code>.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !token}
              data-testid="button-promote"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <>Promote ke Super Admin</>
              )}
            </Button>

            {result && (
              <Alert variant={result.ok ? "default" : "destructive"} className={result.ok ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : ""}>
                {result.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription data-testid="text-result" className="whitespace-pre-line">
                  {result.message}
                  {result.ok && (
                    <div className="mt-3">
                      <a href="/api/logout" className="underline font-semibold text-emerald-700 dark:text-emerald-400">
                        Logout sekarang →
                      </a>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
