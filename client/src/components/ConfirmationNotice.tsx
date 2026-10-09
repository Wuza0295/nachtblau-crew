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
          Wir haben eine E-Mail an {email} geschickt. Prüfe dein Postfach, auch den Spam-Ordner, und öffne den
          Bestätigungslink. Ohne Bestätigung kannst du dich nicht anmelden.
        </p>
      ) : delivery.devConfirmationUrl ? (
        <div className="space-y-2 text-muted-foreground">
          <p>
            Es ist kein SMTP-Server konfiguriert und die Server-Mail wurde nicht angenommen. Es ist keine E-Mail
            rausgegangen. Der Bestätigungslink steht auch im Server-Log. Dein Konto bleibt gesperrt, bis du ihn
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
          Es ist keine E-Mail rausgegangen. Der Bestätigungslink steht im Server-Log. Ohne diesen Link bleibt das
          Konto gesperrt.
        </p>
      )}
    </div>
  );
}
