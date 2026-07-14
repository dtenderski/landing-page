import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle2, LogOut, AlertTriangle, KeyRound, Phone } from "lucide-react";
import { trackCompleteRegistration, trackLead } from "@/lib/meta-pixel";
import { usePartnerBranding } from "@/hooks/use-partner-branding";

type Mode = "choose" | "login" | "register" | "verify" | "forgot" | "reset";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { partner } = usePartnerBranding();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const returnUrl = searchParams.get("return") || searchParams.get("redirect") || "/dashboard";
  const initialMode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpChannel, setOtpChannel] = useState<"wa" | "email">("wa");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpFallback, setOtpFallback] = useState<string | undefined>(undefined);
  const [emailSendError, setEmailSendError] = useState<string | undefined>(undefined);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetOtpFallback, setResetOtpFallback] = useState<string | undefined>(undefined);

  // Detect existing session so user can switch accounts
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
  });

  const handleSwitchAccount = () => {
    window.location.href = "/api/logout";
  };

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Isi email dan password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login-email", { email, password });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      trackLead({ content_name: "Email Login" });
      navigate(returnUrl);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("needsVerification") || msg.includes("belum diverifikasi")) {
        setPendingEmail(email);
        if (msg.includes('"otpChannel":"email"')) setOtpChannel("email");
        else setOtpChannel("wa");
        setMode("verify");
        toast({ title: "Email belum diverifikasi", description: "Selesaikan verifikasi akun terlebih dahulu." });
      } else {
        toast({ title: "Login gagal", description: msg.replace(/^\d+: /, ""), variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName || !email || !password) {
      toast({ title: "Nama, email, dan password wajib diisi", variant: "destructive" });
      return;
    }
    if (otpChannel === "wa" && !phone) {
      toast({ title: "Nomor WhatsApp wajib diisi", variant: "destructive" });
      return;
    }
    if (otpChannel === "email" && !/@gmail\.com$/i.test(email.trim())) {
      toast({ title: "Verifikasi email hanya untuk Gmail", description: "Gunakan alamat @gmail.com, atau pilih verifikasi via WhatsApp.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password minimal 8 karakter", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Password tidak cocok", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", { email, phone, password, firstName, lastName, otpChannel });
      setPendingEmail(email);
      setOtpFallback(res?.otpFallback);
      setEmailSendError(undefined);
      setMode("verify");
      const channelLabel = otpChannel === "email" ? `email ${email}` : `WhatsApp ${phone}`;
      if (res?.otpFallback) {
        toast({ title: "OTP dibuat", description: "Lihat kode OTP yang tampil di layar (layanan pengiriman belum dikonfigurasi)." });
      } else {
        toast({ title: "Kode OTP dikirim!", description: `Cek ${channelLabel} untuk kode verifikasi.` });
      }
    } catch (err: any) {
      const msg = (err?.message || "").replace(/^\d+: /, "");
      const isSendError = msg.toLowerCase().includes("gagal terkirim") || msg.toLowerCase().includes("whatsapp") || msg.toLowerCase().includes("email");
      if (isSendError) {
        // OTP was created on the server — move to verify screen with error banner
        setPendingEmail(email);
        setEmailSendError(msg || "Kode OTP gagal terkirim. Coba lagi dalam beberapa menit.");
        setOtpFallback(undefined);
        setMode("verify");
      } else {
        toast({ title: "Registrasi gagal", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: "Kode OTP harus 6 digit", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/verify-email", { email: pendingEmail, code: otp });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      trackCompleteRegistration({ content_name: "Email Registration" });
      toast({ title: "Email terverifikasi!", description: `Selamat datang di ${partner?.brandName || "Gustafta"}.` });
      navigate(returnUrl);
    } catch (err: any) {
      toast({ title: "Verifikasi gagal", description: (err?.message || "").replace(/^\d+: /, ""), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail) {
      toast({ title: "Masukkan email Anda", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/request-reset", { email: resetEmail });
      setResetOtpFallback(res?.otpFallback);
      setMode("reset");
      if (res?.otpFallback) {
        toast({ title: "Kode reset dibuat", description: "Lihat kode OTP di layar." });
      } else {
        toast({ title: "Kode reset dikirim!", description: "Cek WhatsApp yang terdaftar pada akun Anda." });
      }
    } catch (err: any) {
      toast({ title: "Gagal", description: (err?.message || "").replace(/^\d+: /, ""), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp || resetOtp.length !== 6) {
      toast({ title: "Kode OTP harus 6 digit", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Password minimal 8 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Konfirmasi password tidak cocok", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { email: resetEmail, code: resetOtp, newPassword });
      toast({ title: "Password berhasil direset!", description: "Silakan login dengan password baru." });
      setMode("login");
      setEmail(resetEmail);
      setPassword("");
      setResetEmail(""); setResetOtp(""); setNewPassword(""); setConfirmNewPassword(""); setResetOtpFallback(undefined);
    } catch (err: any) {
      toast({ title: "Reset gagal", description: (err?.message || "").replace(/^\d+: /, ""), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/resend-otp", { email: pendingEmail });
      setOtpFallback(res?.otpFallback);
      setEmailSendError(undefined);
      if (res?.otpFallback) {
        toast({ title: "OTP baru dibuat", description: "Lihat kode OTP yang tampil di layar." });
      } else {
        toast({ title: "Kode OTP baru dikirim", description: otpChannel === "email" ? "Cek email Anda." : "Cek WhatsApp Anda." });
      }
    } catch (err: any) {
      const msg = (err?.message || "").replace(/^\d+: /, "");
      setEmailSendError(msg || (otpChannel === "email" ? "Kode OTP gagal terkirim ke email. Coba lagi dalam beberapa menit." : "Kode OTP gagal terkirim ke WhatsApp. Coba lagi dalam beberapa menit."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm border border-border">
          <img src={partner?.logoUrl || "/logo-gustafta.png"} alt={partner?.brandName || "Gustafta"} className="h-8 w-8 object-contain" />
        </div>
        <span className="text-xl font-bold" style={{ color: partner?.primaryColor || undefined }}>{partner?.brandName || "Gustafta"}</span>
      </a>

      <div className="w-full max-w-sm">
        {/* Switch account banner — shown only if a session already exists */}
        {currentUser?.email && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm flex items-start gap-3" data-testid="banner-switch-account">
            <div className="flex-1 min-w-0">
              <p className="text-amber-900 dark:text-amber-200 font-medium">Sudah masuk sebagai</p>
              <p className="text-amber-700 dark:text-amber-300 truncate">{currentUser.email}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate("/dashboard")} data-testid="button-continue-session">
                Lanjutkan
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-amber-700 dark:text-amber-300" onClick={handleSwitchAccount} data-testid="button-switch-account">
                <LogOut className="h-3 w-3" /> Ganti akun
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">

          {/* ── CHOOSE MODE ── */}
          {mode === "choose" && (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold">Masuk ke {partner?.brandName || "Gustafta"}</h1>
                <p className="text-sm text-muted-foreground">Gunakan email & password Anda</p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-11 gap-3 font-medium"
                  onClick={() => setMode("login")}
                  data-testid="button-login-email"
                >
                  <Mail className="h-4 w-4" />
                  Masuk dengan Email
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <button
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode("register")}
                  data-testid="button-go-register"
                >
                  Daftar sekarang
                </button>
              </p>
            </>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setMode("choose")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold">Masuk</h1>
                  <p className="text-xs text-muted-foreground">Gunakan email & password Anda</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      data-testid="input-login-email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      placeholder="Password Anda"
                      className="pl-9 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={loading} data-testid="button-submit-login">
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <button className="text-primary font-medium hover:underline" onClick={() => setMode("register")}>
                  Belum punya akun? Daftar
                </button>
                <button
                  className="text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => { setResetEmail(email); setMode("forgot"); }}
                  data-testid="link-forgot-password"
                >
                  Lupa password?
                </button>
              </div>
            </>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setMode("choose")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold">Buat Akun</h1>
                  <p className="text-xs text-muted-foreground">Daftar dengan email & password</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-firstname">Nama Depan *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-firstname"
                        placeholder="Budi"
                        className="pl-9"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        data-testid="input-reg-firstname"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-lastname">Nama Belakang</Label>
                    <Input
                      id="reg-lastname"
                      placeholder="Santoso"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      data-testid="input-reg-lastname"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-reg-email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Kirim kode OTP via *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpChannel("wa")}
                      className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${otpChannel === "wa" ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-muted"}`}
                      data-testid="button-otp-channel-wa"
                    >
                      <Phone className="h-4 w-4" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpChannel("email")}
                      className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${otpChannel === "email" ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-muted"}`}
                      data-testid="button-otp-channel-email"
                    >
                      <Mail className="h-4 w-4" /> Email (Gmail)
                    </button>
                  </div>
                  {otpChannel === "email" && (
                    <p className="text-xs text-muted-foreground">Verifikasi via email hanya didukung untuk alamat @gmail.com. Untuk penyedia email lain (Outlook, Yahoo, dll), gunakan WhatsApp.</p>
                  )}
                </div>
                {otpChannel === "wa" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone">Nomor WhatsApp * <span className="text-muted-foreground font-normal">(kode OTP dikirim ke sini)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="08123456789"
                        className="pl-9"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        data-testid="input-reg-phone"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Password * <span className="text-muted-foreground font-normal">(min. 8 karakter)</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPass ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="pl-9 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="input-reg-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm">Konfirmasi Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="Ulangi password"
                      className="pl-9 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      data-testid="input-reg-confirm"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleRegister} disabled={loading} data-testid="button-submit-register">
                  {loading ? "Memproses..." : "Daftar & Kirim OTP"}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <button className="text-primary font-medium hover:underline" onClick={() => setMode("login")}>
                  Masuk
                </button>
              </p>
            </>
          )}

          {/* ── VERIFY OTP ── */}
          {mode === "verify" && (
            <>
              <div className="text-center space-y-2">
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${emailSendError ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {emailSendError
                    ? <AlertTriangle className="h-6 w-6 text-destructive" />
                    : <CheckCircle2 className="h-6 w-6 text-primary" />
                  }
                </div>
                <h1 className="text-lg font-bold">{otpChannel === "email" ? "Verifikasi Email" : "Verifikasi WhatsApp"}</h1>
                <p className="text-sm text-muted-foreground">
                  {otpFallback ? (
                    <>Layanan pengiriman OTP belum dikonfigurasi.</>
                  ) : emailSendError ? (
                    <>Akun berhasil dibuat untuk<br /><span className="font-medium text-foreground">{pendingEmail}</span></>
                  ) : (
                    <>Kode OTP dikirim ke {otpChannel === "email" ? "email" : "WhatsApp"} Anda<br />
                    <span className="font-medium text-foreground">{otpChannel === "email" ? pendingEmail : phone}</span></>
                  )}
                </p>
              </div>

              {/* Send error banner */}
              {emailSendError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-2" data-testid="banner-email-send-error">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-destructive">{otpChannel === "email" ? "Kode OTP gagal terkirim ke email" : "Kode OTP gagal terkirim ke WhatsApp"}</p>
                      <p className="text-xs text-muted-foreground">{emailSendError}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Klik <span className="font-medium">"Kirim ulang kode OTP"</span> di bawah untuk mencoba lagi. Jika masalah berlanjut, hubungi{" "}
                    <a
                      href={`https://wa.me/6282299417818?text=${encodeURIComponent(`Halo, kode OTP saya gagal terkirim di ${partner?.brandName || "Gustafta"}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                      data-testid="link-email-error-support"
                    >
                      tim support
                    </a>.
                  </p>
                </div>
              )}

              {/* OTP Fallback Display — shown when Fonnte not configured */}
              {otpFallback && (
                <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 text-center space-y-1">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Kode OTP Anda</p>
                  <p className="text-3xl font-bold tracking-[0.3em] text-amber-900 dark:text-amber-200 select-all">{otpFallback}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Salin kode ini dan masukkan di bawah</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-code">Kode OTP (6 digit)</Label>
                  <Input
                    id="otp-code"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl font-bold tracking-widest h-12"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    autoFocus
                    data-testid="input-otp"
                  />
                </div>
                <Button className="w-full" onClick={handleVerify} disabled={loading || otp.length !== 6} data-testid="button-verify-otp">
                  {loading ? "Memverifikasi..." : "Verifikasi"}
                </Button>
                <Button variant="ghost" className="w-full text-sm" onClick={handleResendOTP} disabled={loading} data-testid="button-resend-otp">
                  Kirim ulang kode OTP
                </Button>
              </div>

              <button
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => { setMode("choose"); setOtp(""); setOtpFallback(undefined); setEmailSendError(undefined); }}
              >
                ← Kembali ke halaman login
              </button>
            </>
          )}
          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold">Lupa Password</h1>
                  <p className="text-xs text-muted-foreground">Masukkan email akun Anda — kode reset dikirim via WhatsApp atau email sesuai preferensi akun</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email terdaftar</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-9"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
                      autoFocus
                      data-testid="input-forgot-email"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleRequestReset} disabled={loading || !resetEmail} data-testid="button-request-reset">
                  {loading ? "Memproses..." : "Kirim Kode Reset"}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Ingat password?{" "}
                <button className="text-primary font-medium hover:underline" onClick={() => setMode("login")}>
                  Kembali login
                </button>
              </p>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === "reset" && (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Reset Password</h1>
                <p className="text-sm text-muted-foreground">
                  {resetOtpFallback
                    ? <>Email server belum dikonfigurasi — lihat kode di layar</>
                    : <>Kode OTP dikirim ke <span className="font-medium text-foreground">{resetEmail}</span></>
                  }
                </p>
              </div>

              {resetOtpFallback && (
                <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 text-center space-y-1">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Kode OTP Reset</p>
                  <p className="text-3xl font-bold tracking-[0.3em] text-amber-900 dark:text-amber-200 select-all">{resetOtpFallback}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Salin kode ini dan masukkan di bawah</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-otp">Kode OTP (6 digit)</Label>
                  <Input
                    id="reset-otp"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl font-bold tracking-widest h-12"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    data-testid="input-reset-otp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Password Baru <span className="text-muted-foreground font-normal">(min. 8 karakter)</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPass ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="pl-9 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-testid="input-new-password"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      type={showNewPass ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      className="pl-9"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      data-testid="input-confirm-new-password"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleResetPassword} disabled={loading || resetOtp.length !== 6 || !newPassword || !confirmNewPassword} data-testid="button-submit-reset">
                  {loading ? "Memproses..." : "Reset Password"}
                </Button>
                <Button variant="ghost" className="w-full text-sm" onClick={() => { setMode("forgot"); setResetOtp(""); setNewPassword(""); setConfirmNewPassword(""); }} disabled={loading} data-testid="button-back-forgot">
                  ← Minta kode baru
                </Button>
              </div>
            </>
          )}

        </div>

        {/* Admin / Replit OIDC fallback — small discreet link */}
        {mode !== "verify" && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            <button
              type="button"
              onClick={handleReplitLogin}
              className="underline hover:text-foreground"
              data-testid="link-admin-replit-login"
            >
              Masuk sebagai admin (Replit)
            </button>
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          Dengan masuk, Anda menyetujui{" "}
          <a href="#" className="underline hover:text-foreground">Syarat & Ketentuan</a>{" "}
          {partner?.brandName || "Gustafta"}.
        </p>
      </div>
    </div>
  );
}
