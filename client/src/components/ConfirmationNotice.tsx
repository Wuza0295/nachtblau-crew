import type { ConfirmationDelivery } from "@shared/emailAuth";

export default function ConfirmationNotice({
  delivery,
  email,
  title = "Konto angelegt, noch nicht freigeschaltet",
}: {
  delivery: ConfirmationDelivery;
  email: string;
  title?: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm" role="status">
      <p className="font-medium text-foreground">{title}</p>
      {delivery.emailSent ? (
        <p className="text-muted-foreground">
          Wir haben eine E-Mail an {email} geschickt. Prüfe dein Postfach, auch den Spam-Ordner,
          und öffne den Bestätigungslink. Ohne Bestätigung kannst du dich nicht anmelden.
        </p>
      ) : delivery.devConfirmationUrl ? (
        <div className="space-y-2 text-muted-foreground">
          <p>
            Es ist kein SMTP-Server konfiguriert, deshalb wurde keine E-Mail verschickt. Der
            Bestätigungslink steht auch im Server-Log. Dein Konto bleibt gesperrt, bis du ihn
            öffnest.
          </p>
          <a
            id="dev-confirmation-link"
            href={delivery.devConfirmationUrl}
            className="block break-all font-medium text-primary underline underline-offset-4"
          >
            {delivery.devConfirmationUrl}
          </a>
        </div>
      ) : (
        <p className="text-muted-foreground">
          Prüfe dein Postfach und öffne den Bestätigungslink. Ohne Bestätigung bleibt das Konto
          gesperrt.
        </p>
      )}
    </div>
  );
}
